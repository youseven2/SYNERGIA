"use client";

import { ChangeEvent, FormEvent, useState } from "react";
import {
  AthletePayment,
  AthleteProfile,
  MaterialRequest,
  MaterialType,
  PaymentMethod,
  SynergiaState,
  calculateAge,
  getAthletePaymentStatus,
  getCurrentMonthKey,
  saveSynergiaState,
} from "@/lib/synergia-store";
import { generateAthleteProfilePdf } from "@/lib/pdf-report";
import { AthleteCarnet } from "@/components/AthleteCarnet";
import { AttendanceControl } from "@/components/sistema/AttendanceControl";
import { useDevice } from "@/components/DeviceContext";
import { useI18n } from "@/components/I18nContext";

interface AthletePortalProps {
  athlete: AthleteProfile;
  state: SynergiaState;
  onStateChange: (next: SynergiaState) => void;
  onUpdateAthlete: (updated: AthleteProfile) => void;
  onLogout: () => void;
}

type AthleteTab =
  | "perfil"
  | "carnet"
  | "pagos"
  | "solicitudes"
  | "agenda"
  | "asistencia";

const BLOOD_TYPES = ["O+", "O-", "A+", "A-", "B+", "B-", "AB+", "AB-"];
const MATERIAL_TYPES: MaterialType[] = [
  "Uniforme",
  "Zapatos",
  "Lazos",
  "Otro material",
];

