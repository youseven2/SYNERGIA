"use client";

import { FormEvent, useCallback, useEffect, useRef, useState } from "react";
import jsQR from "jsqr";
import {
  AttendanceRecord,
  AthleteProfile,
  SynergiaState,
  createRecordId,
  getAthletePaymentStatus,
  loadSynergiaState,
  saveSynergiaState,
} from "@/lib/synergia-store";
import { useI18n } from "@/components/I18nContext";

interface AttendanceControlProps {
  state: SynergiaState;
  onStateChange: (next: SynergiaState) => void;
  recordedBy: string;
  restrictedAthlete?: AthleteProfile;
}

export function AttendanceControl({
  state,
  onStateChange,
  recordedBy,
  restrictedAthlete,
}: AttendanceControlProps) {
  const { t } = useI18n();
  const [manualId, setManualId] = useState(
    restrictedAthlete?.athleteId ?? ""
  );
  const [cameraOpen, setCameraOpen] = useState(false);
  const [cameraError, setCameraError] = useState<string | null>(null);
  const [feedback, setFeedback] = useState<{
    type: "success" | "rejected";
    title: string;
    detail: string;
  } | null>(null);

  const videoRef = useRef<HTMLVideoElement | null>(null);
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const rafRef = useRef<number | null>(null);

  const stopCamera = useCallback(() => {
    if (rafRef.current !== null) {
      cancelAnimationFrame(rafRef.current);
      rafRef.current = null;
    }
    if (streamRef.current) {
      streamRef.current.getTracks().forEach((track) => track.stop());
      streamRef.current = null;
    }
    setCameraOpen(false);
  }, []);

  useEffect(() => {
    return () => {
      stopCamera();
    };
  }, [stopCamera]);

  const validateAndRecord = useCallback(
    (rawCode: string, method: "qr" | "manual") => {
      const normalize = (val: string) =>
        val
          .trim()
          .replace(/^SYNERGIA:\s*/i, "")
          .replace(/\s+/g, "")
          .toUpperCase();

      const cleaned = normalize(rawCode);
      if (!cleaned) return;

      // Sincronizar siempre con el estado más reciente guardado en localStorage
      const freshState = loadSynergiaState();

      const targetAthlete = freshState.athletes.find((a) => {
        const athId = normalize(a.athleteId);
        const docId = normalize(a.documentId || "");
        const user = normalize(a.username || "");
        const appId = normalize(a.applicationId || "");
        return (
          athId === cleaned ||
          (docId && docId === cleaned) ||
          (user && user === cleaned) ||
          (appId && appId === cleaned) ||
          cleaned.includes(athId)
        );
      });

      if (!targetAthlete) {
        // Sincronizar también con aspirantes inscritos desde INSCRIBETE
        const targetApp = freshState.applications.find((app) => {
          const code = normalize(app.trackingCode || "");
          const docId = normalize(app.documentId || "");
          const appId = normalize(app.id || "");
          return (
            (code && code === cleaned) ||
            (docId && docId === cleaned) ||
            (appId && appId === cleaned)
          );
        });

        if (targetApp) {
          const now = new Date();
          const dateKey = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, "0")}-${String(now.getDate()).padStart(2, "0")}`;
          const record: AttendanceRecord = {
            id: createRecordId("att"),
            athleteId: targetApp.trackingCode,
            athleteName: targetApp.fullName,
            category: targetApp.assignedCategory || t("Aspirante Inscrito", "Registered Applicant"),
            timestamp: now.toISOString(),
            dateKey,
            method,
            recordedBy,
          };
          const nextState: SynergiaState = {
            ...freshState,
            attendanceRecords: [record, ...freshState.attendanceRecords],
          };
          saveSynergiaState(nextState);
          onStateChange(nextState);
          setFeedback({
            type: "success",
            title: t(
              "ASISTENCIA VALIDADA (ASPIRANTE INSCRITO)",
              "ATTENDANCE VALIDATED (REGISTERED APPLICANT)"
            ),
            detail: t(
              `${targetApp.fullName} (${targetApp.trackingCode}) · ${record.category} — Registrado en práctica.`,
              `${targetApp.fullName} (${targetApp.trackingCode}) · ${record.category} — Checked in for practice.`
            ),
          });
          return;
        }

        setFeedback({
          type: "rejected",
          title: t("Carnet no encontrado", "ID Card not found"),
          detail: t(
            `No existe ningún atleta o aspirante registrado con el ID "${cleaned}".`,
            `No registered athlete or applicant found with ID "${cleaned}".`
          ),
        });
        return;
      }

      const payStatus = getAthletePaymentStatus(freshState, targetAthlete);

      if (payStatus.isSuspended) {
        setFeedback({
          type: "rejected",
          title: t(
            "ASISTENCIA RECHAZADA · ATLETA SUSPENDIDO",
            "ATTENDANCE REJECTED · ATHLETE SUSPENDED"
          ),
          detail: t(
            `${targetAthlete.fullName} (${targetAthlete.athleteId}) presenta 2 meses consecutivos sin cancelar (${payStatus.previousMonth} y ${payStatus.currentMonth}). Queda suspendido de sus prácticas hasta pagar la totalidad de su mora.`,
            `${targetAthlete.fullName} (${targetAthlete.athleteId}) has 2 consecutive unpaid months (${payStatus.previousMonth} & ${payStatus.currentMonth}). Suspended from practice until full overdue balance is paid.`
          ),
        });
        return;
      }

      if (payStatus.isOverdue) {
        setFeedback({
          type: "rejected",
          title: t(
            "ASISTENCIA RECHAZADA · PAGOS PENDIENTES",
            "ATTENDANCE REJECTED · PENDING PAYMENTS"
          ),
          detail: t(
            `${targetAthlete.fullName} (${targetAthlete.athleteId}) tiene pago pendiente correspondiente al mes ${payStatus.currentMonth} (límite día 15). El sistema no puede validar su asistencia hasta regularizar su pago.`,
            `${targetAthlete.fullName} (${targetAthlete.athleteId}) has a pending payment for ${payStatus.currentMonth} (due 15th). Attendance cannot be validated until payment is settled.`
          ),
        });
        return;
      }

      const now = new Date();
      const dateKey = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, "0")}-${String(now.getDate()).padStart(2, "0")}`;

      const record: AttendanceRecord = {
        id: createRecordId("att"),
        athleteId: targetAthlete.athleteId,
        athleteName: targetAthlete.fullName,
        category: targetAthlete.category,
        timestamp: now.toISOString(),
        dateKey,
        method,
        recordedBy,
      };

      const nextState: SynergiaState = {
        ...freshState,
        attendanceRecords: [record, ...freshState.attendanceRecords],
      };
      saveSynergiaState(nextState);
      onStateChange(nextState);

      setFeedback({
        type: "success",
        title: t("ASISTENCIA VALIDADA", "ATTENDANCE VALIDATED"),
        detail: t(
          `${targetAthlete.fullName} (${targetAthlete.athleteId}) · ${targetAthlete.category} — Solvente al día.`,
          `${targetAthlete.fullName} (${targetAthlete.athleteId}) · ${targetAthlete.category} — Account up to date.`
        ),
      });
    },
    [onStateChange, recordedBy, t]
  );

  async function startCameraScanner() {
    setCameraError(null);
    setFeedback(null);
    if (
      typeof navigator === "undefined" ||
      !navigator.mediaDevices ||
      !navigator.mediaDevices.getUserMedia
    ) {
      setCameraError(
        t(
          "Tu navegador o dispositivo no permite acceso a la cámara. Usa el ingreso manual del ID.",
          "Your browser or device does not allow camera access. Use manual ID entry."
        )
      );
      return;
    }

    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        video: { facingMode: "environment" },
      });
      streamRef.current = stream;
      setCameraOpen(true);

      requestAnimationFrame(() => {
        if (videoRef.current) {
          videoRef.current.srcObject = stream;
          videoRef.current.play().catch(() => {});
        }
        scanFrame();
      });
    } catch {
      setCameraError(
        t(
          "No se pudo abrir la cámara. Verifica los permisos del navegador.",
          "Could not open camera. Please check browser permissions."
        )
      );
    }
  }

  function scanFrame() {
    const video = videoRef.current;
    const canvas = canvasRef.current;
    if (!video || !canvas || !streamRef.current) return;

    if (video.readyState === video.HAVE_ENOUGH_DATA) {
      canvas.width = video.videoWidth;
      canvas.height = video.videoHeight;
      const ctx = canvas.getContext("2d");
      if (ctx) {
        ctx.drawImage(video, 0, 0, canvas.width, canvas.height);
        const imgData = ctx.getImageData(0, 0, canvas.width, canvas.height);
        const code = jsQR(imgData.data, imgData.width, imgData.height, {
          inversionAttempts: "attemptBoth",
        });
        if (code && code.data) {
          stopCamera();
          validateAndRecord(code.data, "qr");
          return;
        }
      }
    }
    rafRef.current = requestAnimationFrame(scanFrame);
  }

  function handleManualSubmit(e: FormEvent) {
    e.preventDefault();
    validateAndRecord(manualId, "manual");
  }

  const visibleRecords = restrictedAthlete
    ? state.attendanceRecords.filter(
        (r) => r.athleteId === restrictedAthlete.athleteId
      )
    : state.attendanceRecords;

  return (
    <div className="grid gap-6 lg:grid-cols-2">
      {/* Panel de Escaneo QR e ID */}
      <div className="rounded-3xl border border-white/10 bg-[#0D1322] p-6 space-y-5">
        <div>
          <h2 className="text-lg font-bold text-white">
            {t("Control de Asistencia (QR y Carnet)", "Attendance Control (QR & ID Card)")}
          </h2>
          <p className="mt-1 text-xs text-slate-400">
            {t(
              "Escanea el código QR del carnet con la cámara o ingresa el ID del atleta. El sistema rechaza automáticamente a atletas morosos o suspendidos.",
              "Scan the ID card QR code with the camera or enter the athlete ID. The system automatically rejects overdue or suspended athletes."
            )}
          </p>
        </div>

        {/* Botón para aperturar cámara y leer QR */}
        <div className="space-y-3">
          {!cameraOpen ? (
            <button
              type="button"
              onClick={startCameraScanner}
              className="flex w-full items-center justify-center gap-2 rounded-xl bg-[#7E3D97] py-3 text-sm font-bold text-white shadow-lg shadow-[#7E3D97]/25 hover:bg-[#914BAE] cursor-pointer"
            >
              <svg
                className="h-5 w-5"
                fill="none"
                viewBox="0 0 24 24"
                strokeWidth={2}
                stroke="currentColor"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  d="M6.827 6.175A2.31 2.31 0 015.186 7.23c-.38.054-.757.112-1.134.175C2.999 7.58 2.25 8.507 2.25 9.574V18a2.25 2.25 0 002.25 2.25h15A2.25 2.25 0 0021.75 18V9.574c0-1.067-.75-1.994-1.802-2.169a47.865 47.865 0 00-1.134-.175 2.31 2.31 0 01-1.64-1.055l-.822-1.316a2.192 2.192 0 00-1.736-1.039 48.774 48.774 0 00-5.232 0 2.192 2.192 0 00-1.736 1.039l-.821 1.316z"
                />
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  d="M16.5 12.75a4.5 4.5 0 11-9 0 4.5 4.5 0 019 0z"
                />
              </svg>
              {t("Abrir Cámara y Leer Código QR", "Open Camera & Scan QR Code")}
            </button>
          ) : (
            <div className="space-y-2 rounded-2xl border border-[#00B7A4]/40 bg-[#070B14] p-3">
              <video
                ref={videoRef}
                playsInline
                muted
                className="w-full max-h-64 rounded-xl object-cover"
              />
              <canvas ref={canvasRef} className="hidden" />
              <button
                type="button"
                onClick={stopCamera}
                className="w-full rounded-xl border border-rose-500/40 bg-rose-500/15 py-2 text-xs font-bold text-rose-200 hover:bg-rose-500/25 cursor-pointer"
              >
                {t("Cerrar Cámara", "Close Camera")}
              </button>
            </div>
          )}

          {cameraError && (
            <div className="rounded-xl border border-amber-400/35 bg-amber-400/10 p-3 text-xs text-amber-200">
              {cameraError}
            </div>
          )}
        </div>

        {/* Ingreso manual del ID del Carnet */}
        <form onSubmit={handleManualSubmit} className="space-y-3 border-t border-white/10 pt-4">
          <div className="flex flex-wrap items-center justify-between gap-2">
            <label className="block text-xs font-semibold text-slate-200">
              {t("O ingresa el ID del Carnet manualmente", "Or enter ID Card number manually")}
            </label>
            {!restrictedAthlete && (
              <span className="text-[10px] font-semibold text-emerald-300">
                {state.athletes.length} {t("atletas", "athletes")} · {state.applications.length} {t("inscritos sincronizados", "synced")}
              </span>
            )}
          </div>
          <div className="flex flex-col sm:flex-row gap-2">
            <input
              type="text"
              required
              list={restrictedAthlete ? undefined : "synced-athlete-ids"}
              value={manualId}
              onChange={(e) => setManualId(e.target.value)}
              placeholder="Ej. V-28450123-001"
              className="flex-1 rounded-xl border border-white/15 bg-[#070B14] px-3.5 py-2.5 text-sm font-mono text-white focus:border-[#00B7A4] focus:outline-none"
            />
            {!restrictedAthlete && (
              <datalist id="synced-athlete-ids">
                {state.athletes.map((a) => (
                  <option key={a.athleteId} value={a.athleteId}>
                    {a.fullName} · {a.category}
                  </option>
                ))}
                {state.applications
                  .filter((app) => app.status !== "formalizado")
                  .map((app) => (
                    <option key={app.id} value={app.trackingCode}>
                      {app.fullName} · {t("Inscrito", "Applicant")}
                    </option>
                  ))}
              </datalist>
            )}
            <button
              type="submit"
              className="rounded-xl bg-[#00B7A4] px-5 py-2.5 text-xs font-bold text-slate-950 hover:bg-[#14CEBA] cursor-pointer shrink-0"
            >
              {t("Validar Asistencia", "Validate Attendance")}
            </button>
          </div>
        </form>

        {/* Resultado de validación */}
        {feedback && (
          <div
            className={`rounded-2xl border p-4 text-xs space-y-1 ${
              feedback.type === "success"
                ? "border-emerald-500/40 bg-emerald-500/15 text-emerald-100"
                : "border-rose-500/50 bg-rose-500/20 text-rose-100"
            }`}
          >
            <p className="text-sm font-extrabold">{feedback.title}</p>
            <p className="leading-relaxed">{feedback.detail}</p>
          </div>
        )}
      </div>

      {/* Historial de asistencias validadas */}
      <div className="rounded-3xl border border-white/10 bg-[#0D1322] p-6 space-y-4">
        <h2 className="text-lg font-bold text-white">
          {t("Asistencias Validadas", "Validated Attendance")} ({visibleRecords.length})
        </h2>

        {visibleRecords.length === 0 ? (
          <p className="py-10 text-center text-xs text-slate-400">
            {t("No hay asistencias registradas todavía.", "No attendance records yet.")}
          </p>
        ) : (
          <div className="space-y-2.5 max-h-[460px] overflow-y-auto pr-1">
            {visibleRecords.map((rec) => (
              <div
                key={rec.id}
                className="flex items-center justify-between gap-3 rounded-2xl border border-white/10 bg-[#070B14]/80 p-3.5 text-xs"
              >
                <div className="min-w-0">
                  <p className="truncate font-bold text-white">{rec.athleteName}</p>
                  <p className="font-mono text-[11px] text-amber-300">{rec.athleteId}</p>
                  <p className="truncate text-[11px] text-slate-400">{rec.category}</p>
                </div>
                <div className="text-right shrink-0">
                  <span className="rounded-md bg-emerald-500/20 px-2 py-0.5 text-[10px] font-bold uppercase text-emerald-300">
                    {rec.method === "qr" ? "QR" : "ID"}
                  </span>
                  <p className="mt-1 text-[11px] text-slate-400">
                    {rec.dateKey}
                  </p>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
