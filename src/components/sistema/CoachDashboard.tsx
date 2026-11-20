"use client";

import { useState, FormEvent } from "react";
import {
  ActivityScore,
  AthleteProfile,
  CHEER_CATEGORIES,
  CHEER_POSITIONS,
  EvaluationActivity,
  EvaluationFormTemplate,
  RegistrationApplication,
  RequestStatus,
  SynergiaState,
  SystemUser,
  createRecordId,
  generateAthleteId,
  generateAthleteUsername,
  getCurrentMonthKey,
  saveSynergiaState,
} from "@/lib/synergia-store";
import { generateEvaluationPdf } from "@/lib/pdf-report";
import { AthleteCarnet } from "@/components/AthleteCarnet";
import { useDevice } from "@/components/DeviceContext";
import { useI18n } from "@/components/I18nContext";

type CoachTab =
  | "inscripcion"
  | "formularios"
  | "evaluacion"
  | "perfil"
  | "contabilidad"
  | "morosos"
  | "solicitudes";

interface CoachDashboardProps {
  state: SynergiaState;
  onStateChange: (next: SynergiaState) => void;
  onLogout: () => void;
  currentUser?: SystemUser;
}

export function CoachDashboard({
  state,
  onStateChange,
  onLogout,
  currentUser,
}: CoachDashboardProps) {
  const { deviceType, isMobile, isTablet } = useDevice();
  const { t } = useI18n();
  const [activeTab, setActiveTab] = useState<CoachTab>("inscripcion");

  // Cita & Formalización modals/inline state
  const [citaAppId, setCitaAppId] = useState<string | null>(null);
  const [citaDate, setCitaDate] = useState("");
  const [citaTime, setCitaTime] = useState("");
  const [citaFormId, setCitaFormId] = useState(
    state.forms[0]?.id ?? ""
  );

  const [formalizeAppId, setFormalizeAppId] = useState<string | null>(null);
  const [formalizeCategory, setFormalizeCategory] = useState(
    CHEER_CATEGORIES[0]
  );
  const [formalizePosition, setFormalizePosition] = useState(
    CHEER_POSITIONS[0]
  );

  // Formularios builder state
  const [formName, setFormName] = useState("");
  const [formCategory, setFormCategory] = useState(CHEER_CATEGORIES[0]);
  const [draftActivities, setDraftActivities] = useState<EvaluationActivity[]>(
    []
  );
  const [showActivityModal, setShowActivityModal] = useState(false);
  const [actDescription, setActDescription] = useState("");
  const [actWeight, setActWeight] = useState("20");

  // Evaluación state
  const [selectedEvalAppId, setSelectedEvalAppId] = useState<string>("");
  const [evalSearch, setEvalSearch] = useState("");
  const [evalFormId, setEvalFormId] = useState<string>("");
  const [evalItems, setEvalItems] = useState<ActivityScore[]>([]);
  const [evalNotes, setEvalNotes] = useState("");
  const [evalSavedMsg, setEvalSavedMsg] = useState<string | null>(null);

  // Perfil Atleta view state
  const [selectedAthleteId, setSelectedAthleteId] = useState<string | null>(
    null
  );

  // Contabilidad y Morosos state
  const [accountingMonth, setAccountingMonth] = useState(getCurrentMonthKey());
  const [feeInput, setFeeInput] = useState(String(state.monthlyFee || 30));
  const [notifyFeedback, setNotifyFeedback] = useState<string | null>(null);

  const newApplicantsCount = state.applications.filter(
    (a) => a.status === "nuevo"
  ).length;

  function commitState(next: SynergiaState) {
    saveSynergiaState(next);
    onStateChange(next);
  }

  // --- INSCRIPCION ACTIONS ---
  function handleSaveCita(e: FormEvent) {
    e.preventDefault();
    if (!citaAppId) return;
    const updatedApps = state.applications.map((app) =>
      app.id === citaAppId
        ? {
            ...app,
            status: "cita_asignada" as const,
            appointmentDate: citaDate,
            appointmentTime: citaTime,
            assignedFormId: citaFormId || state.forms[0]?.id,
          }
        : app
    );
    commitState({ ...state, applications: updatedApps });
    setCitaAppId(null);
    setCitaDate("");
    setCitaTime("");
  }

  function handleDeleteApplication(appId: string) {
    const updatedApps = state.applications.filter((a) => a.id !== appId);
    commitState({ ...state, applications: updatedApps });
  }

  function handleGoToEvaluation(app: RegistrationApplication) {
    const targetFormId =
      app.assignedFormId || state.forms[0]?.id || "";
    const template = state.forms.find((f) => f.id === targetFormId);

    setSelectedEvalAppId(app.id);
    setEvalFormId(targetFormId);
    setEvalNotes(app.evaluation?.coachNotes ?? "");
    setEvalSavedMsg(null);

    if (app.evaluation && app.evaluation.formId === targetFormId) {
      setEvalItems(app.evaluation.items);
    } else if (template) {
      setEvalItems(
        template.activities.map((act) => ({
          activityId: act.id,
          description: act.description,
          weight: act.weight,
          checked: false,
          score: 0,
        }))
      );
    } else {
      setEvalItems([]);
    }
    setActiveTab("evaluacion");
  }

  function handleFormalizeSubmit(e: FormEvent) {
    e.preventDefault();
    if (!formalizeAppId) return;
    const app = state.applications.find((a) => a.id === formalizeAppId);
    if (!app) return;

    const { athleteId, correlativeNumber } = generateAthleteId(
      app.documentId,
      state.athletes
    );
    const username = generateAthleteUsername(app.fullName, state.athletes);

    const newAthlete: AthleteProfile = {
      athleteId,
      correlativeNumber,
      applicationId: app.id,
      username,
      password: "123456",
      mustChangePassword: true,
      fullName: app.fullName,
      documentId: app.documentId,
      birthDate: app.birthDate,
      age: app.age,
      isMinor: app.isMinor,
      repName: app.repName,
      repDocumentId: app.repDocumentId,
      repPhone: app.repPhone,
      email: app.email,
      phone: app.phone,
      category: formalizeCategory,
      position: formalizePosition,
      bloodType: "",
      hasAllergies: false,
      allergiesDetail: "",
      medications: "",
      medicalNotes: "",
      homeAddress: "",
      emergencyContact: app.repName ?? "",
      emergencyPhone: app.repPhone ?? app.phone,
      photoDataUrl: "",
      profileCompleted: false,
      formalizedAt: new Date().toISOString(),
    };

    const updatedApps = state.applications.map((item) =>
      item.id === app.id
        ? {
            ...item,
            status: "formalizado" as const,
            assignedCategory: formalizeCategory,
            assignedPosition: formalizePosition,
          }
        : item
    );

    commitState({
      ...state,
      applications: updatedApps,
      athletes: [newAthlete, ...state.athletes],
    });

    setFormalizeAppId(null);
    setSelectedAthleteId(newAthlete.athleteId);
    setActiveTab("perfil");
  }

  // --- FORMULARIOS ACTIONS ---
  function handleAddActivityModal(e: FormEvent) {
    e.preventDefault();
    const w = Math.max(1, Number(actWeight) || 10);
    setDraftActivities((prev) => [
      ...prev,
      {
        id: `act-${Date.now()}`,
        description: actDescription.trim(),
        weight: w,
      },
    ]);
    setActDescription("");
    setActWeight("20");
    setShowActivityModal(false);
  }

  function handleSaveFormTemplate(e: FormEvent) {
    e.preventDefault();
    if (!formName.trim() || draftActivities.length === 0) return;

    const newTemplate: EvaluationFormTemplate = {
      id: `form-${Date.now()}`,
      name: formName.trim(),
      category: formCategory,
      activities: draftActivities,
    };

    commitState({
      ...state,
      forms: [newTemplate, ...state.forms],
    });

    setFormName("");
    setDraftActivities([]);
  }

  // --- EVALUACION ACTIONS ---
  function handleSelectEvalAthlete(appId: string) {
    const app = state.applications.find((a) => a.id === appId);
    if (!app) return;
    handleGoToEvaluation(app);
  }

  function handleChangeEvalForm(newFormId: string) {
    setEvalFormId(newFormId);
    const template = state.forms.find((f) => f.id === newFormId);
    if (template) {
      setEvalItems(
        template.activities.map((act) => ({
          activityId: act.id,
          description: act.description,
          weight: act.weight,
          checked: false,
          score: 0,
        }))
      );
    }
  }

  function toggleActivityCheck(activityId: string) {
    setEvalItems((prev) =>
      prev.map((item) => {
        if (item.activityId !== activityId) return item;
        const nextChecked = !item.checked;
        return {
          ...item,
          checked: nextChecked,
          score: nextChecked ? item.weight : 0,
        };
      })
    );
  }

  function updateActivityScore(activityId: string, val: string) {
    const num = Math.max(0, Number(val) || 0);
    setEvalItems((prev) =>
      prev.map((item) =>
        item.activityId === activityId
          ? {
              ...item,
              score: Math.min(num, item.weight),
              checked: num > 0,
            }
          : item
      )
    );
  }

  function handleSaveEvaluation() {
    if (!selectedEvalAppId) return;
    const template = state.forms.find((f) => f.id === evalFormId);
    if (!template) return;

    const totalScore = evalItems.reduce((sum, i) => sum + i.score, 0);
    const maxScore = evalItems.reduce((sum, i) => sum + i.weight, 0);

    const updatedApps = state.applications.map((app) =>
      app.id === selectedEvalAppId
        ? {
            ...app,
            status:
              app.status === "formalizado"
                ? ("formalizado" as const)
                : ("evaluado" as const),
            assignedFormId: template.id,
            evaluation: {
              formId: template.id,
              formName: template.name,
              category: template.category,
              evaluatedAt: new Date().toISOString(),
              items: evalItems,
              totalScore,
              maxScore,
              coachNotes: evalNotes,
            },
          }
        : app
    );

    commitState({ ...state, applications: updatedApps });
    setEvalSavedMsg(
      `Evaluación guardada (${totalScore} / ${maxScore} pts). Ya puedes generar el reporte PDF.`
    );
  }

  const currentEvalApp = state.applications.find(
    (a) => a.id === selectedEvalAppId
  );

  const filteredEvalApps = state.applications.filter(
    (a) =>
      a.status !== "formalizado" &&
      a.fullName.toLowerCase().includes(evalSearch.toLowerCase())
  );

  const selectedAthlete =
    state.athletes.find((a) => a.athleteId === selectedAthleteId) ??
    state.athletes[0] ??
    null;

  // --- CONTABILIDAD, PAGOS, MOROSOS Y SOLICITUDES ---
  const pendingPaymentsCount = state.payments.filter(
    (p) => p.status === "pendiente"
  ).length;
  const pendingRequestsCount = state.materialRequests.filter(
    (r) => r.status === "pendiente"
  ).length;

  const approvedForMonth = state.payments.filter(
    (p) => p.monthKey === accountingMonth && p.status === "aprobado"
  );
  const totalExpectedMonth = state.athletes.length * (state.monthlyFee || 30);
  const totalApprovedMonth = approvedForMonth.reduce(
    (sum, p) => sum + p.amount,
    0
  );
  const totalPendingDebtMonth = Math.max(
    0,
    totalExpectedMonth - totalApprovedMonth
  );

  const defaultersList = state.athletes.filter((ath) => {
    const paidThisMonth = approvedForMonth
      .filter((p) => p.athleteId === ath.athleteId)
      .reduce((s, p) => s + p.amount, 0);
    return paidThisMonth < (state.monthlyFee || 30);
  });

  function handleReviewPayment(
    paymentId: string,
    decision: "aprobado" | "rechazado"
  ) {
    const updated = state.payments.map((p) =>
      p.id === paymentId
        ? {
            ...p,
            status: decision,
            reviewedAt: new Date().toISOString(),
            reviewedBy: currentUser?.username ?? "coach",
          }
        : p
    );
    commitState({ ...state, payments: updated });
  }

  function handleSaveMonthlyFee(e: FormEvent) {
    e.preventDefault();
    const val = Math.max(1, Number(feeInput) || 30);
    commitState({ ...state, monthlyFee: val });
  }

  function handleSendPaymentNotification(athleteId: string, fullName: string) {
    const notif = {
      id: createRecordId(`notif-${athleteId}`),
      athleteId,
      monthKey: accountingMonth,
      message: t(
        `Recordatorio de pago (${accountingMonth}): Los pagos de mensualidad se reciben hasta el 15 de cada mes. Por favor registra tu comprobante en el Módulo de Pagos.`,
        `Payment reminder (${accountingMonth}): Monthly payments are due by the 15th of each month. Please submit your payment in the Payments Module.`
      ),
      createdAt: new Date().toISOString(),
      read: false,
    };
    commitState({
      ...state,
      paymentNotifications: [notif, ...state.paymentNotifications],
    });
    setNotifyFeedback(
      t(
        `Notificación de pago enviada a ${fullName}.`,
        `Payment notification sent to ${fullName}.`
      )
    );
  }

  function handleNotifyAllDefaulters() {
    if (defaultersList.length === 0) return;
    const batch = defaultersList.map((ath) => ({
      id: createRecordId(`notif-${ath.athleteId}`),
      athleteId: ath.athleteId,
      monthKey: accountingMonth,
      message: t(
        `Recordatorio de pago (${accountingMonth}): Tu mensualidad está pendiente (límite día 15). Registra tu pago en el Módulo de Pagos.`,
        `Payment reminder (${accountingMonth}): Your monthly fee is pending (due 15th). Submit your payment in the Payments Module.`
      ),
      createdAt: new Date().toISOString(),
      read: false,
    }));
    commitState({
      ...state,
      paymentNotifications: [...batch, ...state.paymentNotifications],
    });
    setNotifyFeedback(
      t(
        `Se enviaron ${batch.length} notificaciones de pago a los atletas morosos.`,
        `Sent ${batch.length} payment notifications to overdue athletes.`
      )
    );
  }

  function handleUpdateRequestStatus(
    requestId: string,
    nextStatus: RequestStatus
  ) {
    const updated = state.materialRequests.map((r) =>
      r.id === requestId ? { ...r, status: nextStatus } : r
    );
    commitState({ ...state, materialRequests: updated });
  }

  const deviceLabel =
    deviceType === "mobile"
      ? t("Celular", "Mobile")
      : deviceType === "tablet"
      ? t("Tablet", "Tablet")
      : t("Computadora", "Desktop");

  return (
    <div
      className={`mx-auto max-w-7xl space-y-6 ${
        isMobile ? "px-3 py-5" : isTablet ? "px-5 py-6" : "px-6 lg:px-8 py-8"
      }`}
    >
      {/* Top Bar */}
      <div className="flex flex-col gap-4 rounded-2xl border border-white/10 bg-[#0D1322] p-4 sm:p-5 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <div className="flex flex-wrap items-center gap-2">
            <span className="text-[11px] font-bold uppercase tracking-[0.2em] text-emerald-400">
              {t(
                "Panel de Entrenador · SYNERGIA ALL STARS",
                "Coach Panel · SYNERGIA ALL STARS"
              )}
            </span>
            {currentUser && (
              <span className="rounded-md bg-emerald-500/15 px-2 py-0.5 text-[10px] font-bold text-emerald-300 border border-emerald-500/25">
                {currentUser.username} ({currentUser.role})
              </span>
            )}
            <span className="rounded-md bg-white/[0.06] px-2 py-0.5 text-[10px] font-semibold text-slate-300 border border-white/10">
              {t("Pantalla:", "Screen:")} {deviceLabel}
            </span>
          </div>
          <h1 className="mt-1 text-xl sm:text-2xl font-extrabold text-white">
            {t("Sistema de Gestión Deportiva", "Sports Management System")}
          </h1>
        </div>

        <div className="flex flex-wrap items-center gap-2.5 sm:gap-3">
          {newApplicantsCount > 0 && (
            <button
              type="button"
              onClick={() => setActiveTab("inscripcion")}
              className="inline-flex items-center gap-2 rounded-xl border border-amber-400/40 bg-amber-400/15 px-3.5 py-2 text-xs font-bold text-amber-200 animate-pulse cursor-pointer"
            >
              <span className="h-2 w-2 rounded-full bg-amber-400" />
              {t(
                `Aviso: ${newApplicantsCount} aspirante(s) nuevo(s)`,
                `Notice: ${newApplicantsCount} new applicant(s)`
              )}
            </button>
          )}
          {pendingPaymentsCount > 0 && (
            <button
              type="button"
              onClick={() => setActiveTab("contabilidad")}
              className="inline-flex items-center gap-2 rounded-xl border border-emerald-400/40 bg-emerald-500/15 px-3.5 py-2 text-xs font-bold text-emerald-200 cursor-pointer"
            >
              <span className="h-2 w-2 rounded-full bg-emerald-400 animate-pulse" />
              {t(
                `${pendingPaymentsCount} pago(s) por verificar`,
                `${pendingPaymentsCount} payment(s) to verify`
              )}
            </button>
          )}
          {pendingRequestsCount > 0 && (
            <button
              type="button"
              onClick={() => setActiveTab("solicitudes")}
              className="inline-flex items-center gap-2 rounded-xl border border-[#9D5BB8]/50 bg-[#7E3D97]/25 px-3.5 py-2 text-xs font-bold text-purple-200 animate-pulse cursor-pointer"
            >
              <span className="h-2 w-2 rounded-full bg-[#B575CF]" />
              {t(
                `Aviso: ${pendingRequestsCount} solicitud(es) de material`,
                `Notice: ${pendingRequestsCount} material request(s)`
              )}
            </button>
          )}
          <button
            type="button"
            onClick={onLogout}
            className="rounded-xl border border-white/15 px-4 py-2 text-xs font-semibold text-slate-300 hover:bg-white/5 hover:text-white transition-colors cursor-pointer"
          >
            {t("Cerrar Sesión", "Sign Out")}
          </button>
        </div>
      </div>

      {/* Navigation Tabs */}
      <div
        className={`gap-2 border-b border-white/10 pb-3 ${
          isMobile
            ? "grid grid-cols-2"
            : "flex flex-wrap"
        }`}
      >
        {(
          [
            {
              key: "inscripcion",
              label: t("INSCRIPCION", "REGISTRATION"),
              badge: newApplicantsCount,
            },
            {
              key: "formularios",
              label: t("Formularios", "Forms"),
              badge: state.forms.length,
            },
            {
              key: "evaluacion",
              label: t("Evaluación y PDF", "Evaluation & PDF"),
              badge: 0,
            },
            {
              key: "perfil",
              label: t("Perfil del Atleta", "Athlete Profile"),
              badge: state.athletes.length,
            },
            {
              key: "contabilidad",
              label: t("Contabilidad y Pagos", "Accounting & Payments"),
              badge: pendingPaymentsCount,
            },
            {
              key: "morosos",
              label: t("Morosos y Avisos", "Overdue & Notices"),
              badge: defaultersList.length,
            },
            {
              key: "solicitudes",
              label: t("Solicitudes de Atletas", "Athlete Requests"),
              badge: pendingRequestsCount,
            },
          ] as const
        ).map((tab) => (
          <button
            key={tab.key}
            type="button"
            onClick={() => setActiveTab(tab.key)}
            className={`inline-flex items-center justify-center gap-2 rounded-xl px-3 sm:px-4 py-2.5 text-xs sm:text-sm font-bold transition-all cursor-pointer ${
              activeTab === tab.key
                ? "bg-emerald-500 text-slate-950 shadow-lg shadow-emerald-500/20"
                : "bg-[#0D1322] text-slate-300 border border-white/10 hover:text-white"
            }`}
          >
            {tab.label}
            {tab.badge > 0 && (
              <span
                className={`rounded-full px-2 py-0.5 text-[11px] font-extrabold ${
                  activeTab === tab.key
                    ? "bg-slate-950/20 text-slate-950"
                    : "bg-amber-400/20 text-amber-300"
                }`}
              >
                {tab.badge}
              </span>
            )}
          </button>
        ))}
      </div>

      {/* TAB 1: INSCRIPCION */}
      {activeTab === "inscripcion" && (
        <div className="space-y-6">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2">
            <div>
              <h2 className="text-xl font-bold text-white">
                Módulo INSCRIPCION · Aspirantes y Citas
              </h2>
              <p className="text-sm text-slate-400">
                Asigna citas de prueba, selecciona el formulario de evaluación,
                elimina inasistentes o formaliza atletas.
              </p>
            </div>
          </div>

          {state.applications.length === 0 ? (
            <div className="rounded-2xl border border-white/10 bg-[#0D1322] p-10 text-center text-slate-400">
              No hay solicitudes de inscripción registradas todavía. Cuando un
              aspirante llene el formulario en <strong>INSCRIBETE</strong>,
              aparecerá aquí con un aviso.
            </div>
          ) : (
            <div className="grid gap-4">
              {state.applications.map((app) => (
                <div
                  key={app.id}
                  className="rounded-2xl border border-white/10 bg-[#0D1322] p-5 flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between"
                >
                  <div className="space-y-1.5">
                    <div className="flex flex-wrap items-center gap-2">
                      <span className="font-mono text-xs font-bold text-amber-300">
                        {app.trackingCode}
                      </span>
                      <span
                        className={`rounded-full px-2.5 py-0.5 text-[11px] font-bold uppercase ${
                          app.status === "nuevo"
                            ? "bg-amber-400/20 text-amber-300 border border-amber-400/30"
                            : app.status === "cita_asignada"
                            ? "bg-cyan-500/20 text-cyan-300 border border-cyan-500/30"
                            : app.status === "evaluado"
                            ? "bg-emerald-500/20 text-emerald-300 border border-emerald-500/30"
                            : "bg-purple-500/20 text-purple-300 border border-purple-500/30"
                        }`}
                      >
                        {app.status.replace("_", " ")}
                      </span>
                      <span className="text-xs text-slate-400">
                        Edad: {app.age} años
                      </span>
                    </div>

                    <h3 className="text-lg font-bold text-white">
                      {app.fullName}
                    </h3>
                    <p className="text-xs text-slate-300">
                      Doc: {app.documentId} · Tel: {app.phone} · {app.email}
                    </p>
                    {app.isMinor && app.repName && (
                      <p className="text-xs text-emerald-300">
                        Representante: {app.repName} ({app.repRelationship}) ·
                        Doc: {app.repDocumentId}
                      </p>
                    )}
                    {app.appointmentDate && (
                      <p className="text-xs text-cyan-300 font-medium">
                        Cita asignada: {app.appointmentDate} a las{" "}
                        {app.appointmentTime || "por confirmar"}
                      </p>
                    )}
                    {app.evaluation && (
                      <p className="text-xs text-amber-300 font-semibold">
                        Evaluación: {app.evaluation.totalScore} /{" "}
                        {app.evaluation.maxScore} pts
                      </p>
                    )}
                  </div>

                  <div className="flex flex-wrap items-center gap-2">
                    {app.status !== "formalizado" && (
                      <>
                        <button
                          type="button"
                          onClick={() => {
                            setCitaAppId(app.id);
                            setCitaDate(app.appointmentDate ?? "");
                            setCitaTime(app.appointmentTime ?? "");
                            setCitaFormId(
                              app.assignedFormId ?? state.forms[0]?.id ?? ""
                            );
                          }}
                          className="rounded-xl border border-cyan-400/40 bg-cyan-500/10 px-3.5 py-2 text-xs font-bold text-cyan-300 hover:bg-cyan-500/20 cursor-pointer"
                        >
                          Asignar Cita / Form
                        </button>

                        <button
                          type="button"
                          onClick={() => handleGoToEvaluation(app)}
                          className="rounded-xl border border-emerald-400/40 bg-emerald-500/10 px-3.5 py-2 text-xs font-bold text-emerald-300 hover:bg-emerald-500/20 cursor-pointer"
                        >
                          Evaluar Atleta
                        </button>

                        <button
                          type="button"
                          onClick={() => {
                            setFormalizeAppId(app.id);
                            setFormalizeCategory(
                              app.evaluation?.category ?? CHEER_CATEGORIES[0]
                            );
                          }}
                          className="rounded-xl bg-amber-400 px-3.5 py-2 text-xs font-bold text-slate-950 hover:bg-amber-300 cursor-pointer"
                        >
                          Formalizar Inscripción
                        </button>

                        <button
                          type="button"
                          onClick={() => handleDeleteApplication(app.id)}
                          className="rounded-xl border border-rose-500/40 bg-rose-500/10 px-3.5 py-2 text-xs font-bold text-rose-300 hover:bg-rose-500/20 cursor-pointer"
                        >
                          Eliminar (No asistió)
                        </button>
                      </>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* TAB 2: FORMULARIOS */}
      {activeTab === "formularios" && (
        <div className="grid gap-8 lg:grid-cols-2">
          {/* Creador de formulario */}
          <form
            onSubmit={handleSaveFormTemplate}
            className="rounded-2xl border border-white/10 bg-[#0D1322] p-6 space-y-5"
          >
            <div>
              <h2 className="text-xl font-bold text-white">
                Crear Formulario de Evaluación
              </h2>
              <p className="text-xs text-slate-400 mt-1">
                Agrega actividades con su descripción y ponderación, y clasifica
                el formulario por categoría.
              </p>
            </div>

            <div>
              <label className="block text-sm font-semibold text-slate-200">
                Nombre del formulario *
              </label>
              <input
                type="text"
                required
                value={formName}
                onChange={(e) => setFormName(e.target.value)}
                placeholder="Ej. Prueba Técnica Junior 2026"
                className="mt-1.5 w-full rounded-xl border border-white/15 bg-[#070B14] px-4 py-2.5 text-sm text-white focus:border-emerald-400 focus:outline-none"
              />
            </div>

            <div>
              <label className="block text-sm font-semibold text-slate-200">
                Clasificar por Categoría *
              </label>
              <select
                value={formCategory}
                onChange={(e) => setFormCategory(e.target.value)}
                className="mt-1.5 w-full rounded-xl border border-white/15 bg-[#070B14] px-4 py-2.5 text-sm text-white focus:border-emerald-400 focus:outline-none"
              >
                {CHEER_CATEGORIES.map((c) => (
                  <option key={c} value={c}>
                    {c}
                  </option>
                ))}
              </select>
            </div>

            <div className="rounded-xl border border-white/10 bg-[#070B14]/70 p-4 space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-sm font-bold text-white">
                  Actividades ({draftActivities.length})
                </span>
                <button
                  type="button"
                  onClick={() => setShowActivityModal(true)}
                  className="rounded-lg bg-amber-400 px-3 py-1.5 text-xs font-bold text-slate-950 hover:bg-amber-300 cursor-pointer"
                >
                  + Agregar descripción
                </button>
              </div>

              {draftActivities.length === 0 ? (
                <p className="text-xs text-slate-400">
                  Haz clic en &ldquo;Agregar descripción&rdquo; para añadir
                  actividades y ponderaciones.
                </p>
              ) : (
                <ul className="space-y-2">
                  {draftActivities.map((act, idx) => (
                    <li
                      key={act.id}
                      className="flex items-center justify-between rounded-lg border border-white/10 bg-[#0D1322] px-3 py-2 text-xs"
                    >
                      <span className="text-slate-200">
                        {idx + 1}. {act.description}
                      </span>
                      <div className="flex items-center gap-3">
                        <span className="font-bold text-emerald-300">
                          {act.weight} pts
                        </span>
                        <button
                          type="button"
                          onClick={() =>
                            setDraftActivities((prev) =>
                              prev.filter((a) => a.id !== act.id)
                            )
                          }
                          className="text-rose-400 hover:text-rose-300 cursor-pointer"
                        >
                          ✕
                        </button>
                      </div>
                    </li>
                  ))}
                </ul>
              )}
            </div>

            <button
              type="submit"
              disabled={draftActivities.length === 0}
              className="w-full rounded-xl bg-emerald-500 py-3 text-sm font-bold text-slate-950 hover:bg-emerald-400 disabled:opacity-40 cursor-pointer"
            >
              Guardar Formulario
            </button>
          </form>

          {/* Lista de formularios guardados / predeterminados */}
          <div className="space-y-4">
            <h2 className="text-xl font-bold text-white">
              Formularios Disponibles
            </h2>
            {state.forms.map((form) => (
              <div
                key={form.id}
                className="rounded-2xl border border-white/10 bg-[#0D1322] p-5 space-y-3"
              >
                <div className="flex items-start justify-between gap-2">
                  <div>
                    <h3 className="font-bold text-white">{form.name}</h3>
                    <p className="text-xs text-amber-300">{form.category}</p>
                  </div>
                  {form.isDefault && (
                    <span className="rounded-full bg-white/10 px-2.5 py-0.5 text-[10px] font-semibold text-slate-300">
                      Predeterminado
                    </span>
                  )}
                </div>

                <ul className="space-y-1.5 text-xs text-slate-300">
                  {form.activities.map((act) => (
                    <li
                      key={act.id}
                      className="flex justify-between border-b border-white/5 pb-1"
                    >
                      <span>✓ {act.description}</span>
                      <span className="font-semibold text-emerald-300">
                        {act.weight} pts
                      </span>
                    </li>
                  ))}
                </ul>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* TAB 3: EVALUACIÓN Y PDF */}
      {activeTab === "evaluacion" && (
        <div className="grid gap-8 lg:grid-cols-3">
          {/* Llamar al atleta por nombre */}
          <div className="rounded-2xl border border-white/10 bg-[#0D1322] p-5 space-y-4">
            <h2 className="text-lg font-bold text-white">
              Llamar Atleta a Prueba
            </h2>
            <input
              type="text"
              value={evalSearch}
              onChange={(e) => setEvalSearch(e.target.value)}
              placeholder="Buscar nombre del atleta..."
              className="w-full rounded-xl border border-white/15 bg-[#070B14] px-3.5 py-2.5 text-sm text-white placeholder:text-slate-500 focus:border-emerald-400 focus:outline-none"
            />
            <div className="space-y-2 max-h-96 overflow-y-auto">
              {filteredEvalApps.length === 0 ? (
                <p className="text-xs text-slate-400">
                  No hay aspirantes pendientes por evaluar.
                </p>
              ) : (
                filteredEvalApps.map((app) => (
                  <button
                    key={app.id}
                    type="button"
                    onClick={() => handleSelectEvalAthlete(app.id)}
                    className={`w-full text-left rounded-xl border p-3 transition-all cursor-pointer ${
                      selectedEvalAppId === app.id
                        ? "border-emerald-400 bg-emerald-500/10"
                        : "border-white/10 bg-[#070B14]/60 hover:border-white/25"
                    }`}
                  >
                    <p className="text-sm font-bold text-white">
                      {app.fullName}
                    </p>
                    <p className="text-[11px] text-slate-400">
                      {app.trackingCode} · {app.age} años
                    </p>
                  </button>
                ))
              )}
            </div>
          </div>

          {/* Formulario con Check Marks */}
          <div className="lg:col-span-2 rounded-2xl border border-white/10 bg-[#0D1322] p-6 space-y-5">
            {!currentEvalApp ? (
              <div className="py-16 text-center text-slate-400 text-sm">
                Selecciona o llama el nombre de un atleta en la columna
                izquierda para cargar su formulario de evaluación.
              </div>
            ) : (
              <>
                <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 border-b border-white/10 pb-4">
                  <div>
                    <span className="text-xs font-bold uppercase text-emerald-400">
                      Evaluando a:
                    </span>
                    <h2 className="text-xl font-extrabold text-white">
                      {currentEvalApp.fullName}
                    </h2>
                  </div>

                  <select
                    value={evalFormId}
                    onChange={(e) => handleChangeEvalForm(e.target.value)}
                    className="rounded-xl border border-white/15 bg-[#070B14] px-3.5 py-2 text-xs font-semibold text-white focus:border-emerald-400 focus:outline-none"
                  >
                    {state.forms.map((f) => (
                      <option key={f.id} value={f.id}>
                        {f.name}
                      </option>
                    ))}
                  </select>
                </div>

                <div className="space-y-3">
                  {evalItems.map((item) => (
                    <div
                      key={item.activityId}
                      className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 rounded-xl border border-white/10 bg-[#070B14]/70 p-4"
                    >
                      <label className="flex items-center gap-3 cursor-pointer">
                        <input
                          type="checkbox"
                          checked={item.checked}
                          onChange={() => toggleActivityCheck(item.activityId)}
                          className="h-5 w-5 accent-emerald-500 rounded cursor-pointer"
                        />
                        <span className="text-sm font-medium text-white">
                          {item.description}
                        </span>
                      </label>

                      <div className="flex items-center gap-2 shrink-0">
                        <input
                          type="number"
                          min={0}
                          max={item.weight}
                          value={item.score}
                          onChange={(e) =>
                            updateActivityScore(item.activityId, e.target.value)
                          }
                          className="w-20 rounded-lg border border-white/15 bg-[#0D1322] px-2.5 py-1.5 text-right text-sm font-bold text-emerald-300 focus:border-emerald-400 focus:outline-none"
                        />
                        <span className="text-xs text-slate-400">
                          / {item.weight} pts
                        </span>
                      </div>
                    </div>
                  ))}
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-300 mb-1.5">
                    Observaciones del entrenador (opcional)
                  </label>
                  <textarea
                    rows={2}
                    value={evalNotes}
                    onChange={(e) => setEvalNotes(e.target.value)}
                    placeholder="Comentarios técnicos sobre el desempeño en la prueba..."
                    className="w-full rounded-xl border border-white/15 bg-[#070B14] px-3.5 py-2.5 text-sm text-white focus:border-emerald-400 focus:outline-none"
                  />
                </div>

                <div className="flex flex-wrap items-center justify-between gap-4 border-t border-white/10 pt-4">
                  <div className="text-sm font-bold text-white">
                    Total:{" "}
                    <span className="text-emerald-400 text-lg">
                      {evalItems.reduce((s, i) => s + i.score, 0)}
                    </span>{" "}
                    / {evalItems.reduce((s, i) => s + i.weight, 0)} pts
                  </div>

                  <div className="flex flex-wrap gap-2.5">
                    <button
                      type="button"
                      onClick={handleSaveEvaluation}
                      className="rounded-xl bg-emerald-500 px-5 py-2.5 text-sm font-bold text-slate-950 hover:bg-emerald-400 cursor-pointer"
                    >
                      Guardar
                    </button>

                    {currentEvalApp.evaluation && (
                      <>
                        <button
                          type="button"
                          onClick={() => generateEvaluationPdf(currentEvalApp)}
                          className="rounded-xl border border-amber-400/50 bg-amber-400/15 px-4 py-2.5 text-sm font-bold text-amber-200 hover:bg-amber-400/25 cursor-pointer"
                        >
                          Generar Reporte PDF
                        </button>
                        <button
                          type="button"
                          onClick={() => {
                            setFormalizeAppId(currentEvalApp.id);
                            setFormalizeCategory(
                              currentEvalApp.evaluation?.category ??
                                CHEER_CATEGORIES[0]
                            );
                          }}
                          className="rounded-xl bg-amber-400 px-4 py-2.5 text-sm font-bold text-slate-950 hover:bg-amber-300 cursor-pointer"
                        >
                          Finiquitar Inscripción
                        </button>
                      </>
                    )}
                  </div>
                </div>

                {evalSavedMsg && (
                  <div className="rounded-xl border border-emerald-500/30 bg-emerald-500/10 p-3 text-xs text-emerald-200">
                    {evalSavedMsg}
                  </div>
                )}
              </>
            )}
          </div>
        </div>
      )}

      {/* TAB 4: PERFIL DEL ATLETA */}
      {activeTab === "perfil" && (
        <div className="space-y-6">
          <div className="grid gap-6 lg:grid-cols-3">
            <div className="rounded-2xl border border-white/10 bg-[#0D1322] p-5 space-y-3">
              <h2 className="text-lg font-bold text-white">
                Atletas Formalizados ({state.athletes.length})
              </h2>
              {state.athletes.length === 0 ? (
                <p className="text-xs text-slate-400">
                  Aún no hay atletas formalizados. Formaliza un aspirante desde
                  el módulo INSCRIPCION o Evaluación.
                </p>
              ) : (
                <div className="space-y-2">
                  {state.athletes.map((ath) => (
                    <button
                      key={ath.athleteId}
                      type="button"
                      onClick={() => setSelectedAthleteId(ath.athleteId)}
                      className={`w-full text-left rounded-xl border p-3 transition-all cursor-pointer ${
                        selectedAthlete?.athleteId === ath.athleteId
                          ? "border-emerald-400 bg-emerald-500/10"
                          : "border-white/10 bg-[#070B14]/60 hover:border-white/25"
                      }`}
                    >
                      <p className="text-sm font-bold text-white">
                        {ath.fullName}
                      </p>
                      <p className="font-mono text-[11px] text-amber-300">
                        ID: {ath.athleteId}
                      </p>
                      <p className="text-[11px] text-slate-400">
                        Usuario: <strong>{ath.username}</strong> ·{" "}
                        {ath.mustChangePassword
                          ? "Clave prov: 123456"
                          : "Clave actualizada"}
                      </p>
                    </button>
                  ))}
                </div>
              )}
            </div>

            <div className="lg:col-span-2 space-y-6">
              {selectedAthlete ? (
                <>
                  <div className="rounded-2xl border border-white/10 bg-[#0D1322] p-6 space-y-3">
                    <div className="flex flex-wrap items-center justify-between gap-2">
                      <div>
                        <h3 className="text-xl font-extrabold text-white">
                          {selectedAthlete.fullName}
                        </h3>
                        <p className="text-xs text-emerald-300">
                          {selectedAthlete.category} · {selectedAthlete.position}
                        </p>
                      </div>
                      <span className="rounded-xl border border-amber-400/30 bg-amber-400/10 px-3 py-1.5 font-mono text-xs font-bold text-amber-300">
                        ID: {selectedAthlete.athleteId}
                      </span>
                    </div>

                    <div className="grid gap-3 sm:grid-cols-3 text-xs pt-2 border-t border-white/10">
                      <div>
                        <span className="text-slate-400 block">Usuario:</span>
                        <span className="font-mono font-bold text-white">
                          {selectedAthlete.username}
                        </span>
                      </div>
                      <div>
                        <span className="text-slate-400 block">
                          Clave provisional:
                        </span>
                        <span className="font-mono text-amber-300">
                          {selectedAthlete.mustChangePassword
                            ? "123456 (pendiente cambio)"
                            : "Cambiada por atleta"}
                        </span>
                      </div>
                      <div>
                        <span className="text-slate-400 block">
                          Estado de ficha médica:
                        </span>
                        <span className="text-emerald-300 font-semibold">
                          {selectedAthlete.profileCompleted
                            ? "Completa"
                            : "Pendiente por atleta"}
                        </span>
                      </div>
                    </div>
                  </div>

                  <AthleteCarnet athlete={selectedAthlete} />
                </>
              ) : (
                <div className="rounded-2xl border border-white/10 bg-[#0D1322] p-10 text-center text-sm text-slate-400">
                  Selecciona un atleta para ver su perfil y su carnet digital.
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* MODAL: Agregar Descripción y Ponderación */}
      {showActivityModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/75 p-4 backdrop-blur-sm">
          <form
            onSubmit={handleAddActivityModal}
            className="w-full max-w-md rounded-2xl border border-white/15 bg-[#0D1322] p-6 space-y-4 shadow-2xl"
          >
            <h3 className="text-lg font-bold text-white">
              Agregar Actividad al Formulario
            </h3>
            <div>
              <label className="block text-xs font-semibold text-slate-200">
                Descripción de la actividad *
              </label>
              <input
                type="text"
                required
                value={actDescription}
                onChange={(e) => setActDescription(e.target.value)}
                placeholder="Ej. Ejecución de Toe Touch con brazos firmes"
                className="mt-1.5 w-full rounded-xl border border-white/15 bg-[#070B14] px-3.5 py-2.5 text-sm text-white focus:border-emerald-400 focus:outline-none"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-200">
                Ponderación (puntos) *
              </label>
              <input
                type="number"
                min={1}
                max={100}
                required
                value={actWeight}
                onChange={(e) => setActWeight(e.target.value)}
                className="mt-1.5 w-full rounded-xl border border-white/15 bg-[#070B14] px-3.5 py-2.5 text-sm text-white focus:border-emerald-400 focus:outline-none"
              />
            </div>
            <div className="flex justify-end gap-2 pt-2">
              <button
                type="button"
                onClick={() => setShowActivityModal(false)}
                className="rounded-xl border border-white/15 px-4 py-2 text-xs font-semibold text-slate-300 cursor-pointer"
              >
                Cancelar
              </button>
              <button
                type="submit"
                className="rounded-xl bg-amber-400 px-4 py-2 text-xs font-bold text-slate-950 cursor-pointer"
              >
                Agregar
              </button>
            </div>
          </form>
        </div>
      )}

      {/* 5. CONTABILIDAD Y VERIFICACIÓN DE PAGOS */}
      {activeTab === "contabilidad" && (
        <section className="space-y-6">
          <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4 rounded-2xl border border-white/10 bg-[#0D1322] p-5">
            <div>
              <h2 className="text-lg font-bold text-white">
                {t("Módulo de Contabilidad y Verificación de Pagos", "Accounting & Payment Verification")}
              </h2>
              <p className="text-xs text-slate-400 mt-1">
                {t(
                  "Al aprobar un pago, se descuenta automáticamente del saldo pendiente del mes en contabilidad.",
                  "Approving a payment automatically deducts it from the month's pending balance."
                )}
              </p>
            </div>

            <div className="flex flex-wrap items-end gap-3">
              <div>
                <label className="block text-[11px] font-semibold text-slate-300">
                  {t("Mes Contable", "Accounting Month")}
                </label>
                <input
                  type="month"
                  value={accountingMonth}
                  onChange={(e) => setAccountingMonth(e.target.value)}
                  className="mt-1 rounded-xl border border-white/15 bg-[#070B14] px-3 py-2 text-xs text-white"
                />
              </div>

              <form onSubmit={handleSaveMonthlyFee} className="flex items-end gap-2">
                <div>
                  <label className="block text-[11px] font-semibold text-slate-300">
                    {t("Mensualidad ($)", "Monthly Fee ($)")}
                  </label>
                  <input
                    type="number"
                    min={1}
                    step="0.01"
                    value={feeInput}
                    onChange={(e) => setFeeInput(e.target.value)}
                    className="mt-1 w-24 rounded-xl border border-white/15 bg-[#070B14] px-3 py-2 text-xs text-white"
                  />
                </div>
                <button
                  type="submit"
                  className="rounded-xl bg-emerald-500 px-3 py-2 text-xs font-bold text-slate-950 hover:bg-emerald-400 cursor-pointer"
                >
                  {t("Actualizar", "Update")}
                </button>
              </form>
            </div>
          </div>

          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            <div className="rounded-2xl border border-white/10 bg-[#0D1322] p-4">
              <p className="text-xs text-slate-400">{t("Esperado del Mes", "Expected Monthly")}</p>
              <p className="mt-1 text-2xl font-extrabold text-white">${totalExpectedMonth.toFixed(2)}</p>
            </div>
            <div className="rounded-2xl border border-emerald-500/30 bg-emerald-500/10 p-4">
              <p className="text-xs text-emerald-300">{t("Ingresos Aprobados (Descontado)", "Approved Income")}</p>
              <p className="mt-1 text-2xl font-extrabold text-emerald-400">${totalApprovedMonth.toFixed(2)}</p>
            </div>
            <div className="rounded-2xl border border-rose-500/30 bg-rose-500/10 p-4">
              <p className="text-xs text-rose-300">{t("Saldo Pendiente por Cobrar", "Remaining Balance")}</p>
              <p className="mt-1 text-2xl font-extrabold text-rose-300">${totalPendingDebtMonth.toFixed(2)}</p>
            </div>
            <div className="rounded-2xl border border-amber-400/30 bg-amber-400/10 p-4">
              <p className="text-xs text-amber-300">{t("Pagos por Verificar", "Payments to Verify")}</p>
              <p className="mt-1 text-2xl font-extrabold text-amber-300">{pendingPaymentsCount}</p>
            </div>
          </div>

          <div className="rounded-2xl border border-white/10 bg-[#0D1322] p-5 space-y-4">
            <h3 className="text-base font-bold text-white">
              {t("Comprobantes de Pago Recibidos", "Received Payment Proofs")} ({state.payments.length})
            </h3>
            {state.payments.length === 0 ? (
              <p className="py-8 text-center text-xs text-slate-400">
                {t("No hay pagos registrados por atletas todavía.", "No athlete payments registered yet.")}
              </p>
            ) : (
              <div className="space-y-3">
                {state.payments.map((p) => (
                  <div
                    key={p.id}
                    className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 rounded-2xl border border-white/10 bg-[#070B14]/80 p-4 text-xs"
                  >
                    <div className="space-y-1">
                      <div className="flex flex-wrap items-center gap-2">
                        <span className="text-sm font-bold text-white">{p.athleteName}</span>
                        <span className="font-mono text-amber-300">{p.athleteId}</span>
                        <span className="rounded-md bg-white/10 px-2 py-0.5 text-[10px] font-bold uppercase text-slate-200">
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
                          Banco: {p.bank} · Ref: <span className="font-mono">{p.reference}</span> · Cédula: {p.documentId}
                          {p.phone ? ` · Tel: ${p.phone}` : ""}
                        </p>
                      )}
                      {p.cashPhotoDataUrl && (
                        <div className="pt-1">
                          <p className="text-[11px] text-amber-300 mb-1">Foto de efectivo adjunta:</p>
                          {/* eslint-disable-next-line @next/next/no-img-element */}
                          <img
                            src={p.cashPhotoDataUrl}
                            alt={`Efectivo ${p.athleteName}`}
                            className="h-24 w-auto rounded-lg border border-white/15 object-cover"
                          />
                        </div>
                      )}
                    </div>

                    {p.status === "pendiente" && (
                      <div className="flex flex-wrap gap-2 shrink-0">
                        <button
                          type="button"
                          onClick={() => handleReviewPayment(p.id, "aprobado")}
                          className="rounded-xl bg-emerald-500 px-4 py-2 text-xs font-bold text-slate-950 hover:bg-emerald-400 cursor-pointer"
                        >
                          {t("Aprobar y Descontar", "Approve & Deduct")}
                        </button>
                        <button
                          type="button"
                          onClick={() => handleReviewPayment(p.id, "rechazado")}
                          className="rounded-xl border border-rose-500/40 bg-rose-500/10 px-4 py-2 text-xs font-bold text-rose-300 hover:bg-rose-500/20 cursor-pointer"
                        >
                          {t("Rechazar", "Reject")}
                        </button>
                      </div>
                    )}
                  </div>
                ))}
              </div>
            )}
          </div>
        </section>
      )}

      {/* 6. LISTA DE MOROSOS Y NOTIFICACIONES DE PAGO */}
      {activeTab === "morosos" && (
        <section className="space-y-6">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 rounded-2xl border border-rose-500/30 bg-[#0D1322] p-5">
            <div>
              <h2 className="text-lg font-bold text-white">
                {t("Lista de Atletas Morosos", "Overdue Athletes List")} ({accountingMonth})
              </h2>
              <p className="text-xs text-slate-400 mt-1">
                {t(
                  "Los pagos de la academia se reciben hasta el día 15 de cada mes. Envía notificaciones de pago a quienes aún no completan su mensualidad.",
                  "Academy payments are due by the 15th of each month. Send payment notifications to athletes with pending fees."
                )}
              </p>
            </div>

            {defaultersList.length > 0 && (
              <button
                type="button"
                onClick={handleNotifyAllDefaulters}
                className="rounded-xl bg-rose-500 px-4 py-2.5 text-xs font-bold text-white hover:bg-rose-400 cursor-pointer shrink-0"
              >
                {t(
                  `Notificar a Todos (${defaultersList.length})`,
                  `Notify All (${defaultersList.length})`
                )}
              </button>
            )}
          </div>

          {notifyFeedback && (
            <div className="rounded-xl border border-emerald-500/30 bg-emerald-500/10 p-3 text-xs text-emerald-200">
              {notifyFeedback}
            </div>
          )}

          {defaultersList.length === 0 ? (
            <div className="rounded-2xl border border-white/10 bg-[#0D1322] p-8 text-center text-xs text-slate-400">
              {state.athletes.length === 0
                ? t("No hay atletas formalizados aún.", "No formalized athletes yet.")
                : t(
                    "¡Excelente! Todos los atletas están al día con el mes seleccionado.",
                    "Great! All athletes are up to date for the selected month."
                  )}
            </div>
          ) : (
            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
              {defaultersList.map((ath) => (
                <div
                  key={ath.athleteId}
                  className="rounded-2xl border border-rose-500/25 bg-[#0D1322] p-5 space-y-3"
                >
                  <div className="flex items-start justify-between gap-2">
                    <div>
                      <p className="text-sm font-bold text-white">{ath.fullName}</p>
                      <p className="text-[11px] font-mono text-amber-300">{ath.athleteId}</p>
                      <p className="text-[11px] text-slate-400 mt-1">{ath.category}</p>
                    </div>
                    <span className="rounded-full bg-rose-500/20 px-2.5 py-0.5 text-[10px] font-bold text-rose-300">
                      {t("Moroso", "Overdue")}
                    </span>
                  </div>
                  <p className="text-xs text-slate-300">
                    {t("Teléfono:", "Phone:")} {ath.phone}
                  </p>
                  <button
                    type="button"
                    onClick={() => handleSendPaymentNotification(ath.athleteId, ath.fullName)}
                    className="w-full rounded-xl border border-amber-400/40 bg-amber-400/15 py-2 text-xs font-bold text-amber-200 hover:bg-amber-400/25 cursor-pointer"
                  >
                    {t("Enviar Notificación de Pago", "Send Payment Notification")}
                  </button>
                </div>
              ))}
            </div>
          )}
        </section>
      )}

      {/* 7. SOLICITUDES DE MATERIALES DE ATLETAS */}
      {activeTab === "solicitudes" && (
        <section className="space-y-6">
          <div className="rounded-2xl border border-white/10 bg-[#0D1322] p-5">
            <h2 className="text-lg font-bold text-white">
              {t("Solicitudes de Uniformes y Materiales", "Uniform & Material Requests")} ({state.materialRequests.length})
            </h2>
            <p className="text-xs text-slate-400 mt-1">
              {t(
                "Solicitudes exclusivas enviadas por los atletas para sus entrenamientos.",
                "Exclusive requests submitted by athletes for their training."
              )}
            </p>
          </div>

          {state.materialRequests.length === 0 ? (
            <div className="rounded-2xl border border-white/10 bg-[#0D1322] p-8 text-center text-xs text-slate-400">
              {t("No hay solicitudes de materiales registradas.", "No material requests registered.")}
            </div>
          ) : (
            <div className="space-y-3">
              {state.materialRequests.map((req) => (
                <div
                  key={req.id}
                  className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 rounded-2xl border border-white/10 bg-[#0D1322] p-5 text-xs"
                >
                  <div className="space-y-1">
                    <div className="flex flex-wrap items-center gap-2">
                      <span className="text-sm font-bold text-white">{req.athleteName}</span>
                      <span className="font-mono text-amber-300">{req.athleteId}</span>
                      <span className="rounded-md bg-[#7E3D97]/30 px-2 py-0.5 text-[10px] font-bold text-purple-200">
                        {req.itemType} (x{req.quantity})
                      </span>
                      <span
                        className={`rounded-full px-2.5 py-0.5 text-[10px] font-bold uppercase ${
                          req.status === "entregado"
                            ? "bg-emerald-500/20 text-emerald-300"
                            : req.status === "aprobado"
                            ? "bg-sky-500/20 text-sky-300"
                            : "bg-amber-400/20 text-amber-300"
                        }`}
                      >
                        {req.status}
                      </span>
                    </div>
                    <p className="text-slate-200">{req.detail}</p>
                    {req.notes && <p className="text-slate-400">{req.notes}</p>}
                  </div>

                  <div className="flex flex-wrap gap-2 shrink-0">
                    {req.status === "pendiente" && (
                      <button
                        type="button"
                        onClick={() => handleUpdateRequestStatus(req.id, "aprobado")}
                        className="rounded-xl bg-sky-500 px-3.5 py-2 text-xs font-bold text-slate-950 hover:bg-sky-400 cursor-pointer"
                      >
                        {t("Aprobar", "Approve")}
                      </button>
                    )}
                    {req.status !== "entregado" && (
                      <button
                        type="button"
                        onClick={() => handleUpdateRequestStatus(req.id, "entregado")}
                        className="rounded-xl bg-emerald-500 px-3.5 py-2 text-xs font-bold text-slate-950 hover:bg-emerald-400 cursor-pointer"
                      >
                        {t("Marcar Entregado", "Mark Delivered")}
                      </button>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
        </section>
      )}

      {/* MODAL: Asignar Cita y Formulario */}
      {citaAppId && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/75 p-4 backdrop-blur-sm">
          <form
            onSubmit={handleSaveCita}
            className="w-full max-w-md rounded-2xl border border-white/15 bg-[#0D1322] p-6 space-y-4 shadow-2xl"
          >
            <h3 className="text-lg font-bold text-white">
              Asignar Cita de Prueba y Formulario
            </h3>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-semibold text-slate-200">
                  Fecha de cita *
                </label>
                <input
                  type="date"
                  required
                  value={citaDate}
                  onChange={(e) => setCitaDate(e.target.value)}
                  className="mt-1.5 w-full rounded-xl border border-white/15 bg-[#070B14] px-3 py-2 text-sm text-white [color-scheme:dark]"
                />
              </div>
              <div>
                <label className="block text-xs font-semibold text-slate-200">
                  Hora *
                </label>
                <input
                  type="time"
                  required
                  value={citaTime}
                  onChange={(e) => setCitaTime(e.target.value)}
                  className="mt-1.5 w-full rounded-xl border border-white/15 bg-[#070B14] px-3 py-2 text-sm text-white [color-scheme:dark]"
                />
              </div>
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-200">
                Formulario de evaluación asignado *
              </label>
              <select
                value={citaFormId}
                onChange={(e) => setCitaFormId(e.target.value)}
                className="mt-1.5 w-full rounded-xl border border-white/15 bg-[#070B14] px-3 py-2.5 text-sm text-white"
              >
                {state.forms.map((f) => (
                  <option key={f.id} value={f.id}>
                    {f.name} ({f.category})
                  </option>
                ))}
              </select>
            </div>
            <div className="flex justify-end gap-2 pt-2">
              <button
                type="button"
                onClick={() => setCitaAppId(null)}
                className="rounded-xl border border-white/15 px-4 py-2 text-xs font-semibold text-slate-300 cursor-pointer"
              >
                Cancelar
              </button>
              <button
                type="submit"
                className="rounded-xl bg-emerald-500 px-4 py-2 text-xs font-bold text-slate-950 cursor-pointer"
              >
                Guardar Cita
              </button>
            </div>
          </form>
        </div>
      )}

      {/* MODAL: Formalizar Inscripción */}
      {formalizeAppId && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/75 p-4 backdrop-blur-sm">
          <form
            onSubmit={handleFormalizeSubmit}
            className="w-full max-w-md rounded-2xl border border-white/15 bg-[#0D1322] p-6 space-y-4 shadow-2xl"
          >
            <h3 className="text-lg font-bold text-white">
              Formalizar Inscripción del Atleta
            </h3>
            <p className="text-xs text-slate-400">
              Determina la categoría y posición final. Al formalizar, se creará
              el perfil del atleta con su ID único, usuario (inicial + apellido)
              y clave provisional <strong className="text-amber-300">123456</strong>.
            </p>
            <div>
              <label className="block text-xs font-semibold text-slate-200">
                Categoría asignada *
              </label>
              <select
                value={formalizeCategory}
                onChange={(e) => setFormalizeCategory(e.target.value)}
                className="mt-1.5 w-full rounded-xl border border-white/15 bg-[#070B14] px-3 py-2.5 text-sm text-white"
              >
                {CHEER_CATEGORIES.map((c) => (
                  <option key={c} value={c}>
                    {c}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-200">
                Posición asignada *
              </label>
              <select
                value={formalizePosition}
                onChange={(e) => setFormalizePosition(e.target.value)}
                className="mt-1.5 w-full rounded-xl border border-white/15 bg-[#070B14] px-3 py-2.5 text-sm text-white"
              >
                {CHEER_POSITIONS.map((p) => (
                  <option key={p} value={p}>
                    {p}
                  </option>
                ))}
              </select>
            </div>
            <div className="flex justify-end gap-2 pt-2">
              <button
                type="button"
                onClick={() => setFormalizeAppId(null)}
                className="rounded-xl border border-white/15 px-4 py-2 text-xs font-semibold text-slate-300 cursor-pointer"
              >
                Cancelar
              </button>
              <button
                type="submit"
                className="rounded-xl bg-amber-400 px-4 py-2 text-xs font-bold text-slate-950 cursor-pointer"
              >
                Formalizar y Generar Usuario
              </button>
            </div>
          </form>
        </div>
      )}
    </div>
  );
}
