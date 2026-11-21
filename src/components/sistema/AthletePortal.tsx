"use client";

import { ChangeEvent, FormEvent, useState } from "react";
import {
  AthletePayment,
  AthleteProfile,
  MaterialRequest,
  MaterialType,
  PaymentMethod,
  SynergiaState,
  getAthletePaymentStatus,
  getCurrentMonthKey,
  saveSynergiaState,
} from "@/lib/synergia-store";
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

type AthleteTab = "perfil" | "pagos" | "solicitudes" | "asistencia";

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

  // Cambio de clave obligatorio si tiene clave provisional
  const [newPass, setNewPass] = useState("");
  const [confirmPass, setConfirmPass] = useState("");
  const [passError, setPassError] = useState<string | null>(null);

  // Formulario de perfil y salud
  const [bloodType, setBloodType] = useState(athlete.bloodType || "O+");
  const [hasAllergies, setHasAllergies] = useState(athlete.hasAllergies);
  const [allergiesDetail, setAllergiesDetail] = useState(
    athlete.allergiesDetail
  );
  const [medications, setMedications] = useState(athlete.medications);
  const [medicalNotes, setMedicalNotes] = useState(athlete.medicalNotes);
  const [homeAddress, setHomeAddress] = useState(athlete.homeAddress);
  const [emergencyContact, setEmergencyContact] = useState(
    athlete.emergencyContact
  );
  const [emergencyPhone, setEmergencyPhone] = useState(athlete.emergencyPhone);
  const [photoDataUrl, setPhotoDataUrl] = useState(athlete.photoDataUrl);
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

  function handleSaveProfile(e: FormEvent) {
    e.preventDefault();
    onUpdateAthlete({
      ...athlete,
      bloodType,
      hasAllergies,
      allergiesDetail: hasAllergies ? allergiesDetail.trim() : "",
      medications: medications.trim(),
      medicalNotes: medicalNotes.trim(),
      homeAddress: homeAddress.trim(),
      emergencyContact: emergencyContact.trim(),
      emergencyPhone: emergencyPhone.trim(),
      photoDataUrl,
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

      <div
        className={`gap-3 ${
          isMobile ? "grid grid-cols-1" : "grid grid-cols-2 lg:grid-cols-4"
        }`}
      >
        {(
          [
            {
              key: "perfil",
              title: t("Mi Perfil y Carnet", "My Profile & ID Card"),
              subtitle: t("Ficha médica, foto y QR", "Medical sheet, photo & QR"),
              badge: 0,
            },
            {
              key: "asistencia",
              title: t("Control de Asistencia", "Attendance Control"),
              subtitle: t("Validar QR o ID de carnet", "Validate QR or ID card"),
              badge: 0,
            },
            {
              key: "pagos",
              title: t("Módulo de Pagos", "Payments Module"),
              subtitle: t("Transferencia, Pago Móvil, Efectivo", "Transfer, Mobile Pay, Cash"),
              badge: unreadNotifs.length,
            },
            {
              key: "solicitudes",
              title: t("Solicitudes de Materiales", "Material Requests"),
              subtitle: t("Uniformes, zapatos, lazos", "Uniforms, shoes, bows"),
              badge: myRequests.filter((r) => r.status === "pendiente").length,
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

      {activeTab === "asistencia" && (
        <AttendanceControl
          state={state}
          onStateChange={onStateChange}
          recordedBy={athlete.username}
          restrictedAthlete={athlete}
        />
      )}

      {activeTab === "perfil" && (
        <>

      {/* Formulario con datos anteriores + salud + dirección + foto carnet */}
      <form
        onSubmit={handleSaveProfile}
        className="rounded-3xl border border-white/10 bg-[#0D1322] p-6 sm:p-8 space-y-6"
      >
        <div>
          <h2 className="text-lg font-bold text-white">
            Ficha Médica, Dirección y Foto Tipo Carnet
          </h2>
          <p className="text-xs text-slate-400 mt-1">
            Completa tus datos para generar tu carnet oficial con código de
            barras.
          </p>
        </div>

        {/* Datos precargados de inscripción */}
        <div className="grid gap-4 sm:grid-cols-3 rounded-2xl border border-white/10 bg-[#070B14]/70 p-4 text-xs">
          <div>
            <span className="text-slate-400 block">ID del Atleta:</span>
            <span className="font-mono font-bold text-amber-300">
              {athlete.athleteId}
            </span>
          </div>
          <div>
            <span className="text-slate-400 block">Documento / Cédula:</span>
            <span className="font-semibold text-white">
              {athlete.documentId}
            </span>
          </div>
          <div>
            <span className="text-slate-400 block">Categoría y Posición:</span>
            <span className="font-semibold text-emerald-300">
              {athlete.category} ({athlete.position})
            </span>
          </div>
        </div>

        <div className="grid gap-5 sm:grid-cols-2">
          <div>
            <label className="block text-sm font-semibold text-slate-200">
              Tipo de sangre *
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

          <div>
            <label className="block text-sm font-semibold text-slate-200">
              Foto tipo carnet *
            </label>
            <input
              type="file"
              accept="image/*"
              onChange={handlePhotoUpload}
              className="mt-1.5 w-full rounded-xl border border-white/15 bg-[#070B14] px-3 py-2.5 text-xs text-slate-300 file:mr-3 file:rounded-lg file:border-0 file:bg-emerald-500 file:px-3 file:py-1 file:text-xs file:font-bold file:text-slate-950"
            />
          </div>

          <div className="sm:col-span-2">
            <label className="flex items-center gap-2.5 text-sm font-semibold text-slate-200 cursor-pointer">
              <input
                type="checkbox"
                checked={hasAllergies}
                onChange={(e) => setHasAllergies(e.target.checked)}
                className="h-4 w-4 accent-amber-400"
              />
              ¿Sufre de alguna alergia?
            </label>
            {hasAllergies && (
              <input
                type="text"
                required
                value={allergiesDetail}
                onChange={(e) => setAllergiesDetail(e.target.value)}
                placeholder="Especifique a qué es alérgico (alimentos, medicamentos, etc.)"
                className="mt-2 w-full rounded-xl border border-white/15 bg-[#070B14] px-4 py-3 text-sm text-white focus:border-emerald-400 focus:outline-none"
              />
            )}
          </div>

          <div>
            <label className="block text-sm font-semibold text-slate-200">
              Medicamentos que toma actualmente
            </label>
            <input
              type="text"
              value={medications}
              onChange={(e) => setMedications(e.target.value)}
              placeholder="Ej. Ninguno / Inhalador..."
              className="mt-1.5 w-full rounded-xl border border-white/15 bg-[#070B14] px-4 py-3 text-sm text-white focus:border-emerald-400 focus:outline-none"
            />
          </div>

          <div>
            <label className="block text-sm font-semibold text-slate-200">
              Observaciones médicas / lesiones previas
            </label>
            <input
              type="text"
              value={medicalNotes}
              onChange={(e) => setMedicalNotes(e.target.value)}
              placeholder="Ej. Asma leve, esguince previo..."
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

          <div>
            <label className="block text-sm font-semibold text-slate-200">
              Contacto de emergencia *
            </label>
            <input
              type="text"
              required
              value={emergencyContact}
              onChange={(e) => setEmergencyContact(e.target.value)}
              placeholder="Nombre completo"
              className="mt-1.5 w-full rounded-xl border border-white/15 bg-[#070B14] px-4 py-3 text-sm text-white focus:border-emerald-400 focus:outline-none"
            />
          </div>

          <div>
            <label className="block text-sm font-semibold text-slate-200">
              Teléfono de emergencia *
            </label>
            <input
              type="tel"
              required
              value={emergencyPhone}
              onChange={(e) => setEmergencyPhone(e.target.value)}
              placeholder="+58 412 000 0000"
              className="mt-1.5 w-full rounded-xl border border-white/15 bg-[#070B14] px-4 py-3 text-sm text-white focus:border-emerald-400 focus:outline-none"
            />
          </div>
        </div>

        {savedSuccess && (
          <div className="rounded-xl border border-emerald-500/30 bg-emerald-500/10 p-3 text-xs text-emerald-200">
            ¡Perfil guardado! Tu carnet digital ha sido actualizado abajo.
          </div>
        )}

        <button
          type="submit"
          className="rounded-xl bg-emerald-500 px-6 py-3 text-sm font-bold text-slate-950 hover:bg-emerald-400 cursor-pointer"
        >
          Guardar Perfil y Generar Carnet
        </button>
      </form>

      {/* Carnet Digital */}
      <AthleteCarnet athlete={athlete} />
        </>
      )}

      {activeTab === "pagos" && (
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

      {activeTab === "solicitudes" && (
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
    </div>
  );
}