export function AthletePortal({
  athlete,
  state,
  onStateChange,
  onUpdateAthlete,
  onLogout,
}: AthletePortalProps) {
  const { isMobile } = useDevice();
  const { t } = useI18n();
  const [activeTab, setActiveTab] = useState<AthleteTab>("perfil");
  const [athleteFlyerModal, setAthleteFlyerModal] = useState<{
    title: string;
    url: string;
  } | null>(null);

  // Cambio de clave obligatorio si tiene clave provisional
  const [newPass, setNewPass] = useState("");
  const [confirmPass, setConfirmPass] = useState("");
  const [passError, setPassError] = useState<string | null>(null);

  // Formulario oficial de formalización del atleta
  const [fullName, setFullName] = useState(athlete.fullName);
  const [birthDate, setBirthDate] = useState(athlete.birthDate);
  const [age, setAge] = useState(String(athlete.age || ""));
  const [documentId, setDocumentId] = useState(athlete.documentId || "");
  const [bloodType, setBloodType] = useState(athlete.bloodType || "O+");
  const [hasMedicalCondition, setHasMedicalCondition] = useState<boolean>(
    Boolean(athlete.hasMedicalCondition)
  );
  const [medicalConditionDetail, setMedicalConditionDetail] = useState(
    athlete.medicalConditionDetail || ""
  );
  const [hasAllergies, setHasAllergies] = useState(athlete.hasAllergies);
  const [allergiesDetail, setAllergiesDetail] = useState(
    athlete.allergiesDetail
  );
  const [repName, setRepName] = useState(
    athlete.repName || (!athlete.isMinor ? athlete.fullName : "")
  );
  const [repDocumentId, setRepDocumentId] = useState(
    athlete.repDocumentId || (!athlete.isMinor ? athlete.documentId : "")
  );
  const [repPhone, setRepPhone] = useState(
    athlete.repPhone || athlete.phone || ""
  );
  const [repSecondaryPhone, setRepSecondaryPhone] = useState(
    athlete.repSecondaryPhone || athlete.emergencyPhone || ""
  );
  const [clubJoinDate, setClubJoinDate] = useState(
    athlete.clubJoinDate || athlete.formalizedAt.slice(0, 10)
  );
  const [homeAddress, setHomeAddress] = useState(athlete.homeAddress);
  const [photoDataUrl, setPhotoDataUrl] = useState(athlete.photoDataUrl);
  const [athleteIdDocName, setAthleteIdDocName] = useState(
    athlete.athleteIdDocName || ""
  );
  const [athleteIdDocDataUrl, setAthleteIdDocDataUrl] = useState(
    athlete.athleteIdDocDataUrl || ""
  );
  const [repIdDocName, setRepIdDocName] = useState(athlete.repIdDocName || "");
  const [repIdDocDataUrl, setRepIdDocDataUrl] = useState(
    athlete.repIdDocDataUrl || ""
  );
  const [acceptedTerms, setAcceptedTerms] = useState(
    Boolean(athlete.acceptedTerms)
  );
  const [acceptedWaiver, setAcceptedWaiver] = useState(
    Boolean(athlete.acceptedWaiver)
  );
  const [fileError, setFileError] = useState<string | null>(null);
  const [savedSuccess, setSavedSuccess] = useState(false);

  // Módulo de Pagos state
  const currentMonth = getCurrentMonthKey();
  const [payMethod, setPayMethod] = useState<PaymentMethod>("pago_movil");
  const [payMonth, setPayMonth] = useState(currentMonth);
  const [payAmount, setPayAmount] = useState(String(state.monthlyFee || 30));
  const [payBank, setPayBank] = useState("");
  const [payReference, setPayReference] = useState("");
  const [payDocId, setPayDocId] = useState(athlete.documentId || "");
  const [payPhone, setPayPhone] = useState(athlete.phone || "");
  const [payCashPhoto, setPayCashPhoto] = useState("");
  const [payNotes, setPayNotes] = useState("");
  const [paySuccess, setPaySuccess] = useState<string | null>(null);

  // Módulo de Solicitudes state
  const [reqType, setReqType] = useState<MaterialType>("Uniforme");
  const [reqDetail, setReqDetail] = useState("");
  const [reqQty, setReqQty] = useState("1");
  const [reqNotes, setReqNotes] = useState("");
  const [reqSuccess, setReqSuccess] = useState<string | null>(null);

  function commitState(next: SynergiaState) {
    saveSynergiaState(next);
    onStateChange(next);
  }

  function handleCashPhotoUpload(e: ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = () => {
      if (typeof reader.result === "string") {
        setPayCashPhoto(reader.result);
      }
    };
    reader.readAsDataURL(file);
  }

  function handleSubmitPayment(e: FormEvent) {
    e.preventDefault();
    setPaySuccess(null);

    if (payMethod === "efectivo" && !payCashPhoto) {
      return;
    }

    const newPayment: AthletePayment = {
      id: `pay-${Date.now()}`,
      athleteId: athlete.athleteId,
      athleteName: athlete.fullName,
      monthKey: payMonth,
      method: payMethod,
      amount: Math.max(1, Number(payAmount) || state.monthlyFee || 30),
      bank: payMethod !== "efectivo" ? payBank.trim() : undefined,
      reference: payMethod !== "efectivo" ? payReference.trim() : undefined,
      documentId: payMethod !== "efectivo" ? payDocId.trim() : undefined,
      phone: payMethod === "pago_movil" ? payPhone.trim() : undefined,
      cashPhotoDataUrl: payMethod === "efectivo" ? payCashPhoto : undefined,
      notes: payNotes.trim(),
      status: "pendiente",
      createdAt: new Date().toISOString(),
    };

    commitState({
      ...state,
      payments: [newPayment, ...state.payments],
    });

    setPayBank("");
    setPayReference("");
    setPayCashPhoto("");
    setPayNotes("");
    setPaySuccess(
      t(
        "Pago registrado correctamente. Queda pendiente de verificación y aprobación por los entrenadores.",
        "Payment registered successfully. Pending verification and approval by coaches."
      )
    );
  }

  function handleSubmitRequest(e: FormEvent) {
    e.preventDefault();
    setReqSuccess(null);

    const newReq: MaterialRequest = {
      id: `req-${Date.now()}`,
      athleteId: athlete.athleteId,
      athleteName: athlete.fullName,
      category: athlete.category,
      itemType: reqType,
      detail: reqDetail.trim(),
      quantity: Math.max(1, Number(reqQty) || 1),
      notes: reqNotes.trim(),
      status: "pendiente",
      createdAt: new Date().toISOString(),
    };

    commitState({
      ...state,
      materialRequests: [newReq, ...state.materialRequests],
    });

    setReqDetail("");
    setReqQty("1");
    setReqNotes("");
    setReqSuccess(
      t(
        "Solicitud enviada a los entrenadores correctamente.",
        "Request sent to coaches successfully."
      )
    );
  }

  function handleMarkNotificationRead(notifId: string) {
    commitState({
      ...state,
      paymentNotifications: state.paymentNotifications.map((n) =>
        n.id === notifId ? { ...n, read: true } : n
      ),
    });
  }

  function handleMarkEventNoticeRead(evNotifId: string) {
    commitState({
      ...state,
      eventNotifications: state.eventNotifications.map((n) =>
        n.id === evNotifId
          ? {
              ...n,
              readByAthleteIds: n.readByAthleteIds.includes(athlete.athleteId)
                ? n.readByAthleteIds
                : [...n.readByAthleteIds, athlete.athleteId],
            }
          : n
      ),
    });
  }

  function handlePasswordChange(e: FormEvent) {
    e.preventDefault();
    setPassError(null);
    if (newPass.length < 6) {
      setPassError("La nueva clave debe tener al menos 6 caracteres.");
      return;
    }
    if (newPass === "123456") {
      setPassError("Debes elegir una clave distinta a la provisional (123456).");
      return;
    }
    if (newPass !== confirmPass) {
      setPassError("Las contraseñas no coinciden.");
      return;
    }
    onUpdateAthlete({
      ...athlete,
      password: newPass,
      mustChangePassword: false,
    });
  }

  function handlePhotoUpload(e: ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = () => {
      if (typeof reader.result === "string") {
        setPhotoDataUrl(reader.result);
      }
    };
    reader.readAsDataURL(file);
  }

  function handleDocUpload(
    e: ChangeEvent<HTMLInputElement>,
    target: "athleteDoc" | "repDoc"
  ) {
    setFileError(null);
    const file = e.target.files?.[0];
    if (!file) return;
    if (file.size > 10 * 1024 * 1024) {
      setFileError("El archivo supera el tamaño máximo permitido de 10 MB.");
      return;
    }
    const reader = new FileReader();
    reader.onload = () => {
      if (typeof reader.result === "string") {
        if (target === "athleteDoc") {
          setAthleteIdDocName(file.name);
          setAthleteIdDocDataUrl(reader.result);
        } else {
          setRepIdDocName(file.name);
          setRepIdDocDataUrl(reader.result);
        }
      }
    };
    reader.readAsDataURL(file);
  }

  function handleBirthDateChange(val: string) {
    setBirthDate(val);
    const calc = calculateAge(val);
    if (calc !== null) setAge(String(calc));
  }

  function handleSaveProfile(e: FormEvent) {
    e.preventDefault();
    setFileError(null);
    if (!acceptedTerms || !acceptedWaiver) {
      setFileError(
        "Debes aceptar los Términos y Condiciones y el Relevo de Responsabilidad para formalizar tu inscripción."
      );
      return;
    }
    const parsedAge = Math.max(1, Number(age) || athlete.age || 10);
    onUpdateAthlete({
      ...athlete,
      fullName: fullName.trim(),
      birthDate,
      age: parsedAge,
      isMinor: parsedAge < 18,
      documentId: documentId.trim(),
      bloodType,
      hasMedicalCondition,
      medicalConditionDetail: hasMedicalCondition
        ? medicalConditionDetail.trim()
        : "",
      hasAllergies,
      allergiesDetail: hasAllergies ? allergiesDetail.trim() : "",
      medications: hasMedicalCondition ? medicalConditionDetail.trim() : "Ninguno",
      medicalNotes: hasMedicalCondition ? medicalConditionDetail.trim() : "",
      repName: repName.trim(),
      repDocumentId: repDocumentId.trim(),
      repPhone: repPhone.trim(),
      repSecondaryPhone: repSecondaryPhone.trim(),
      emergencyContact: repName.trim(),
      emergencyPhone: repSecondaryPhone.trim() || repPhone.trim(),
      homeAddress: homeAddress.trim(),
      clubJoinDate,
      photoDataUrl,
      athleteIdDocName,
      athleteIdDocDataUrl,
      repIdDocName,
      repIdDocDataUrl,
      acceptedTerms,
      acceptedWaiver,
      profileCompleted: true,
    });
    setSavedSuccess(true);
  }

  if (athlete.mustChangePassword) {
    return (
      <div className="mx-auto max-w-md py-16 px-4">
        <div className="rounded-3xl border border-amber-400/30 bg-[#0D1322] p-8 shadow-2xl space-y-5">
          <div>
            <span className="text-[11px] font-bold uppercase tracking-wider text-amber-300">
              Primer Ingreso · Cambio de Clave Obligatorio
            </span>
            <h1 className="mt-1 text-2xl font-extrabold text-white">
              Hola, {athlete.fullName}
            </h1>
            <p className="mt-2 text-xs text-slate-300">
              Ingresaste con tu clave provisional (<strong>123456</strong>).
              Por seguridad, debes crear tu nueva contraseña personal para
              continuar a tu perfil.
            </p>
          </div>

          <form onSubmit={handlePasswordChange} className="space-y-4">
            <div>
              <label className="block text-xs font-semibold text-slate-200">
                Nueva contraseña *
              </label>
              <input
                type="password"
                required
                value={newPass}
                onChange={(e) => setNewPass(e.target.value)}
                placeholder="Mínimo 6 caracteres"
                className="mt-1.5 w-full rounded-xl border border-white/15 bg-[#070B14] px-4 py-3 text-sm text-white focus:border-emerald-400 focus:outline-none"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-200">
                Confirmar nueva contraseña *
              </label>
              <input
                type="password"
                required
                value={confirmPass}
                onChange={(e) => setConfirmPass(e.target.value)}
                placeholder="Repite tu nueva contraseña"
                className="mt-1.5 w-full rounded-xl border border-white/15 bg-[#070B14] px-4 py-3 text-sm text-white focus:border-emerald-400 focus:outline-none"
              />
            </div>

            {passError && (
              <div className="rounded-xl border border-rose-500/30 bg-rose-500/10 p-3 text-xs text-rose-200">
                {passError}
              </div>
            )}

            <button
              type="submit"
              className="w-full rounded-xl bg-emerald-500 py-3 text-sm font-bold text-slate-950 hover:bg-emerald-400 cursor-pointer"
            >
              Actualizar Clave e Ir a Mi Perfil
            </button>
          </form>
        </div>
      </div>
    );
  }

  const myPayments = state.payments.filter(
    (p) => p.athleteId === athlete.athleteId
  );
  const myRequests = state.materialRequests.filter(
    (r) => r.athleteId === athlete.athleteId
  );
  const unreadNotifs = state.paymentNotifications.filter(
    (n) => n.athleteId === athlete.athleteId && !n.read
  );
  const unreadEventNotices = state.eventNotifications.filter(
    (ev) =>
      !ev.readByAthleteIds.includes(athlete.athleteId) &&
      (ev.targetCategories.includes("TODAS") ||
        ev.targetCategories.includes(athlete.category))
  );

  return (
    <div
      className={`mx-auto max-w-5xl space-y-6 ${
        isMobile ? "px-3 py-5" : "px-4 py-8 sm:px-6 lg:px-8"
      }`}
    >
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 rounded-2xl border border-white/10 bg-[#0D1322] p-5">
        <div>
          <span className="text-[11px] font-bold uppercase tracking-wider text-emerald-400">
            {t("Portal Exclusivo del Atleta · SYNERGIA ALL STARS", "Exclusive Athlete Portal · SYNERGIA ALL STARS")}
          </span>
          <h1 className="mt-1 text-2xl font-extrabold text-white">
            {athlete.fullName}
          </h1>
          <p className="text-xs text-slate-300 mt-1">
            ID Oficial:{" "}
            <strong className="font-mono text-amber-300">
              {athlete.athleteId}
            </strong>{" "}
            · Usuario: <strong className="font-mono">{athlete.username}</strong>
          </p>
        </div>

        <button
          type="button"
          onClick={onLogout}
          className="rounded-xl border border-white/15 px-4 py-2 text-xs font-semibold text-slate-300 hover:bg-white/5 cursor-pointer"
        >
          {t("Cerrar Sesión", "Sign Out")}
        </button>
      </div>

      {/* Notificaciones de pago pendiente enviadas por entrenadores */}
      {unreadNotifs.length > 0 && (
        <div className="space-y-2">
          {unreadNotifs.map((notif) => (
            <div
              key={notif.id}
              className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 rounded-2xl border border-rose-500/40 bg-rose-500/15 p-4 text-xs text-rose-100"
            >
              <div>
                <p className="font-extrabold uppercase tracking-wider text-rose-300">
                  {t("Aviso de Pago Pendiente", "Pending Payment Notice")} · {notif.monthKey}
                </p>
                <p className="mt-1 text-sm text-white">{notif.message}</p>
              </div>
              <div className="flex items-center gap-2 shrink-0">
                <button
                  type="button"
                  onClick={() => setActiveTab("pagos")}
                  className="rounded-xl bg-emerald-500 px-3 py-2 text-xs font-bold text-slate-950 hover:bg-emerald-400 cursor-pointer"
                >
                  {t("Ir a Pagar", "Go to Pay")}
                </button>
                <button
                  type="button"
                  onClick={() => handleMarkNotificationRead(notif.id)}
                  className="rounded-xl border border-white/20 px-3 py-2 text-xs font-semibold text-white hover:bg-white/10 cursor-pointer"
                >
                  {t("Entendido", "Dismiss")}
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Avisos y Recordatorios de Eventos para la categoría del atleta */}
      {unreadEventNotices.length > 0 && (
        <div className="space-y-2.5">
          {unreadEventNotices.map((ev) => (
            <div
              key={ev.id}
              className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 rounded-2xl border border-[#00B7A4]/45 bg-[#00B7A4]/15 p-4 text-xs text-slate-100"
            >
              <div className="space-y-1">
                <div className="flex flex-wrap items-center gap-2">
                  <span className="font-extrabold uppercase tracking-wider text-[#4CE4D4]">
                    {t("Aviso de Evento", "Event Notice")} · {ev.eventDate}
                  </span>
                  <span className="rounded-md bg-[#7E3D97]/40 px-2 py-0.5 text-[10px] font-bold text-purple-100">
                    {t(
                      `Recordatorio (${ev.reminderDaysBefore} días antes)`,
                      `Reminder (${ev.reminderDaysBefore} days before)`
                    )}
                  </span>
                </div>
                <p className="text-sm font-bold text-white">{ev.eventTitle}</p>
                <p className="text-slate-200">
                  {ev.eventTime} · {ev.eventLocation}
                </p>
                {ev.message && <p className="text-slate-300">{ev.message}</p>}
              </div>
              <button
                type="button"
                onClick={() => handleMarkEventNoticeRead(ev.id)}
                className="shrink-0 rounded-xl border border-white/20 bg-white/10 px-3.5 py-2 text-xs font-bold text-white hover:bg-white/20 cursor-pointer"
              >
                {t("Entendido", "Got it")}
              </button>
            </div>
          ))}
        </div>
      )}

      {/* Botones ordenados de módulos exclusivos del atleta */}
      {(() => {
        const payStatus = getAthletePaymentStatus(state, athlete);
        return payStatus.isSuspended ? (
          <div className="rounded-2xl border border-rose-500/50 bg-rose-500/20 p-4 text-xs text-rose-100">
            <p className="text-sm font-extrabold text-rose-200">
              {t(
                "ATLETA SUSPENDIDO DE PRÁCTICAS (2 MESES EN MORA)",
                "ATHLETE SUSPENDED FROM PRACTICE (2 MONTHS OVERDUE)"
              )}
            </p>
            <p className="mt-1">
              {t(
                `Tienes 2 meses consecutivos pendientes (${payStatus.previousMonth} y ${payStatus.currentMonth}). Tu asistencia será rechazada hasta cancelar la totalidad de tu mora en el Módulo de Pagos.`,
                `You have 2 consecutive unpaid months (${payStatus.previousMonth} & ${payStatus.currentMonth}). Attendance will be rejected until full overdue balance is paid in the Payments Module.`
              )}
            </p>
          </div>
        ) : null;
      })()}

      {!athlete.profileCompleted ? (
        <div className="rounded-2xl border border-amber-400/40 bg-amber-400/10 p-4 text-xs text-amber-100">
          <p className="text-sm font-extrabold text-amber-300">
            {t(
              "Paso Obligatorio: Formaliza tu Inscripción por Primera Vez",
              "Required Step: Formalize Your First-Time Registration"
            )}
          </p>
          <p className="mt-1">
            {t(
              "Completa los datos faltantes del formulario, adjunta tu foto tipo carnet en fondo blanco y acepta los Términos y Relevo para habilitar tu Carnet, Método de Pago, Solicitudes de Materiales y Agenda de Eventos.",
              "Complete the missing form details, attach your white-background ID photo and accept the Terms & Waiver to unlock your ID Card, Payments, Material Requests and Events Agenda."
            )}
          </p>
        </div>
      ) : (
        <div
          className={`gap-3 ${
            isMobile ? "grid grid-cols-1" : "grid grid-cols-2 lg:grid-cols-3"
          }`}
        >
          {(
            [
              {
                key: "perfil",
                title: t("Perfil del Atleta", "Athlete Profile"),
                subtitle: t("Ficha oficial y reporte PDF", "Official sheet & PDF report"),
                badge: 0,
              },
              {
                key: "carnet",
                title: t("Carnet", "ID Card"),
                subtitle: t("Carnet vertical oficial con QR", "Vertical official ID card with QR"),
                badge: 0,
              },
              {
                key: "pagos",
                title: t("Método de Pago", "Payment Method"),
                subtitle: t("Transferencia, Pago Móvil, Efectivo", "Transfer, Mobile Pay, Cash"),
                badge: unreadNotifs.length,
              },
              {
                key: "solicitudes",
                title: t("Solicitudes de Materiales", "Material Requests"),
                subtitle: t("Uniformes, zapatos, lazos", "Uniforms, shoes, bows"),
                badge: myRequests.filter((r) => r.status === "pendiente").length,
              },
              {
                key: "agenda",
                title: t("Agenda de Eventos", "Events Agenda"),
                subtitle: t("Visualización de eventos del club", "View club events"),
                badge: unreadEventNotices.length,
              },
              {
                key: "asistencia",
                title: t("Control de Asistencia", "Attendance Control"),
                subtitle: t("Validar QR o ID de carnet", "Validate QR or ID card"),
                badge: 0,
              },
            ] as const
          ).map((mod) => (
            <button
              key={mod.key}
              type="button"
              onClick={() => setActiveTab(mod.key)}
              className={`flex items-center justify-between gap-3 rounded-2xl border p-4 text-left transition-all cursor-pointer ${
                activeTab === mod.key
                  ? "border-[#00B7A4] bg-[#00B7A4]/15 shadow-lg shadow-[#00B7A4]/10"
                  : "border-white/10 bg-[#0D1322] hover:border-[#9D5BB8]/50 hover:bg-[#131B2E]"
              }`}
            >
              <div>
                <p className="text-sm font-extrabold text-white">{mod.title}</p>
                <p className="mt-0.5 text-[11px] text-slate-400">{mod.subtitle}</p>
              </div>
              {mod.badge > 0 && (
                <span className="rounded-full bg-amber-400/20 px-2.5 py-0.5 text-xs font-extrabold text-amber-300 border border-amber-400/30">
                  {mod.badge}
                </span>
              )}
            </button>
          ))}
        </div>
      )}

      {athlete.profileCompleted && activeTab === "carnet" && (
        <AthleteCarnet athlete={athlete} />
      )}

      {athlete.profileCompleted && activeTab === "agenda" && (
        <section className="space-y-4 rounded-3xl border border-white/10 bg-[#0D1322] p-6">
          <div>
            <h2 className="text-lg font-bold text-white">
              {t("Agenda de Eventos SYNERGIA ALL STARS", "SYNERGIA ALL STARS Events Agenda")}
            </h2>
            <p className="mt-1 text-xs text-slate-400">
              {t(
                "Visualización de eventos programados desde el sistema administrativo.",
                "Read-only view of events scheduled from the administrative system."
              )}
            </p>
          </div>
          {state.events.length === 0 ? (
            <p className="py-8 text-center text-xs text-slate-400">
              {t("No hay eventos programados por el momento.", "No events scheduled at this time.")}
            </p>
          ) : (
            <div className="grid gap-4 sm:grid-cols-2">
              {state.events.map((ev) => (
                <div
                  key={ev.id}
                  className="rounded-2xl border border-[#00B7A4]/30 bg-[#070B14]/85 p-4 text-xs space-y-1.5"
                >
                  <div className="flex items-center justify-between gap-2">
                    <span className="font-mono font-bold text-amber-300">{ev.date}</span>
                    <span className="rounded-full bg-[#7E3D97]/30 px-2 py-0.5 text-[10px] font-bold text-purple-200">
                      {ev.category}
                    </span>
                  </div>
                  <p className="text-sm font-bold text-white">{ev.title}</p>
                  <p className="text-slate-300">{ev.time}</p>
                  {ev.location && <p className="text-[#4CE4D4]">{ev.location}</p>}
                  {ev.description && (
                    <p className="text-slate-400 leading-relaxed">{ev.description}</p>
                  )}
                  {ev.flyerDataUrl && (
                    <button
                      type="button"
                      onClick={() =>
                        setAthleteFlyerModal({
                          title: ev.title,
                          url: ev.flyerDataUrl!,
                        })
                      }
                      className="mt-1 inline-flex items-center gap-1.5 rounded-lg border border-[#9D5BB8]/50 bg-[#7E3D97]/25 px-3 py-1.5 text-[11px] font-bold text-purple-100 hover:bg-[#7E3D97]/45 cursor-pointer"
                    >
                      {t("Ver Flyer", "View Flyer")}
                    </button>
                  )}
                </div>
              ))}
            </div>
          )}
        </section>
      )}

      {athlete.profileCompleted && activeTab === "asistencia" && (
        <AttendanceControl
          state={state}
          onStateChange={onStateChange}
          recordedBy={athlete.username}
          restrictedAthlete={athlete}
        />
      )}

      {(!athlete.profileCompleted || activeTab === "perfil") && (
        <>

      {/* Formulario oficial de formalización del atleta */}
      <form
        onSubmit={handleSaveProfile}
        className="rounded-3xl border border-white/10 bg-[#0D1322] p-5 sm:p-8 space-y-6"
      >
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div>
            <h2 className="text-lg font-bold text-white">
              Formulario Oficial de Formalización · Perfil del Atleta
            </h2>
            <p className="text-xs text-slate-400 mt-1">
              Completa todos los campos obligatorios y adjunta tu foto tipo carnet en fondo blanco para generar tu carnet y perfil membretado en PDF.
            </p>
          </div>
          <button
            type="button"
            onClick={() => generateAthleteProfilePdf(athlete)}
            className="shrink-0 rounded-xl border border-[#4CE4D4]/40 bg-[#00B7A4]/15 px-4 py-2 text-xs font-bold text-[#4CE4D4] hover:bg-[#00B7A4]/25 cursor-pointer"
          >
            Perfil del Atleta
          </button>
        </div>

        {/* Datos precargados de inscripción */}
        <div className="grid gap-4 sm:grid-cols-3 rounded-2xl border border-white/10 bg-[#070B14]/70 p-4 text-xs">
          <div>
            <span className="text-slate-400 block">ID Oficial del Atleta:</span>
            <span className="font-mono font-bold text-amber-300">
              {athlete.athleteId}
            </span>
          </div>
          <div>
            <span className="text-slate-400 block">Categoría Asignada:</span>
            <span className="font-semibold text-emerald-300">
              {athlete.category}
            </span>
          </div>
          <div>
            <span className="text-slate-400 block">Posición:</span>
            <span className="font-semibold text-white">
              {athlete.position}
            </span>
          </div>
        </div>

        <div className="grid gap-5 sm:grid-cols-2">
          <div className="sm:col-span-2">
            <label className="block text-sm font-semibold text-slate-200">
              Nombre Completo y Apellido del Deportista *
            </label>
            <input
              type="text"
              required
              value={fullName}
              onChange={(e) => setFullName(e.target.value)}
              className="mt-1.5 w-full rounded-xl border border-white/15 bg-[#070B14] px-4 py-3 text-sm text-white focus:border-emerald-400 focus:outline-none"
            />
          </div>

          <div>
            <label className="block text-sm font-semibold text-slate-200">
              Fecha de Nacimiento *
            </label>
            <input
              type="date"
              required
              value={birthDate}
              onChange={(e) => handleBirthDateChange(e.target.value)}
              className="mt-1.5 w-full rounded-xl border border-white/15 bg-[#070B14] px-4 py-3 text-sm text-white [color-scheme:dark] focus:border-emerald-400 focus:outline-none"
            />
          </div>

          <div>
            <label className="block text-sm font-semibold text-slate-200">
              Edad *
            </label>
            <input
              type="number"
              min={1}
              required
              value={age}
              onChange={(e) => setAge(e.target.value)}
              className="mt-1.5 w-full rounded-xl border border-white/15 bg-[#070B14] px-4 py-3 text-sm text-white focus:border-emerald-400 focus:outline-none"
            />
          </div>

          <div>
            <label className="block text-sm font-semibold text-slate-200">
              Cédula de Identidad del Deportista
            </label>
            <input
              type="text"
              value={documentId}
              onChange={(e) => setDocumentId(e.target.value)}
              placeholder="V-00000000"
              className="mt-1.5 w-full rounded-xl border border-white/15 bg-[#070B14] px-4 py-3 text-sm text-white focus:border-emerald-400 focus:outline-none"
            />
          </div>

          <div>
            <label className="block text-sm font-semibold text-slate-200">
              Tipo de Sangre *
            </label>
            <select
              value={bloodType}
              onChange={(e) => setBloodType(e.target.value)}
              className="mt-1.5 w-full rounded-xl border border-white/15 bg-[#070B14] px-4 py-3 text-sm text-white focus:border-emerald-400 focus:outline-none"
            >
              {BLOOD_TYPES.map((bt) => (
                <option key={bt} value={bt}>
                  {bt}
                </option>
              ))}
            </select>
          </div>

          {/* Condición médica o lesión previa */}
          <div className="sm:col-span-2 rounded-2xl border border-white/10 bg-[#070B14]/60 p-4 space-y-3">
            <p className="text-sm font-semibold text-slate-200">
              ¿El deportista padece alguna enfermedad, condición médica o lesión previa que el club deba tener en cuenta previamente? *
            </p>
            <div className="flex gap-6 text-sm text-white">
              <label className="inline-flex items-center gap-2 cursor-pointer">
                <input
                  type="radio"
                  name="medicalCondition"
                  checked={hasMedicalCondition}
                  onChange={() => setHasMedicalCondition(true)}
                  className="accent-emerald-400"
                />
                Sí
              </label>
              <label className="inline-flex items-center gap-2 cursor-pointer">
                <input
                  type="radio"
                  name="medicalCondition"
                  checked={!hasMedicalCondition}
                  onChange={() => setHasMedicalCondition(false)}
                  className="accent-emerald-400"
                />
                No
              </label>
            </div>
            {hasMedicalCondition && (
              <div>
                <label className="block text-xs font-semibold text-amber-300">
                  Si la respuesta anterior fue SÍ, por favor especifique el diagnóstico, si requiere medicación y las recomendaciones que debe conocer el club *
                </label>
                <textarea
                  rows={2}
                  required
                  value={medicalConditionDetail}
                  onChange={(e) => setMedicalConditionDetail(e.target.value)}
                  className="mt-1.5 w-full rounded-xl border border-white/15 bg-[#070B14] px-4 py-2.5 text-sm text-white focus:border-emerald-400 focus:outline-none"
                />
              </div>
            )}
          </div>

          {/* Alergia a medicamentos */}
          <div className="sm:col-span-2 rounded-2xl border border-white/10 bg-[#070B14]/60 p-4 space-y-3">
            <p className="text-sm font-semibold text-slate-200">
              ¿El deportista es alérgico/a a algún medicamento? *
            </p>
            <div className="flex gap-6 text-sm text-white">
              <label className="inline-flex items-center gap-2 cursor-pointer">
                <input
                  type="radio"
                  name="medAllergy"
                  checked={hasAllergies}
                  onChange={() => setHasAllergies(true)}
                  className="accent-emerald-400"
                />
                Sí
              </label>
              <label className="inline-flex items-center gap-2 cursor-pointer">
                <input
                  type="radio"
                  name="medAllergy"
                  checked={!hasAllergies}
                  onChange={() => setHasAllergies(false)}
                  className="accent-emerald-400"
                />
                No
              </label>
            </div>
            {hasAllergies && (
              <div>
                <label className="block text-xs font-semibold text-amber-300">
                  Si la respuesta anterior fue SÍ, por favor especifique a cuáles medicamentos *
                </label>
                <input
                  type="text"
                  required
                  value={allergiesDetail}
                  onChange={(e) => setAllergiesDetail(e.target.value)}
                  className="mt-1.5 w-full rounded-xl border border-white/15 bg-[#070B14] px-4 py-2.5 text-sm text-white focus:border-emerald-400 focus:outline-none"
                />
              </div>
            )}
          </div>

          {/* Datos del Representante */}
          <div className="sm:col-span-2">
            <label className="block text-sm font-semibold text-slate-200">
              Nombre y apellido del Representante (si el deportista es menor de edad) o sus datos personales si es mayor de edad *
            </label>
            <input
              type="text"
              required
              value={repName}
              onChange={(e) => setRepName(e.target.value)}
              className="mt-1.5 w-full rounded-xl border border-white/15 bg-[#070B14] px-4 py-3 text-sm text-white focus:border-emerald-400 focus:outline-none"
            />
          </div>

          <div>
            <label className="block text-sm font-semibold text-slate-200">
              Cédula de Identidad del Representante (o personal si es mayor de edad) *
            </label>
            <input
              type="text"
              required
              value={repDocumentId}
              onChange={(e) => setRepDocumentId(e.target.value)}
              className="mt-1.5 w-full rounded-xl border border-white/15 bg-[#070B14] px-4 py-3 text-sm text-white focus:border-emerald-400 focus:outline-none"
            />
          </div>

          <div>
            <label className="block text-sm font-semibold text-slate-200">
              Fecha de Ingreso al Club *
            </label>
            <input
              type="date"
              required
              value={clubJoinDate}
              onChange={(e) => setClubJoinDate(e.target.value)}
              className="mt-1.5 w-full rounded-xl border border-white/15 bg-[#070B14] px-4 py-3 text-sm text-white [color-scheme:dark] focus:border-emerald-400 focus:outline-none"
            />
          </div>

          <div>
            <label className="block text-sm font-semibold text-slate-200">
              Número de Contacto Principal del Representante (o personal) *
            </label>
            <input
              type="tel"
              required
              value={repPhone}
              onChange={(e) => setRepPhone(e.target.value)}
              placeholder="+58 414 000 0000"
              className="mt-1.5 w-full rounded-xl border border-white/15 bg-[#070B14] px-4 py-3 text-sm text-white focus:border-emerald-400 focus:outline-none"
            />
          </div>

          <div>
            <label className="block text-sm font-semibold text-slate-200">
              Número de Contacto Secundario del Representante (o personal) *
            </label>
            <input
              type="tel"
              required
              value={repSecondaryPhone}
              onChange={(e) => setRepSecondaryPhone(e.target.value)}
              placeholder="+58 424 000 0000"
              className="mt-1.5 w-full rounded-xl border border-white/15 bg-[#070B14] px-4 py-3 text-sm text-white focus:border-emerald-400 focus:outline-none"
            />
          </div>

          <div className="sm:col-span-2">
            <label className="block text-sm font-semibold text-slate-200">
              Dirección de vivienda del atleta *
            </label>
            <input
              type="text"
              required
              value={homeAddress}
              onChange={(e) => setHomeAddress(e.target.value)}
              placeholder="Urbanización / Calle / Edificio o Casa / Ciudad"
              className="mt-1.5 w-full rounded-xl border border-white/15 bg-[#070B14] px-4 py-3 text-sm text-white focus:border-emerald-400 focus:outline-none"
            />
          </div>

          {/* Documentos requeridos (máx 10 MB) */}
          <div className="sm:col-span-2 grid gap-4 sm:grid-cols-3 rounded-2xl border border-white/10 bg-[#070B14]/60 p-4">
            <div>
              <label className="block text-xs font-bold text-slate-200">
                Foto partida de nacimiento o cédula del deportista *
              </label>
              <p className="text-[10px] text-slate-400 mt-0.5">
                PDF, documento o imagen. Máx: 10 MB.
              </p>
              <input
                type="file"
                accept="image/*,.pdf,.doc,.docx"
                required={!athleteIdDocDataUrl}
                onChange={(e) => handleDocUpload(e, "athleteDoc")}
                className="mt-2 w-full text-xs text-slate-300 file:mr-2 file:rounded-lg file:border-0 file:bg-white/15 file:px-2.5 file:py-1.5 file:text-xs file:font-bold file:text-white"
              />
              {athleteIdDocName && (
                <p className="mt-1 text-[10px] text-emerald-300 truncate">
                  ✓ {athleteIdDocName}
                </p>
              )}
            </div>

            <div>
              <label className="block text-xs font-bold text-amber-300">
                Foto tipo carnet del deportista (fondo blanco) *
              </label>
              <p className="text-[10px] text-slate-400 mt-0.5">
                Imagen para carnet y perfil PDF. Máx: 10 MB.
              </p>
              <input
                type="file"
                accept="image/*"
                required={!photoDataUrl}
                onChange={handlePhotoUpload}
                className="mt-2 w-full text-xs text-slate-300 file:mr-2 file:rounded-lg file:border-0 file:bg-emerald-500 file:px-2.5 file:py-1.5 file:text-xs file:font-bold file:text-slate-950"
              />
              {photoDataUrl && (
                <p className="mt-1 text-[10px] text-emerald-300">
                  ✓ Foto carnet cargada
                </p>
              )}
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-200">
                Foto cédula del representante (o personal) *
              </label>
              <p className="text-[10px] text-slate-400 mt-0.5">
                PDF, documento o imagen. Máx: 10 MB.
              </p>
              <input
                type="file"
                accept="image/*,.pdf,.doc,.docx"
                required={!repIdDocDataUrl}
                onChange={(e) => handleDocUpload(e, "repDoc")}
                className="mt-2 w-full text-xs text-slate-300 file:mr-2 file:rounded-lg file:border-0 file:bg-white/15 file:px-2.5 file:py-1.5 file:text-xs file:font-bold file:text-white"
              />
              {repIdDocName && (
                <p className="mt-1 text-[10px] text-emerald-300 truncate">
                  ✓ {repIdDocName}
                </p>
              )}
            </div>
          </div>
        </div>

        {/* TÉRMINOS Y CONDICIONES */}
        <div className="rounded-2xl border border-[#00B7A4]/30 bg-[#070B14]/80 p-5 space-y-3 text-xs text-slate-300 leading-relaxed">
          <h3 className="text-sm font-extrabold uppercase tracking-wider text-[#4CE4D4]">
            Términos y Condiciones
          </h3>
          <ol className="list-decimal pl-5 space-y-2">
            <li>
              Los deportistas del club, deben tener una actitud deportiva adecuada y respetuosa, con sus compañeros, entrenadores y demás personas del ámbito deportivo.
            </li>
            <li>
              Los pagos de la mensualidad se deben realizar los primeros 10 días de cada mes, dicha fecha podrá extenderse (según sea el caso) hasta el día 15 del mes, luego de esta fecha, el deportista no podrá ingresar a los entrenamientos hasta que el PAGO de la mensualidad sea saldado. Con el retraso de 3 mensualidades consecutivas, el deportista no podrá seguir participando en las actividades.
            </li>
            <li>
              Con el fin de garantizar la continuidad de las actividades deportivas, se establece que la mensualidad deberá ser cancelada en su totalidad durante los doce meses del año, incluyendo los meses de agosto y diciembre. Estos pagos contribuyen a cubrir los costos operativos del club durante todo el año.
            </li>
          </ol>
          <label className="flex items-center gap-2.5 pt-2 text-sm font-bold text-white cursor-pointer">
            <input
              type="checkbox"
              required
              checked={acceptedTerms}
              onChange={(e) => setAcceptedTerms(e.target.checked)}
              className="h-4 w-4 accent-[#00B7A4]"
            />
            He leído y acepto los Términos y Condiciones *
          </label>
        </div>

        {/* RELEVO DE RESPONSABILIDAD */}
        <div className="rounded-2xl border border-[#9D5BB8]/35 bg-[#070B14]/80 p-5 space-y-3 text-xs text-slate-300 leading-relaxed">
          <h3 className="text-sm font-extrabold uppercase tracking-wider text-purple-200">
            Relevo de Responsabilidad
          </h3>
          <p>
            Yo, padre / representante de la deportista a continuación inscrita, entendiendo que la práctica deportiva es una actividad que puede ocasionar daños o lesiones, autorizo a que mi representado(a) participe en los entrenamientos del club deportivo de Porrismo Synergia All Stars. Y relevo al club, entrenadores y empleados, de toda responsabilidad o compromisos relacionados con daños y perjuicios que surjan o que tengan que ver con la participación de mi hijo(a) en este deporte (Porrismo/Cheerleading).
          </p>
          <p>
            Certifico que conozco los riesgos y responsabilidades, y que mi representado(a) está en la capacidad de practicar esta disciplina deportiva, y que la misma es voluntaria.
          </p>
          <label className="flex items-center gap-2.5 pt-2 text-sm font-bold text-white cursor-pointer">
            <input
              type="checkbox"
              required
              checked={acceptedWaiver}
              onChange={(e) => setAcceptedWaiver(e.target.checked)}
              className="h-4 w-4 accent-[#7E3D97]"
            />
            He leído y acepto el Relevo de Responsabilidad del Club *
          </label>
        </div>

        {fileError && (
          <div className="rounded-xl border border-rose-500/30 bg-rose-500/10 p-3 text-xs text-rose-200">
            {fileError}
          </div>
        )}

        {savedSuccess && (
          <div className="rounded-xl border border-emerald-500/30 bg-emerald-500/10 p-3 text-xs text-emerald-200">
            ¡Inscripción formalizada y perfil guardado! Ya puedes descargar tu Perfil en Hoja Membretada PDF o imprimir tu Carnet abajo.
          </div>
        )}

        <div className="flex flex-wrap gap-3">
          <button
            type="submit"
            className="rounded-xl bg-emerald-500 px-6 py-3 text-sm font-bold text-slate-950 hover:bg-emerald-400 cursor-pointer"
          >
            Guardar Perfil y Generar Carnet
          </button>
          <button
            type="button"
            onClick={() => generateAthleteProfilePdf(athlete)}
            className="rounded-xl border border-[#4CE4D4]/40 bg-[#00B7A4]/15 px-6 py-3 text-sm font-bold text-[#4CE4D4] hover:bg-[#00B7A4]/25 cursor-pointer"
          >
            Perfil del Atleta
          </button>
        </div>
      </form>
        </>
      )}

      {athlete.profileCompleted && activeTab === "pagos" && (
        <div className="grid gap-6 lg:grid-cols-2">
          <form
            onSubmit={handleSubmitPayment}
            className="rounded-3xl border border-white/10 bg-[#0D1322] p-6 space-y-5"
          >
            <div>
              <h2 className="text-lg font-bold text-white">
                {t("Registrar Pago de Mensualidad", "Register Monthly Payment")}
              </h2>
              <p className="mt-1 text-xs text-amber-300">
                {t(
                  "Los pagos se reciben hasta el día 15 de cada mes. Todo pago es verificado por los entrenadores.",
                  "Payments are due by the 15th of each month. Every payment is verified by coaches."
                )}
              </p>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-200 mb-2">
                {t("Método de Pago *", "Payment Method *")}
              </label>
              <div className="grid grid-cols-3 gap-2">
                {(
                  [
                    { key: "pago_movil", label: "Pago Móvil" },
                    { key: "transferencia", label: t("Transferencia", "Bank Transfer") },
                    { key: "efectivo", label: t("Efectivo", "Cash") },
                  ] as const
                ).map((m) => (
                  <button
                    key={m.key}
                    type="button"
                    onClick={() => setPayMethod(m.key)}
                    className={`rounded-xl border py-2.5 px-2 text-xs font-bold transition-all cursor-pointer ${
                      payMethod === m.key
                        ? "border-[#00B7A4] bg-[#00B7A4]/20 text-[#4CE4D4]"
                        : "border-white/15 bg-[#070B14] text-slate-300 hover:text-white"
                    }`}
                  >
                    {m.label}
                  </button>
                ))}
              </div>
            </div>

            <div className="grid gap-4 sm:grid-cols-2">
              <div>
                <label className="block text-xs font-semibold text-slate-200">
                  {t("Mes correspondiente *", "Billing Month *")}
                </label>
                <input
                  type="month"
                  required
                  value={payMonth}
                  onChange={(e) => setPayMonth(e.target.value)}
                  className="mt-1.5 w-full rounded-xl border border-white/15 bg-[#070B14] px-3.5 py-2.5 text-sm text-white focus:border-emerald-400 focus:outline-none"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-200">
                  {t("Monto ($) *", "Amount ($) *")}
                </label>
                <input
                  type="number"
                  min={1}
                  step="0.01"
                  required
                  value={payAmount}
                  onChange={(e) => setPayAmount(e.target.value)}
                  className="mt-1.5 w-full rounded-xl border border-white/15 bg-[#070B14] px-3.5 py-2.5 text-sm text-white focus:border-emerald-400 focus:outline-none"
                />
              </div>
            </div>

            {payMethod !== "efectivo" && (
              <div className="grid gap-4 sm:grid-cols-2">
                <div>
                  <label className="block text-xs font-semibold text-slate-200">
                    {t("Banco *", "Bank *")}
                  </label>
                  <input
                    type="text"
                    required
                    value={payBank}
                    onChange={(e) => setPayBank(e.target.value)}
                    placeholder="Ej. Banesco / Mercantil / BDV"
                    className="mt-1.5 w-full rounded-xl border border-white/15 bg-[#070B14] px-3.5 py-2.5 text-sm text-white focus:border-emerald-400 focus:outline-none"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-200">
                    {t("Número de Referencia *", "Reference Number *")}
                  </label>
                  <input
                    type="text"
                    required
                    value={payReference}
                    onChange={(e) => setPayReference(e.target.value)}
                    placeholder="Ej. 00458912"
                    className="mt-1.5 w-full rounded-xl border border-white/15 bg-[#070B14] px-3.5 py-2.5 text-sm text-white focus:border-emerald-400 focus:outline-none"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-200">
                    {t("Número de Cédula *", "ID Number *")}
                  </label>
                  <input
                    type="text"
                    required
                    value={payDocId}
                    onChange={(e) => setPayDocId(e.target.value)}
                    placeholder="V-00000000"
                    className="mt-1.5 w-full rounded-xl border border-white/15 bg-[#070B14] px-3.5 py-2.5 text-sm text-white focus:border-emerald-400 focus:outline-none"
                  />
                </div>

                {payMethod === "pago_movil" && (
                  <div>
                    <label className="block text-xs font-semibold text-slate-200">
                      {t("Número de Teléfono *", "Phone Number *")}
                    </label>
                    <input
                      type="tel"
                      required
                      value={payPhone}
                      onChange={(e) => setPayPhone(e.target.value)}
                      placeholder="0414-0000000"
                      className="mt-1.5 w-full rounded-xl border border-white/15 bg-[#070B14] px-3.5 py-2.5 text-sm text-white focus:border-emerald-400 focus:outline-none"
                    />
                  </div>
                )}
              </div>
            )}

            {payMethod === "efectivo" && (
              <div className="space-y-2 rounded-2xl border border-amber-400/30 bg-amber-400/5 p-4">
                <label className="block text-xs font-bold text-amber-300">
                  {t(
                    "Foto del Efectivo (Obligatoria antes de entregar) *",
                    "Photo of Cash (Required before handing over) *"
                  )}
                </label>
                <input
                  type="file"
                  accept="image/*"
                  capture="environment"
                  required={!payCashPhoto}
                  onChange={handleCashPhotoUpload}
                  className="block w-full text-xs text-slate-300 file:mr-3 file:rounded-lg file:border-0 file:bg-amber-400/20 file:px-3 file:py-2 file:text-xs file:font-bold file:text-amber-300"
                />
                {payCashPhoto && (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img
                    src={payCashPhoto}
                    alt="Comprobante efectivo"
                    className="mt-2 h-36 w-auto rounded-xl border border-white/15 object-cover"
                  />
                )}
              </div>
            )}

            <div>
              <label className="block text-xs font-semibold text-slate-200">
                {t("Observaciones (opcional)", "Notes (optional)")}
              </label>
              <input
                type="text"
                value={payNotes}
                onChange={(e) => setPayNotes(e.target.value)}
                placeholder={t("Detalle adicional del pago", "Additional payment detail")}
                className="mt-1.5 w-full rounded-xl border border-white/15 bg-[#070B14] px-3.5 py-2.5 text-sm text-white focus:border-emerald-400 focus:outline-none"
              />
            </div>

            {paySuccess && (
              <div className="rounded-xl border border-emerald-500/30 bg-emerald-500/10 p-3 text-xs text-emerald-200">
                {paySuccess}
              </div>
            )}

            <button
              type="submit"
              className="w-full rounded-xl bg-emerald-500 py-3 text-sm font-bold text-slate-950 hover:bg-emerald-400 cursor-pointer"
            >
              {t("Enviar Pago para Verificación", "Submit Payment for Verification")}
            </button>
          </form>

          {/* Historial de pagos del atleta */}
          <div className="rounded-3xl border border-white/10 bg-[#0D1322] p-6 space-y-4">
            <h2 className="text-lg font-bold text-white">
              {t("Mis Pagos Registrados", "My Registered Payments")} ({myPayments.length})
            </h2>
            {myPayments.length === 0 ? (
              <p className="text-xs text-slate-400 py-8 text-center">
                {t("Aún no has registrado pagos.", "You have not registered any payments yet.")}
              </p>
            ) : (
              <div className="space-y-3 max-h-[520px] overflow-y-auto pr-1">
                {myPayments.map((p) => (
                  <div
                    key={p.id}
                    className="rounded-2xl border border-white/10 bg-[#070B14]/80 p-4 text-xs space-y-1.5"
                  >
                    <div className="flex items-center justify-between gap-2">
                      <span className="font-bold text-white uppercase">
                        {p.method.replace("_", " ")} · {p.monthKey}
                      </span>
                      <span
                        className={`rounded-full px-2.5 py-0.5 text-[10px] font-bold uppercase ${
                          p.status === "aprobado"
                            ? "bg-emerald-500/20 text-emerald-300"
                            : p.status === "rechazado"
                            ? "bg-rose-500/20 text-rose-300"
                            : "bg-amber-400/20 text-amber-300"
                        }`}
                      >
                        {p.status}
                      </span>
                    </div>
                    <p className="text-emerald-300 font-extrabold text-sm">
                      ${p.amount.toFixed(2)}
                    </p>
                    {p.bank && (
                      <p className="text-slate-300">
                        Banco: {p.bank} · Ref: <span className="font-mono">{p.reference}</span>
                      </p>
                    )}
                    {p.documentId && (
                      <p className="text-slate-400">
                        Cédula: {p.documentId} {p.phone ? `· Tel: ${p.phone}` : ""}
                      </p>
                    )}
                    {p.cashPhotoDataUrl && (
                      // eslint-disable-next-line @next/next/no-img-element
                      <img
                        src={p.cashPhotoDataUrl}
                        alt="Foto efectivo"
                        className="mt-2 h-24 w-auto rounded-lg border border-white/10 object-cover"
                      />
                    )}
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      )}

      {athlete.profileCompleted && activeTab === "solicitudes" && (
        <div className="grid gap-6 lg:grid-cols-2">
          <form
            onSubmit={handleSubmitRequest}
            className="rounded-3xl border border-white/10 bg-[#0D1322] p-6 space-y-5"
          >
            <div>
              <h2 className="text-lg font-bold text-white">
                {t("Solicitar Uniformes o Materiales", "Request Uniforms or Materials")}
              </h2>
              <p className="mt-1 text-xs text-slate-400">
                {t(
                  "Los entrenadores recibirán un aviso inmediato de tu solicitud.",
                  "Coaches will receive an immediate notice of your request."
                )}
              </p>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-200 mb-2">
                {t("Artículo / Material *", "Item / Material *")}
              </label>
              <div className="grid grid-cols-2 gap-2">
                {MATERIAL_TYPES.map((item) => (
                  <button
                    key={item}
                    type="button"
                    onClick={() => setReqType(item)}
                    className={`rounded-xl border py-2.5 px-3 text-xs font-bold transition-all cursor-pointer ${
                      reqType === item
                        ? "border-[#9D5BB8] bg-[#7E3D97]/30 text-purple-200"
                        : "border-white/15 bg-[#070B14] text-slate-300 hover:text-white"
                    }`}
                  >
                    {item}
                  </button>
                ))}
              </div>
            </div>

            <div className="grid gap-4 sm:grid-cols-3">
              <div className="sm:col-span-2">
                <label className="block text-xs font-semibold text-slate-200">
                  {t("Talla / Especificación *", "Size / Specification *")}
                </label>
                <input
                  type="text"
                  required
                  value={reqDetail}
                  onChange={(e) => setReqDetail(e.target.value)}
                  placeholder={t("Ej. Talla M / Calzado 38 / Color morado", "E.g. Size M / Shoe 38 / Purple")}
                  className="mt-1.5 w-full rounded-xl border border-white/15 bg-[#070B14] px-3.5 py-2.5 text-sm text-white focus:border-emerald-400 focus:outline-none"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-200">
                  {t("Cantidad *", "Qty *")}
                </label>
                <input
                  type="number"
                  min={1}
                  required
                  value={reqQty}
                  onChange={(e) => setReqQty(e.target.value)}
                  className="mt-1.5 w-full rounded-xl border border-white/15 bg-[#070B14] px-3.5 py-2.5 text-sm text-white focus:border-emerald-400 focus:outline-none"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-200">
                {t("Observaciones (opcional)", "Notes (optional)")}
              </label>
              <textarea
                rows={2}
                value={reqNotes}
                onChange={(e) => setReqNotes(e.target.value)}
                placeholder={t("Detalles para tu entrenamiento...", "Training details...")}
                className="mt-1.5 w-full rounded-xl border border-white/15 bg-[#070B14] px-3.5 py-2.5 text-sm text-white focus:border-emerald-400 focus:outline-none"
              />
            </div>

            {reqSuccess && (
              <div className="rounded-xl border border-emerald-500/30 bg-emerald-500/10 p-3 text-xs text-emerald-200">
                {reqSuccess}
              </div>
            )}

            <button
              type="submit"
              className="w-full rounded-xl bg-[#7E3D97] py-3 text-sm font-bold text-white hover:bg-[#914BAE] cursor-pointer"
            >
              {t("Enviar Solicitud a Entrenadores", "Send Request to Coaches")}
            </button>
          </form>

          <div className="rounded-3xl border border-white/10 bg-[#0D1322] p-6 space-y-4">
            <h2 className="text-lg font-bold text-white">
              {t("Mis Solicitudes", "My Requests")} ({myRequests.length})
            </h2>
            {myRequests.length === 0 ? (
              <p className="text-xs text-slate-400 py-8 text-center">
                {t("No tienes solicitudes registradas.", "No requests submitted yet.")}
              </p>
            ) : (
              <div className="space-y-3 max-h-[460px] overflow-y-auto pr-1">
                {myRequests.map((r) => (
                  <div
                    key={r.id}
                    className="rounded-2xl border border-white/10 bg-[#070B14]/80 p-4 text-xs space-y-1"
                  >
                    <div className="flex items-center justify-between gap-2">
                      <span className="font-bold text-white">
                        {r.itemType} (x{r.quantity})
                      </span>
                      <span
                        className={`rounded-full px-2.5 py-0.5 text-[10px] font-bold uppercase ${
                          r.status === "entregado"
                            ? "bg-emerald-500/20 text-emerald-300"
                            : r.status === "aprobado"
                            ? "bg-sky-500/20 text-sky-300"
                            : "bg-amber-400/20 text-amber-300"
                        }`}
                      >
                        {r.status}
                      </span>
                    </div>
                    <p className="text-slate-300">{r.detail}</p>
                    {r.notes && <p className="text-slate-400">{r.notes}</p>}
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      )}

      {/* Visor flotante de Flyer en Agenda de Eventos */}
      {athleteFlyerModal && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/85 p-4 backdrop-blur-md"
          onClick={() => setAthleteFlyerModal(null)}
        >
          <div
            className="w-full max-w-2xl overflow-hidden rounded-[24px] border border-white/15 bg-[#0B1120] shadow-2xl"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between border-b border-white/10 px-5 py-3.5">
              <p className="truncate text-sm font-bold text-white">
                {athleteFlyerModal.title}
              </p>
              <button
                type="button"
                onClick={() => setAthleteFlyerModal(null)}
                className="flex h-8 w-8 items-center justify-center rounded-full bg-white/10 text-xs text-white hover:bg-white/20 cursor-pointer"
              >
                ✕
              </button>
            </div>
            <div className="flex items-center justify-center bg-[#070B14] p-4 max-h-[78vh] overflow-auto">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={athleteFlyerModal.url}
                alt={athleteFlyerModal.title}
                className="max-h-[70vh] w-auto rounded-xl object-contain"
              />
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
