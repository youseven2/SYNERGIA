"use client";

import { ChangeEvent, useEffect, useState, FormEvent } from "react";
import {
  ActivityScore,
  AthleteEvaluation,
  AthleteProfile,
  AuditActionType,
  CHEER_CATEGORIES,
  CHEER_POSITIONS,
  EvaluationActivity,
  EvaluationFormTemplate,
  RegistrationApplication,
  RequestStatus,
  SynergiaEvent,
  SynergiaState,
  SystemUser,
  appendAuditLog,
  createRecordId,
  generateAthleteId,
  generateAthleteUsername,
  getAthletePaymentStatus,
  getCurrentMonthKey,
  saveSynergiaState,
  syncScheduledPaymentReminders,
} from "@/lib/synergia-store";
import {
  generateAnalyticsPdf,
  generateAthleteProfilePdf,
  generateAthletesListPdf,
  generateEvaluationPdf,
} from "@/lib/pdf-report";
import { AthleteCarnet } from "@/components/AthleteCarnet";
import { AttendanceControl } from "@/components/sistema/AttendanceControl";
import {
  AnalyticsState,
  formatDuration,
  loadAnalyticsState,
  resetAnalyticsState,
} from "@/lib/analytics-store";
import { useDevice } from "@/components/DeviceContext";
import { useI18n } from "@/components/I18nContext";

type CoachTab =
  | "menu"
  | "inscripcion"
  | "formularios"
  | "evaluacion"
  | "perfil"
  | "contabilidad"
  | "morosos"
  | "solicitudes"
  | "eventos"
  | "asistencia"
  | "metricas"
  | "usuarios"
  | "auditoria";

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
  const [activeTab, setActiveTab] = useState<CoachTab>("menu");

  useEffect(() => {
    const raf = requestAnimationFrame(() => {
      try {
        const savedTab = window.sessionStorage.getItem(
          "synergia_coach_active_tab"
        ) as CoachTab | null;
        if (savedTab) setActiveTab(savedTab);
      } catch {
        // ignore storage errors
      }
    });
    return () => cancelAnimationFrame(raf);
  }, []);

  useEffect(() => {
    try {
      window.sessionStorage.setItem("synergia_coach_active_tab", activeTab);
    } catch {
      // ignore storage errors
    }
  }, [activeTab]);

  // Sincronización automática de recordatorios de pago los días 5, 10 y 15 de cada mes
  useEffect(() => {
    const raf = requestAnimationFrame(() => {
      const { nextState, sentCount } = syncScheduledPaymentReminders(state);
      if (sentCount > 0) {
        onStateChange(nextState);
      }
    });
    return () => cancelAnimationFrame(raf);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Cita & Formalización modals/inline state
  const [citaAppId, setCitaAppId] = useState<string | null>(null);
  const [citaDate, setCitaDate] = useState("");
  const [citaTime, setCitaTime] = useState("");
  const [citaFormId, setCitaFormId] = useState(
    state.forms[0]?.id ?? ""
  );
  const [citaCategory, setCitaCategory] = useState<string>(CHEER_CATEGORIES[0]);
  const [lastCitaWa, setLastCitaWa] = useState<{
    athleteName: string;
    phoneDisplay: string;
    waUrl: string;
    message: string;
  } | null>(null);

  const [formalizeAppId, setFormalizeAppId] = useState<string | null>(null);
  const [formalizeCategory, setFormalizeCategory] = useState(
    CHEER_CATEGORIES[0]
  );

  // Formularios builder state
  const [editingFormId, setEditingFormId] = useState<string | null>(null);
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
  const [athleteCategoryFilter, setAthleteCategoryFilter] =
    useState<string>("TODAS");
  const [lastFormalizedWa, setLastFormalizedWa] = useState<{
    athleteName: string;
    phoneDisplay: string;
    waUrl: string;
    message: string;
  } | null>(null);

  // Contabilidad y Morosos state
  const [accountingMonth, setAccountingMonth] = useState(getCurrentMonthKey());
  const [feeInput, setFeeInput] = useState(String(state.monthlyFee || 30));
  const [notifyFeedback, setNotifyFeedback] = useState<string | null>(null);

  // Eventos state (solo entrenadores)
  const [evTitle, setEvTitle] = useState("");
  const [evDate, setEvDate] = useState("");
  const [evTime, setEvTime] = useState("");
  const [evLocation, setEvLocation] = useState("Los Dos Caminos, Av. El Centro");
  const [evCategory, setEvCategory] = useState("Competencia");
  const [evDescription, setEvDescription] = useState("");
  const [evFlyerDataUrl, setEvFlyerDataUrl] = useState("");
  const [evTargetAll, setEvTargetAll] = useState(true);
  const [evSelectedCategories, setEvSelectedCategories] = useState<string[]>([]);
  const [evReminderDays, setEvReminderDays] = useState("3");
  const [evSendNotice, setEvSendNotice] = useState(true);
  const [evSavedMsg, setEvSavedMsg] = useState<string | null>(null);
  const [coachFlyerModal, setCoachFlyerModal] = useState<{
    title: string;
    url: string;
  } | null>(null);
  const [analytics, setAnalytics] = useState<AnalyticsState>(() =>
    loadAnalyticsState()
  );

  // Gestión de Usuarios Administradores / Entrenadores
  const [newSysFullName, setNewSysFullName] = useState("");
  const [newSysUsername, setNewSysUsername] = useState("");
  const [newSysPassword, setNewSysPassword] = useState("");
  const [newSysRole, setNewSysRole] = useState<"Administrador" | "Entrenador">(
    "Entrenador"
  );
  const [sysUserError, setSysUserError] = useState<string | null>(null);
  const [sysUserSuccess, setSysUserSuccess] = useState<string | null>(null);
  const [editAthleteId, setEditAthleteId] = useState<string | null>(null);
  const [editAthUsername, setEditAthUsername] = useState("");
  const [editAthPassword, setEditAthPassword] = useState("");
  const [editAthCategory, setEditAthCategory] = useState<AthleteProfile["category"]>(
    CHEER_CATEGORIES[0]
  );
  const [editAthPosition, setEditAthPosition] = useState<AthleteProfile["position"]>(
    CHEER_POSITIONS[0]
  );
  const [promoteCategory, setPromoteCategory] = useState<string>(CHEER_CATEGORIES[0]);
  const [deleteConfirmAth, setDeleteConfirmAth] = useState<AthleteProfile | null>(null);
  const [deleteAuthPassword, setDeleteAuthPassword] = useState("");
  const [deleteAuthError, setDeleteAuthError] = useState<string | null>(null);
  const [auditSearch, setAuditSearch] = useState("");
  const [auditActionFilter, setAuditActionFilter] = useState<AuditActionType | "TODOS">("TODOS");

  useEffect(() => {
    if (activeTab === "metricas" || activeTab === "menu") {
      const raf = requestAnimationFrame(() => {
        setAnalytics(loadAnalyticsState());
      });
      return () => cancelAnimationFrame(raf);
    }
  }, [activeTab]);

  const newApplicantsCount = state.applications.filter(
    (a) => a.status === "nuevo"
  ).length;

  function commitState(next: SynergiaState) {
    saveSynergiaState(next);
    onStateChange(next);
  }

  function logAndCommit(
    next: SynergiaState,
    action: AuditActionType,
    moduleName: string,
    detail: string
  ) {
    const logged = appendAuditLog(next, {
      actorUsername: currentUser?.username ?? "admin",
      actorName: currentUser?.fullName ?? "Administrador",
      actorRole: currentUser?.role ?? "Administrador",
      action,
      module: moduleName,
      detail,
    });
    commitState(logged);
  }

  // --- INSCRIPCION ACTIONS ---
  function handleSaveCita(e: FormEvent) {
    e.preventDefault();
    if (!citaAppId) return;
    const citaApp = state.applications.find((a) => a.id === citaAppId);
    const updatedApps = state.applications.map((app) =>
      app.id === citaAppId
        ? {
            ...app,
            status: "cita_asignada" as const,
            appointmentDate: citaDate,
            appointmentTime: citaTime,
            assignedFormId: citaFormId || state.forms[0]?.id,
            assignedCategory: citaCategory,
          }
        : app
    );
    logAndCommit(
      { ...state, applications: updatedApps },
      "MODIFICACION",
      "Inscripción",
      `Cita de evaluación asignada a ${citaApp?.fullName ?? citaAppId} (${citaDate} ${citaTime} · ${citaCategory}).`
    );

    if (citaApp) {
      const rawPhone = (citaApp.repPhone || citaApp.phone || "").trim();
      let digits = rawPhone.replace(/\D/g, "");
      if (digits.startsWith("0")) {
        digits = `58${digits.slice(1)}`;
      }
      const recipientName =
        citaApp.isMinor && citaApp.repName
          ? citaApp.repName
          : citaApp.fullName;

      const citaMessage = [
        "🌟 *SYNERGIA ALL STARS* 🌟",
        "_Escuela Deportiva Exclusiva de Porrismo (Cheerleading)_",
        "",
        `Hola *${recipientName}*, te confirmamos que la cita de evaluación para el aspirante ha sido programada:`,
        "",
        `• *Aspirante:* ${citaApp.fullName}`,
        `• *Código:* ${citaApp.trackingCode}`,
        `• *Grupo:* ${citaCategory}`,
        `• *Día de presentación:* ${citaDate}`,
        `• *Hora:* ${citaTime}`,
        "",
        "📍 *UBICACIÓN DE NUESTRAS SEDES (Google Maps):*",
        "1️⃣ *Sede Los Dos Caminos:* Av. El Centro, Los Dos Caminos, Caracas 1071, Miranda",
        "🗺️ https://maps.app.goo.gl/CJdCAN3NnCqsErXAA?g_st=aw",
        "2️⃣ *Sede Bellas Artes:* Galería de Arte Nacional, Bellas Artes, Caracas 1010",
        "🗺️ https://maps.app.goo.gl/6zn5GhKKC9QA9aXx5?g_st=aw",
        "",
        "📞 *Número de contacto:* Dir. Felix (+58 414-3311099) | Dir. Daniela (+58 424-1535062)",
        "",
        "👕 Por favor asistir 10 minutos antes con ropa deportiva cómoda, calzado deportivo e hidratación.",
        "",
        "¡Te esperamos en SYNERGIA ALL STARS! 💪✨",
      ].join("\n");

      const waUrl = `https://wa.me/${digits}?text=${encodeURIComponent(
        citaMessage
      )}`;

      setLastCitaWa({
        athleteName: citaApp.fullName,
        phoneDisplay: rawPhone || "Sin teléfono registrado",
        waUrl,
        message: citaMessage,
      });

      if (digits.length >= 7 && typeof window !== "undefined") {
        window.open(waUrl, "_blank", "noopener,noreferrer");
      }
    }

    setCitaAppId(null);
    setCitaDate("");
    setCitaTime("");
  }

  function handleDeleteApplication(appId: string) {
    const targetApp = state.applications.find((a) => a.id === appId);
    const updatedApps = state.applications.filter((a) => a.id !== appId);
    logAndCommit(
      { ...state, applications: updatedApps },
      "ELIMINACION",
      "Inscripción",
      `Eliminación de solicitud de aspirante ${targetApp?.fullName ?? appId}.`
    );
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
      position: app.assignedPosition || "Por definir",
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
          }
        : item
    );

    logAndCommit(
      {
        ...state,
        applications: updatedApps,
        athletes: [newAthlete, ...state.athletes],
      },
      "CREACION",
      "Inscripción",
      `Formalización de inscripción: ${newAthlete.fullName} (${newAthlete.athleteId}) · Grupo: ${newAthlete.category}.`
    );

    setFormalizeAppId(null);
    setSelectedAthleteId(newAthlete.athleteId);
    setActiveTab("perfil");

    // Construir mensaje formal de WhatsApp con datos de la escuela, del atleta y credenciales
    const rawPhone = (app.phone || app.repPhone || "").trim();
    let digits = rawPhone.replace(/\D/g, "");
    if (digits.startsWith("0")) {
      digits = `58${digits.slice(1)}`;
    }
    const formalMessage = [
      "🌟 *SYNERGIA ALL STARS* 🌟",
      "_Club Deportivo Exclusivo de Porrismo (Cheerleading)_",
      "📍 Sedes: Los Dos Caminos (Av. El Centro) / Bellas Artes (Galería de Arte Nacional), Caracas",
      "📞 Número de contacto: Dir. Felix (+58 414-3311099) | Dir. Daniela (+58 424-1535062)",
      "",
      "Estimado(a), nos complace informarle que la inscripción del atleta ha sido *FORMALIZADA* exitosamente:",
      "",
      `🏅 *Atleta:* ${newAthlete.fullName}`,
      `🪪 *Documento / Cédula:* ${newAthlete.documentId}`,
      `🆔 *ID Oficial:* ${newAthlete.athleteId}`,
      `🏆 *Grupo Asignado:* ${newAthlete.category}`,
      ...(app.isMinor && app.repName
        ? [`👨‍👩‍👧 *Representante:* ${app.repName}`]
        : []),
      "",
      "🔐 *CREDENCIALES DE INGRESO AL SISTEMA:*",
      `• *Usuario:* ${newAthlete.username}`,
      `• *Clave provisional:* 123456`,
      "",
      "📲 Ingresa a nuestra plataforma en la sección *Ingresar al Sistema*, actualiza tu clave provisional, completa el formulario oficial con tu foto tipo carnet en fondo blanco y obtén tu *Carnet Oficial con Código QR*.",
      "",
      "¡Bienvenidos a la familia *SYNERGIA ALL STARS*! 💙💜",
    ].join("\n");

    const waUrl = digits
      ? `https://wa.me/${digits}?text=${encodeURIComponent(formalMessage)}`
      : `https://wa.me/?text=${encodeURIComponent(formalMessage)}`;

    setLastFormalizedWa({
      athleteName: newAthlete.fullName,
      phoneDisplay: rawPhone || "Sin número registrado",
      waUrl,
      message: formalMessage,
    });

    if (typeof window !== "undefined") {
      window.open(waUrl, "_blank", "noopener,noreferrer");
    }
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

    if (editingFormId) {
      const updatedForms = state.forms.map((f) =>
        f.id === editingFormId
          ? {
              ...f,
              name: formName.trim(),
              category: formCategory,
              activities: draftActivities,
            }
          : f
      );
      logAndCommit(
        { ...state, forms: updatedForms },
        "MODIFICACION",
        "Formularios",
        `Formulario de evaluación "${formName.trim()}" (${formCategory}) actualizado.`
      );
      setEditingFormId(null);
      setFormName("");
      setDraftActivities([]);
      return;
    }

    const newTemplate: EvaluationFormTemplate = {
      id: `form-${Date.now()}`,
      name: formName.trim(),
      category: formCategory,
      activities: draftActivities,
    };

    logAndCommit(
      {
        ...state,
        forms: [newTemplate, ...state.forms],
      },
      "CREACION",
      "Formularios",
      `Nuevo formulario creado: "${newTemplate.name}" (${newTemplate.category}).`
    );

    setFormName("");
    setDraftActivities([]);
  }

  function handleStartEditForm(form: EvaluationFormTemplate) {
    setEditingFormId(form.id);
    setFormName(form.name);
    setFormCategory(form.category);
    setDraftActivities(form.activities.map((a) => ({ ...a })));
  }

  function handleCancelEditForm() {
    setEditingFormId(null);
    setFormName("");
    setFormCategory(CHEER_CATEGORIES[0]);
    setDraftActivities([]);
  }

  function handleDeleteFormTemplate(formId: string) {
    if (state.forms.length <= 1) return;
    const targetForm = state.forms.find((f) => f.id === formId);
    const updatedForms = state.forms.filter((f) => f.id !== formId);
    if (editingFormId === formId) {
      handleCancelEditForm();
    }
    logAndCommit(
      { ...state, forms: updatedForms },
      "ELIMINACION",
      "Formularios",
      `Formulario "${targetForm?.name ?? formId}" eliminado.`
    );
  }

  // --- EVALUACION ACTIONS ---
  function handleSelectEvalAthlete(appId: string) {
    const app = state.applications.find((a) => a.id === appId);
    if (!app) return;
    handleGoToEvaluation(app);
  }

  function handleSelectRegisteredAthleteForEval(ath: AthleteProfile) {
    setPromoteCategory(ath.category);
    const existingApp = state.applications.find(
      (a) => a.id === ath.applicationId || a.id === `APP-${ath.athleteId}`
    );
    if (existingApp) {
      handleGoToEvaluation(existingApp);
      return;
    }

    const fallbackAppId = ath.applicationId || `APP-${ath.athleteId}`;
    const createdApp: RegistrationApplication = {
      id: fallbackAppId,
      trackingCode: ath.athleteId,
      createdAt: ath.clubJoinDate || new Date().toISOString(),
      birthDate: ath.birthDate,
      age: ath.age,
      isMinor: ath.isMinor,
      isUnderNine: ath.age < 9,
      fullName: ath.fullName,
      documentId: ath.documentId,
      phone: ath.phone,
      email: ath.email,
      notes: "",
      repName: ath.repName,
      repPhone: ath.repPhone,
      status: "formalizado",
    };

    commitState({
      ...state,
      applications: [createdApp, ...state.applications],
      athletes: state.athletes.map((a) =>
        a.athleteId === ath.athleteId && !a.applicationId
          ? { ...a, applicationId: fallbackAppId }
          : a
      ),
    });
    handleGoToEvaluation(createdApp);
  }

  function handlePromoteAthleteCategory() {
    if (!currentEvalApp) return;
    const targetAth = state.athletes.find(
      (a) =>
        a.applicationId === currentEvalApp.id ||
        `APP-${a.athleteId}` === currentEvalApp.id
    );
    if (!targetAth) return;

    logAndCommit(
      {
        ...state,
        athletes: state.athletes.map((a) =>
          a.athleteId === targetAth.athleteId
            ? { ...a, category: promoteCategory }
            : a
        ),
      },
      "MODIFICACION",
      "Evaluación y PDF",
      `Ascenso/cambio de grupo de ${targetAth.fullName} (${targetAth.athleteId}) a "${promoteCategory}".`
    );
    setEvalSavedMsg(
      t(
        `Grupo de ${targetAth.fullName} actualizado a "${promoteCategory}".`,
        `${targetAth.fullName}'s group updated to "${promoteCategory}".`
      )
    );
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

  function handleStartNewAdditionalEval() {
    const template =
      state.forms.find((f) => f.id === evalFormId) ?? state.forms[0];
    if (!template) return;
    setEvalFormId(template.id);
    setEvalItems(
      template.activities.map((act) => ({
        activityId: act.id,
        description: act.description,
        weight: act.weight,
        checked: false,
        score: 0,
      }))
    );
    setEvalNotes("");
    setEvalSavedMsg(
      t(
        "Lista de actividades reiniciada para nueva prueba / evaluación adicional.",
        "Activity checklist reset for a new additional test / evaluation."
      )
    );
  }

  function handleSaveEvaluation() {
    if (!selectedEvalAppId) return;
    const template = state.forms.find((f) => f.id === evalFormId);
    if (!template) return;

    const totalScore = evalItems.reduce((sum, i) => sum + i.score, 0);
    const maxScore = evalItems.reduce((sum, i) => sum + i.weight, 0);

    const newEval: AthleteEvaluation = {
      formId: template.id,
      formName: template.name,
      category: template.category,
      evaluatedAt: new Date().toISOString(),
      items: evalItems,
      totalScore,
      maxScore,
      coachNotes: evalNotes,
    };

    const updatedApps = state.applications.map((app) => {
      if (app.id !== selectedEvalAppId) return app;
      const prevHistory =
        app.evaluationHistory ?? (app.evaluation ? [app.evaluation] : []);
      return {
        ...app,
        status:
          app.status === "formalizado"
            ? ("formalizado" as const)
            : ("evaluado" as const),
        assignedFormId: template.id,
        evaluation: newEval,
        evaluationHistory: [newEval, ...prevHistory],
      };
    });

    const evalApp = state.applications.find((a) => a.id === selectedEvalAppId);
    logAndCommit(
      { ...state, applications: updatedApps },
      "EVALUACION",
      "Evaluación y PDF",
      `Evaluación guardada para ${evalApp?.fullName ?? selectedEvalAppId} (${totalScore}/${maxScore} pts · ${template.name}).`
    );
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

  const filteredRegisteredForEval = state.athletes.filter(
    (a) =>
      a.fullName.toLowerCase().includes(evalSearch.toLowerCase()) ||
      a.athleteId.toLowerCase().includes(evalSearch.toLowerCase())
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
    const targetPayment = state.payments.find((p) => p.id === paymentId);
    logAndCommit(
      { ...state, payments: updated },
      "MODIFICACION",
      "Contabilidad",
      `Pago ${paymentId} (${targetPayment?.athleteName ?? ""}) marcado como ${decision}.`
    );
  }

  function handleSaveMonthlyFee(e: FormEvent) {
    e.preventDefault();
    const val = Math.max(1, Number(feeInput) || 30);
    logAndCommit(
      { ...state, monthlyFee: val },
      "MODIFICACION",
      "Contabilidad",
      `Cuota mensual actualizada a $${val}.`
    );
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
    const targetReq = state.materialRequests.find((r) => r.id === requestId);
    logAndCommit(
      { ...state, materialRequests: updated },
      "MODIFICACION",
      "Solicitudes",
      `Solicitud de ${targetReq?.athleteName ?? requestId} (${targetReq?.itemType ?? ""}) actualizada a "${nextStatus}".`
    );
  }

  // --- EVENTOS (SOLO ENTRENADORES) ---
  function handleEvFlyerUpload(e: ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = () => {
      if (typeof reader.result === "string") {
        setEvFlyerDataUrl(reader.result);
      }
    };
    reader.readAsDataURL(file);
  }

  function toggleEvCategory(cat: string) {
    setEvTargetAll(false);
    setEvSelectedCategories((prev) =>
      prev.includes(cat) ? prev.filter((c) => c !== cat) : [...prev, cat]
    );
  }

  function handleAddEvent(e: FormEvent) {
    e.preventDefault();
    setEvSavedMsg(null);
    if (!evTitle.trim() || !evDate) return;

    const targetCategories =
      evTargetAll || evSelectedCategories.length === 0
        ? ["TODAS"]
        : evSelectedCategories;
    const reminderDays = Math.max(0, Number(evReminderDays) || 0);
    const eventId = createRecordId("ev");

    const newEv: SynergiaEvent = {
      id: eventId,
      date: evDate,
      title: evTitle.trim(),
      time: evTime.trim() || "Por definir",
      location: evLocation.trim() || "Sede Principal",
      description: evDescription.trim(),
      category: evCategory.trim() || "Evento",
      flyerDataUrl: evFlyerDataUrl || undefined,
      targetCategories,
      reminderDaysBefore: reminderDays,
    };

    const nextNotifications = evSendNotice
      ? [
          {
            id: createRecordId("evnotif"),
            eventId,
            eventTitle: newEv.title,
            eventDate: newEv.date,
            eventTime: newEv.time,
            eventLocation: newEv.location,
            reminderDaysBefore: reminderDays,
            targetCategories,
            message:
              newEv.description ||
              t(
                `Próximo evento el ${newEv.date} a las ${newEv.time} en ${newEv.location}.`,
                `Upcoming event on ${newEv.date} at ${newEv.time} in ${newEv.location}.`
              ),
            flyerDataUrl: newEv.flyerDataUrl,
            createdAt: new Date().toISOString(),
            readByAthleteIds: [],
          },
          ...state.eventNotifications,
        ]
      : state.eventNotifications;

    logAndCommit(
      {
        ...state,
        events: [newEv, ...state.events],
        eventNotifications: nextNotifications,
      },
      "CREACION",
      "Eventos",
      `Publicación de evento "${newEv.title}" (${newEv.date}).`
    );

    setEvTitle("");
    setEvDate("");
    setEvTime("");
    setEvDescription("");
    setEvFlyerDataUrl("");
    setEvSavedMsg(
      evSendNotice
        ? t(
            "Evento publicado y aviso enviado a los grupos seleccionados.",
            "Event published and notice sent to selected categories."
          )
        : t(
            "Evento publicado en el calendario público correctamente.",
            "Event published to the public calendar successfully."
          )
    );
  }

  function handleDeleteEvent(eventId: string) {
    const targetEv = state.events.find((ev) => ev.id === eventId);
    logAndCommit(
      {
        ...state,
        events: state.events.filter((ev) => ev.id !== eventId),
        eventNotifications: state.eventNotifications.filter(
          (n) => n.eventId !== eventId
        ),
      },
      "ELIMINACION",
      "Eventos",
      `Eliminación de evento "${targetEv?.title ?? eventId}".`
    );
  }

  function handleCreateSystemUser(e: FormEvent) {
    e.preventDefault();
    setSysUserError(null);
    setSysUserSuccess(null);

    const cleanUsername = newSysUsername.trim().toLowerCase();
    if (!newSysFullName.trim() || !cleanUsername || !newSysPassword.trim()) {
      setSysUserError(
        t("Completa todos los campos obligatorios.", "Complete all required fields.")
      );
      return;
    }

    const exists = state.systemUsers.some(
      (u) => u.username.toLowerCase() === cleanUsername
    );
    if (exists) {
      setSysUserError(
        t(
          `El usuario "${cleanUsername}" ya existe en el sistema.`,
          `Username "${cleanUsername}" already exists.`
        )
      );
      return;
    }

    const created: SystemUser = {
      username: cleanUsername,
      password: newSysPassword.trim(),
      role: newSysRole,
      fullName: newSysFullName.trim(),
      accessLevel: "admin",
    };

    logAndCommit(
      {
        ...state,
        systemUsers: [...state.systemUsers, created],
      },
      "CREACION",
      "Usuarios del Sistema",
      `Creación de usuario ${created.role}: "${created.username}" (${created.fullName}).`
    );

    setNewSysFullName("");
    setNewSysUsername("");
    setNewSysPassword("");
    setSysUserSuccess(
      t(
        `Usuario Administrador "${created.username}" (${created.role}) creado correctamente.`,
        `Administrator user "${created.username}" (${created.role}) created successfully.`
      )
    );
  }

  function handleDeleteSystemUser(targetUsername: string) {
    if (targetUsername.toLowerCase() === "admin") return;
    logAndCommit(
      {
        ...state,
        systemUsers: state.systemUsers.filter(
          (u) => u.username.toLowerCase() !== targetUsername.toLowerCase()
        ),
      },
      "ELIMINACION",
      "Usuarios del Sistema",
      `Eliminación de usuario administrador "${targetUsername}".`
    );
  }

  function handleStartEditAthleteUser(ath: AthleteProfile) {
    setSysUserError(null);
    setSysUserSuccess(null);
    setEditAthleteId(ath.athleteId);
    setEditAthUsername(ath.username);
    setEditAthPassword(ath.password);
    setEditAthCategory(ath.category);
    setEditAthPosition(ath.position);
  }

  function handleSaveEditAthleteUser(e: FormEvent) {
    e.preventDefault();
    if (!editAthleteId) return;
    setSysUserError(null);
    setSysUserSuccess(null);

    const cleanUser = editAthUsername.trim().toLowerCase();
    const cleanPass = editAthPassword.trim();

    if (!cleanUser || !cleanPass) {
      setSysUserError(
        t(
          "El usuario y la contraseña no pueden estar vacíos.",
          "Username and password cannot be empty."
        )
      );
      return;
    }

    const existsInSystem = state.systemUsers.some(
      (u) => u.username.toLowerCase() === cleanUser
    );
    const existsInOtherAthlete = state.athletes.some(
      (a) =>
        a.athleteId !== editAthleteId &&
        a.username.toLowerCase() === cleanUser
    );
    if (existsInSystem || existsInOtherAthlete) {
      setSysUserError(
        t(
          `El usuario "${cleanUser}" ya está en uso.`,
          `Username "${cleanUser}" is already in use.`
        )
      );
      return;
    }

    logAndCommit(
      {
        ...state,
        athletes: state.athletes.map((a) =>
          a.athleteId === editAthleteId
            ? {
                ...a,
                username: cleanUser,
                password: cleanPass,
                category: editAthCategory,
                position: editAthPosition,
              }
            : a
        ),
      },
      "MODIFICACION",
      "Usuarios del Sistema",
      `Modificación de atleta estándar (${editAthleteId}) · usuario "${cleanUser}", grupo "${editAthCategory}", posición "${editAthPosition}".`
    );
    setEditAthleteId(null);
    setSysUserSuccess(
      t(
        `Usuario estándar "${cleanUser}" actualizado correctamente.`,
        `Standard user "${cleanUser}" updated successfully.`
      )
    );
  }

  function handleRequestDeleteAthleteUser(ath: AthleteProfile) {
    setSysUserError(null);
    setSysUserSuccess(null);
    setDeleteConfirmAth(ath);
    setDeleteAuthPassword("");
    setDeleteAuthError(null);
  }

  function handleConfirmDeleteAthleteUser(e: FormEvent) {
    e.preventDefault();
    if (!deleteConfirmAth) return;

    const actorPassword =
      currentUser?.password ??
      state.systemUsers.find((u) => u.username.toLowerCase() === "admin")
        ?.password ??
      "admin";

    if (deleteAuthPassword.trim() !== actorPassword.trim()) {
      setDeleteAuthError(
        t(
          "Clave incorrecta. No se autorizó la eliminación del atleta.",
          "Incorrect password. Athlete deletion was not authorized."
        )
      );
      return;
    }

    const athleteId = deleteConfirmAth.athleteId;
    const athleteName = deleteConfirmAth.fullName;
    const targetAppId = deleteConfirmAth.applicationId || `APP-${athleteId}`;

    if (editAthleteId === athleteId) setEditAthleteId(null);
    if (selectedAthleteId === athleteId) setSelectedAthleteId("");
    if (selectedEvalAppId === targetAppId) setSelectedEvalAppId("");
    if (formalizeAppId === targetAppId) setFormalizeAppId("");

    logAndCommit(
      {
        ...state,
        athletes: state.athletes.filter((a) => a.athleteId !== athleteId),
        applications: state.applications.filter(
          (app) => app.id !== targetAppId && app.trackingCode !== athleteId
        ),
        payments: state.payments.filter((p) => p.athleteId !== athleteId),
        paymentNotifications: state.paymentNotifications.filter(
          (n) => n.athleteId !== athleteId
        ),
        materialRequests: state.materialRequests.filter(
          (r) => r.athleteId !== athleteId
        ),
        attendanceRecords: state.attendanceRecords.filter(
          (r) => r.athleteId !== athleteId
        ),
      },
      "ELIMINACION",
      "Usuarios del Sistema",
      `Eliminación total autorizada con clave del atleta ${athleteName} (${athleteId}) y todos sus registros.`
    );

    setDeleteConfirmAth(null);
    setDeleteAuthPassword("");
    setDeleteAuthError(null);
    setSysUserSuccess(
      t(
        `Usuario estándar ${athleteName} (${athleteId}) y toda su información fueron eliminados del sistema.`,
        `Standard user ${athleteName} (${athleteId}) and all associated data were deleted from the system.`
      )
    );
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
                {currentUser.username} · {currentUser.role} · {t("Usuario Administrador", "Admin User")}
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

      {/* Menú Principal estilo Mosaico Metro (o barra compacta cuando hay un módulo abierto) */}
      {activeTab === "menu" ? (
        <section className="space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="text-sm font-bold uppercase tracking-[0.18em] text-slate-300">
              {t("Módulos del Sistema", "System Modules")}
            </h2>
            <span className="text-xs text-slate-400">
              {t("Selecciona un mosaico para abrir", "Select a tile to open")}
            </span>
          </div>

          <div className="grid grid-cols-2 md:grid-cols-4 gap-3 sm:gap-4 auto-rows-[132px] sm:auto-rows-[148px]">
            {/* 1. INSCRIPCION (Wide Tile) */}
            <button
              type="button"
              onClick={() => setActiveTab("inscripcion")}
              className="col-span-2 group relative flex flex-col justify-between overflow-hidden rounded-xl border border-[#4CE4D4]/30 bg-gradient-to-br from-[#008C7E] to-[#005F56] p-4 sm:p-5 text-left shadow-lg transition-all duration-200 hover:scale-[1.015] hover:border-[#4CE4D4] cursor-pointer"
            >
              <div className="flex items-start justify-between">
                <svg className="h-9 w-9 text-white/95" fill="none" viewBox="0 0 24 24" strokeWidth={1.8} stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M18 7.5v3m0 0v3m0-3h3m-3 0h-3m-2.25-4.125a3.375 3.375 0 11-6.75 0 3.375 3.375 0 016.75 0zM3 19.235v-.11a6.375 6.375 0 0112.75 0v.109A12.318 12.318 0 019.374 21c-2.331 0-4.512-.645-6.374-1.766z" />
                </svg>
                <span className="rounded-lg bg-black/25 px-2.5 py-1 text-xs font-extrabold text-white">
                  {state.applications.length} {t("total", "total")}
                  {newApplicantsCount > 0 ? ` · ${newApplicantsCount} ${t("nuevo(s)", "new")}` : ""}
                </span>
              </div>
              <div>
                <p className="text-base sm:text-lg font-extrabold tracking-tight text-white">
                  {t("INSCRIPCION", "REGISTRATION")}
                </p>
                <p className="text-[11px] text-teal-100/85">
                  {t("Aspirantes, citas y formalización", "Applicants, appointments & onboarding")}
                </p>
              </div>
            </button>

            {/* 2. FORMULARIOS */}
            <button
              type="button"
              onClick={() => setActiveTab("formularios")}
              className="col-span-1 group relative flex flex-col justify-between overflow-hidden rounded-xl border border-[#B575CF]/35 bg-gradient-to-br from-[#6B2D83] to-[#4A1C5C] p-4 text-left shadow-lg transition-all duration-200 hover:scale-[1.02] hover:border-[#D49AEB] cursor-pointer"
            >
              <div className="flex items-start justify-between">
                <svg className="h-8 w-8 text-white/95" fill="none" viewBox="0 0 24 24" strokeWidth={1.8} stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M9 12h3.75M9 15h3.75M9 18h3.75m3 .75H18a2.25 2.25 0 002.25-2.25V6.108c0-1.135-.845-2.098-1.976-2.192a48.424 48.424 0 00-1.123-.08m-5.801 0c-.065.21-.1.433-.1.664 0 .414.336.75.75.75h4.5a.75.75 0 00.75-.75 2.25 2.25 0 00-.1-.664m-5.8 0A2.251 2.251 0 0113.5 2.25H15c1.012 0 1.867.668 2.15 1.586m-5.8 0c-.376.023-.75.05-1.124.08C9.095 4.01 8.25 4.973 8.25 6.108V8.25m0 0H4.875c-.621 0-1.125.504-1.125 1.125v11.25c0 .621.504 1.125 1.125 1.125h9.75c.621 0 1.125-.504 1.125-1.125V9.375c0-.621-.504-1.125-1.125-1.125H8.25z" />
                </svg>
                <span className="rounded-lg bg-black/25 px-2 py-0.5 text-xs font-extrabold text-white">
                  {state.forms.length}
                </span>
              </div>
              <div>
                <p className="text-sm sm:text-base font-extrabold text-white">
                  {t("Formularios", "Forms")}
                </p>
                <p className="text-[11px] text-purple-100/80 truncate">
                  {t("Criterios y ponderación", "Criteria & weights")}
                </p>
              </div>
            </button>

            {/* 3. EVALUACIÓN Y PDF */}
            <button
              type="button"
              onClick={() => setActiveTab("evaluacion")}
              className="col-span-1 group relative flex flex-col justify-between overflow-hidden rounded-xl border border-sky-400/35 bg-gradient-to-br from-sky-700 to-indigo-900 p-4 text-left shadow-lg transition-all duration-200 hover:scale-[1.02] hover:border-sky-300 cursor-pointer"
            >
              <div className="flex items-start justify-between">
                <svg className="h-8 w-8 text-white/95" fill="none" viewBox="0 0 24 24" strokeWidth={1.8} stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M19.5 14.25v-2.625a3.375 3.375 0 00-3.375-3.375h-1.5A1.125 1.125 0 0113.5 7.125v-1.5a3.375 3.375 0 00-3.375-3.375H8.25m0 12.75h7.5m-7.5 3H12M10.5 2.25H5.625c-.621 0-1.125.504-1.125 1.125v17.25c0 .621.504 1.125 1.125 1.125h12.75c.621 0 1.125-.504 1.125-1.125V11.25a9 9 0 00-9-9z" />
                </svg>
                <span className="rounded-lg bg-black/25 px-2 py-0.5 text-[10px] font-extrabold text-sky-100">
                  PDF
                </span>
              </div>
              <div>
                <p className="text-sm sm:text-base font-extrabold text-white">
                  {t("Evaluación y PDF", "Evaluation & PDF")}
                </p>
                <p className="text-[11px] text-sky-100/80 truncate">
                  {t("Calificar y exportar", "Score & export")}
                </p>
              </div>
            </button>

            {/* 4. CONTABILIDAD Y PAGOS (Wide Tile) */}
            <button
              type="button"
              onClick={() => setActiveTab("contabilidad")}
              className="col-span-2 group relative flex flex-col justify-between overflow-hidden rounded-xl border border-emerald-400/35 bg-gradient-to-br from-emerald-700 to-emerald-950 p-4 sm:p-5 text-left shadow-lg transition-all duration-200 hover:scale-[1.015] hover:border-emerald-300 cursor-pointer"
            >
              <div className="flex items-start justify-between">
                <svg className="h-9 w-9 text-white/95" fill="none" viewBox="0 0 24 24" strokeWidth={1.8} stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M12 6v12m-3-2.818l.879.659c1.171.879 3.07.879 4.242 0 1.172-.879 1.172-2.303 0-3.182C13.536 12.219 12.768 12 12 12c-.725 0-1.45-.22-2.003-.659-1.106-.879-1.106-2.303 0-3.182s2.9-.879 4.006 0l.415.33M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
                <div className="text-right">
                  <span className="block text-base sm:text-lg font-black text-white">
                    ${totalApprovedMonth.toFixed(2)}
                  </span>
                  {pendingPaymentsCount > 0 && (
                    <span className="inline-block rounded-md bg-amber-400/25 px-2 py-0.5 text-[10px] font-extrabold text-amber-200">
                      {pendingPaymentsCount} {t("por verificar", "to verify")}
                    </span>
                  )}
                </div>
              </div>
              <div>
                <p className="text-base sm:text-lg font-extrabold text-white">
                  {t("Contabilidad y Pagos", "Accounting & Payments")}
                </p>
                <p className="text-[11px] text-emerald-100/80">
                  {t("Verificar transferencias, pago móvil y efectivo", "Verify transfers, mobile pay & cash")}
                </p>
              </div>
            </button>

            {/* 5. PERFIL DEL ATLETA */}
            <button
              type="button"
              onClick={() => setActiveTab("perfil")}
              className="col-span-1 group relative flex flex-col justify-between overflow-hidden rounded-xl border border-violet-400/35 bg-gradient-to-br from-[#5B21B6] to-[#3B0764] p-4 text-left shadow-lg transition-all duration-200 hover:scale-[1.02] hover:border-violet-300 cursor-pointer"
            >
              <div className="flex items-start justify-between">
                <svg className="h-8 w-8 text-white/95" fill="none" viewBox="0 0 24 24" strokeWidth={1.8} stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M15 9h3.75M15 12h3.75M15 15h3.75M4.5 19.5h15a2.25 2.25 0 002.25-2.25V6.75A2.25 2.25 0 0019.5 4.5h-15a2.25 2.25 0 00-2.25 2.25v10.5A2.25 2.25 0 004.5 19.5zm6-10.125a1.875 1.875 0 11-3.75 0 1.875 1.875 0 013.75 0zm1.294 6.336a6.721 6.721 0 01-3.17.789 6.721 6.721 0 01-3.168-.789 3.376 3.376 0 016.338 0z" />
                </svg>
                <span className="rounded-lg bg-black/25 px-2 py-0.5 text-xs font-extrabold text-white">
                  {state.athletes.length}
                </span>
              </div>
              <div>
                <p className="text-sm sm:text-base font-extrabold text-white">
                  {t("Perfil del Atleta", "Athlete Profile")}
                </p>
                <p className="text-[11px] text-violet-100/80 truncate">
                  {t("Fichas y carnets", "Profiles & ID cards")}
                </p>
              </div>
            </button>

            {/* 6. MOROSOS Y AVISOS */}
            <button
              type="button"
              onClick={() => setActiveTab("morosos")}
              className="col-span-1 group relative flex flex-col justify-between overflow-hidden rounded-xl border border-rose-400/35 bg-gradient-to-br from-rose-700 to-rose-950 p-4 text-left shadow-lg transition-all duration-200 hover:scale-[1.02] hover:border-rose-300 cursor-pointer"
            >
              <div className="flex items-start justify-between">
                <svg className="h-8 w-8 text-white/95" fill="none" viewBox="0 0 24 24" strokeWidth={1.8} stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M14.857 17.082a23.848 23.848 0 005.454-1.31A8.967 8.967 0 0118 9.75v-.7V9A6 6 0 006 9v.75a8.967 8.967 0 01-2.312 6.022c1.733.64 3.56 1.085 5.455 1.31m5.714 0a24.255 24.255 0 01-5.714 0m5.714 0a3 3 0 11-5.714 0" />
                </svg>
                <span className="rounded-lg bg-black/25 px-2 py-0.5 text-xs font-extrabold text-white">
                  {defaultersList.length}
                </span>
              </div>
              <div>
                <p className="text-sm sm:text-base font-extrabold text-white">
                  {t("Morosos y Avisos", "Overdue & Notices")}
                </p>
                <p className="text-[11px] text-rose-100/80 truncate">
                  {t("Cobro hasta el 15", "Due by the 15th")}
                </p>
              </div>
            </button>

            {/* 7. SOLICITUDES DE ATLETAS (Wide Tile) */}
            <button
              type="button"
              onClick={() => setActiveTab("solicitudes")}
              className="col-span-2 group relative flex flex-col justify-between overflow-hidden rounded-xl border border-amber-400/35 bg-gradient-to-r from-[#7E3D97]/90 via-[#381B4C] to-[#0F4C5C] p-4 sm:p-5 text-left shadow-lg transition-all duration-200 hover:scale-[1.015] hover:border-amber-300 cursor-pointer"
            >
              <div className="flex items-start justify-between">
                <svg className="h-9 w-9 text-white/95" fill="none" viewBox="0 0 24 24" strokeWidth={1.8} stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M20.25 7.5l-.625 10.632a2.25 2.25 0 01-2.247 2.118H6.622a2.25 2.25 0 01-2.247-2.118L3.75 7.5M10 11.25h4M3.375 7.5h17.25c.621 0 1.125-.504 1.125-1.125v-1.5c0-.621-.504-1.125-1.125-1.125H3.375c-.621 0-1.125.504-1.125 1.125v1.5c0 .621.504 1.125 1.125 1.125z" />
                </svg>
                <span className="rounded-lg bg-black/30 px-3 py-1 text-xs font-extrabold text-amber-200">
                  {pendingRequestsCount} {t("pendiente(s)", "pending")} · {state.materialRequests.length} {t("total", "total")}
                </span>
              </div>
              <div>
                <p className="text-base sm:text-lg font-extrabold text-white">
                  {t("Solicitudes de Atletas", "Athlete Material Requests")}
                </p>
                <p className="text-[11px] text-slate-200/85">
                  {t("Uniformes, zapatos, lazos y materiales de entrenamiento", "Uniforms, shoes, bows & training materials")}
                </p>
              </div>
            </button>

            {/* 8. EVENTOS DEL CALENDARIO PÚBLICO (Wide Tile) */}
            <button
              type="button"
              onClick={() => setActiveTab("eventos")}
              className="col-span-2 group relative flex flex-col justify-between overflow-hidden rounded-xl border border-[#4CE4D4]/35 bg-gradient-to-r from-[#0F4C5C] via-[#0D3B4C] to-[#7E3D97]/85 p-4 sm:p-5 text-left shadow-lg transition-all duration-200 hover:scale-[1.015] hover:border-[#4CE4D4] cursor-pointer"
            >
              <div className="flex items-start justify-between">
                <svg className="h-9 w-9 text-white/95" fill="none" viewBox="0 0 24 24" strokeWidth={1.8} stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M6.75 3v2.25M17.25 3v2.25M3 18.75V7.5a2.25 2.25 0 012.25-2.25h13.5A2.25 2.25 0 0121 7.5v11.25m-18 0A2.25 2.25 0 005.25 21h13.5A2.25 2.25 0 0021 18.75m-18 0v-7.5A2.25 2.25 0 015.25 9h13.5A2.25 2.25 0 0121 11.25v7.5" />
                </svg>
                <span className="rounded-lg bg-black/30 px-3 py-1 text-xs font-extrabold text-[#4CE4D4]">
                  {state.events.length} {t("publicado(s)", "published")}
                </span>
              </div>
              <div>
                <p className="text-base sm:text-lg font-extrabold text-white">
                  {t("Configurar Eventos", "Manage Events")}
                </p>
                <p className="text-[11px] text-slate-200/85">
                  {t("Calendario público, día, hora, descripción y flyers", "Public calendar, date, time, description & flyers")}
                </p>
              </div>
            </button>
            {/* 9. CONTROL DE ASISTENCIA QR / CARNET (Wide Tile) */}
            <button
              type="button"
              onClick={() => setActiveTab("asistencia")}
              className="col-span-2 group relative flex flex-col justify-between overflow-hidden rounded-xl border border-emerald-400/40 bg-gradient-to-r from-[#065F46] via-[#0F766E] to-[#4A1C5C] p-4 sm:p-5 text-left shadow-lg transition-all duration-200 hover:scale-[1.015] hover:border-[#4CE4D4] cursor-pointer"
            >
              <div className="flex items-start justify-between">
                <svg className="h-9 w-9 text-white/95" fill="none" viewBox="0 0 24 24" strokeWidth={1.8} stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M3.75 4.875c0-.621.504-1.125 1.125-1.125h4.5c.621 0 1.125.504 1.125 1.125v4.5c0 .621-.504 1.125-1.125 1.125h-4.5A1.125 1.125 0 013.75 9.375v-4.5zM3.75 14.625c0-.621.504-1.125 1.125-1.125h4.5c.621 0 1.125.504 1.125 1.125v4.5c0 .621-.504 1.125-1.125 1.125h-4.5a1.125 1.125 0 01-1.125-1.125v-4.5zM13.5 4.875c0-.621.504-1.125 1.125-1.125h4.5c.621 0 1.125.504 1.125 1.125v4.5c0 .621-.504 1.125-1.125 1.125h-4.5A1.125 1.125 0 0113.5 9.375v-4.5z" />
                  <path strokeLinecap="round" strokeLinejoin="round" d="M6.75 6.75h.75v.75h-.75v-.75zM6.75 16.5h.75v.75h-.75v-.75zM16.5 6.75h.75v.75h-.75v-.75zM13.5 13.5h.75v.75h-.75v-.75zM13.5 19.5h.75v.75h-.75v-.75zM19.5 13.5h.75v.75h-.75v-.75zM19.5 19.5h.75v.75h-.75v-.75zM16.5 16.5h.75v.75h-.75v-.75z" />
                </svg>
                <span className="rounded-lg bg-black/30 px-3 py-1 text-xs font-extrabold text-emerald-200">
                  {state.attendanceRecords.length} {t("registrada(s)", "recorded")}
                </span>
              </div>
              <div>
                <p className="text-base sm:text-lg font-extrabold text-white">
                  {t("Control de Asistencia (QR y Carnet)", "Attendance Control (QR & ID Card)")}
                </p>
                <p className="text-[11px] text-slate-200/85">
                  {t("Escanear QR con cámara · Rechazo automático a morosos y suspendidos", "Scan QR with camera · Auto-reject overdue & suspended athletes")}
                </p>
              </div>
            </button>

            {/* 10. ESTADÍSTICAS Y MÉTRICAS DE LA PÁGINA (Wide Tile) */}
            <button
              type="button"
              onClick={() => setActiveTab("metricas")}
              className="col-span-2 group relative flex flex-col justify-between overflow-hidden rounded-xl border border-indigo-400/40 bg-gradient-to-r from-indigo-800 via-[#381B4C] to-[#0D3B4C] p-4 sm:p-5 text-left shadow-lg transition-all duration-200 hover:scale-[1.015] hover:border-indigo-300 cursor-pointer"
            >
              <div className="flex items-start justify-between">
                <svg className="h-9 w-9 text-white/95" fill="none" viewBox="0 0 24 24" strokeWidth={1.8} stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M3 13.125C3 12.504 3.504 12 4.125 12h2.25c.621 0 1.125.504 1.125 1.125v6.75C7.5 20.496 6.996 21 6.375 21h-2.25A1.125 1.125 0 013 19.875v-6.75zM9.75 8.625c0-.621.504-1.125 1.125-1.125h2.25c.621 0 1.125.504 1.125 1.125v11.25c0 .621-.504 1.125-1.125 1.125h-2.25a1.125 1.125 0 01-1.125-1.125V8.625zM16.5 4.125c0-.621.504-1.125 1.125-1.125h2.25C20.496 3 21 3.504 21 4.125v15.75c0 .621-.504 1.125-1.125 1.125h-2.25a1.125 1.125 0 01-1.125-1.125V4.125z" />
                </svg>
                <span className="rounded-lg bg-black/30 px-3 py-1 text-xs font-extrabold text-indigo-200">
                  {analytics.totalVisits} {t("visita(s)", "visits")}
                </span>
              </div>
              <div>
                <p className="text-base sm:text-lg font-extrabold text-white">
                  {t("Estadísticas y Métricas Web", "Web Analytics & Metrics")}
                </p>
                <p className="text-[11px] text-slate-200/85">
                  {t("Visitas totales, duración promedio, contenido más visto y países", "Total visits, avg duration, top content & countries")}
                </p>
              </div>
            </button>

            {/* 11. GESTIÓN DE USUARIOS ADMINISTRADORES Y ENTRENADORES */}
            <button
              type="button"
              onClick={() => setActiveTab("usuarios")}
              className="col-span-2 md:col-span-4 group relative flex flex-col justify-between overflow-hidden rounded-xl border border-amber-400/40 bg-gradient-to-r from-[#381B4C] via-[#0B1528] to-[#065F46] p-4 sm:p-5 text-left shadow-lg transition-all duration-200 hover:scale-[1.01] hover:border-amber-300 cursor-pointer"
            >
              <div className="flex items-start justify-between">
                <svg className="h-9 w-9 text-white/95" fill="none" viewBox="0 0 24 24" strokeWidth={1.8} stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M15 19.128a9.38 9.38 0 002.625.372 9.337 9.337 0 004.121-.952 4.125 4.125 0 00-7.533-2.493M15 19.128v-.003c0-1.113-.285-2.16-.786-3.07M15 19.128v.106A12.318 12.318 0 018.624 21c-2.331 0-4.512-.645-6.374-1.766l-.001-.109a6.375 6.375 0 0111.964-3.07M12 6.375a3.375 3.375 0 11-6.75 0 3.375 3.375 0 016.75 0zm8.25 2.25a2.625 2.625 0 11-5.25 0 2.625 2.625 0 015.25 0z" />
                </svg>
                <span className="rounded-lg bg-black/30 px-3 py-1 text-xs font-extrabold text-amber-200">
                  {state.systemUsers.length} {t("Admin / Entrenadores", "Admins / Coaches")} · {state.athletes.length} {t("Estándar", "Standard")}
                </span>
              </div>
              <div>
                <p className="text-base sm:text-lg font-extrabold text-white">
                  {t("Usuarios Administradores y Entrenadores", "Administrator & Coach Users")}
                </p>
                <p className="text-[11px] text-slate-200/85">
                  {t("Crear cuentas con acceso total a configuración, contabilidad y eventos", "Create accounts with full access to settings, accounting & events")}
                </p>
              </div>
            </button>

            {/* 12. AUDITORÍA Y LOGS DEL SISTEMA */}
            <button
              type="button"
              onClick={() => setActiveTab("auditoria")}
              className="col-span-2 md:col-span-4 group relative flex flex-col justify-between overflow-hidden rounded-xl border border-cyan-400/35 bg-gradient-to-r from-[#0B172A] via-[#131B2E] to-[#1E1B4B] p-4 sm:p-5 text-left shadow-lg transition-all duration-200 hover:scale-[1.01] hover:border-cyan-300 cursor-pointer"
            >
              <div className="flex items-start justify-between">
                <svg className="h-9 w-9 text-cyan-300" fill="none" viewBox="0 0 24 24" strokeWidth={1.8} stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M9 12h3.75M9 15h3.75M9 18h3.75m3 .75H18a2.25 2.25 0 002.25-2.25V6.108c0-1.135-.845-2.098-1.976-2.192a48.424 48.424 0 00-1.123-.08m-5.801 0c-.065.21-.1.433-.1.664 0 .414.336.75.75.75h4.5a.75.75 0 00.75-.75 2.25 2.25 0 00-.1-.664m-5.8 0A2.251 2.251 0 0113.5 2.25H15c1.012 0 1.867.668 2.15 1.586m-5.8 0c-.376.023-.75.05-1.124.08C9.095 4.01 8.25 4.973 8.25 6.108V8.25m0 0H4.875c-.621 0-1.125.504-1.125 1.125v11.25c0 .621.504 1.125 1.125 1.125h9.75c.621 0 1.125-.504 1.125-1.125V9.375c0-.621-.504-1.125-1.125-1.125H8.25z" />
                </svg>
                <span className="rounded-lg bg-black/30 px-3 py-1 text-xs font-extrabold text-cyan-200">
                  {(state.auditLogs ?? []).length} {t("Registros", "Records")}
                </span>
              </div>
              <div>
                <p className="text-base sm:text-lg font-extrabold text-white">
                  {t("Auditoría y Logs del Sistema", "System Audit & Logs")}
                </p>
                <p className="text-[11px] text-slate-200/85">
                  {t(
                    "Historial con fecha y hora de ingresos, modificaciones y eliminaciones por usuario",
                    "Date & time history of logins, modifications and deletions by user"
                  )}
                </p>
              </div>
            </button>
          </div>
        </section>
      ) : (
        <div
          className={`gap-2 border-b border-white/10 pb-3 ${
            isMobile ? "grid grid-cols-2" : "flex flex-wrap items-center"
          }`}
        >
          <button
            type="button"
            onClick={() => setActiveTab("menu")}
            className="inline-flex items-center justify-center gap-1.5 rounded-xl border border-[#9D5BB8]/60 bg-[#7E3D97]/30 px-3 sm:px-4 py-2.5 text-xs sm:text-sm font-bold text-purple-100 hover:bg-[#7E3D97]/50 transition-all cursor-pointer"
          >
            ← {t("Menú", "Menu")}
          </button>
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
              {
                key: "eventos",
                label: t("Eventos", "Events"),
                badge: state.events.length,
              },
              {
                key: "asistencia",
                label: t("Asistencia QR", "QR Attendance"),
                badge: state.attendanceRecords.length,
              },
              {
                key: "metricas",
                label: t("Métricas", "Analytics"),
                badge: analytics.totalVisits,
              },
              {
                key: "usuarios",
                label: t("Usuarios Admin", "Admin Users"),
                badge: state.systemUsers.length,
              },
              {
                key: "auditoria",
                label: t("Auditoría / Logs", "Audit Logs"),
                badge: (state.auditLogs ?? []).length,
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
      )}

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

          {lastCitaWa && (
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 rounded-2xl border border-emerald-400/45 bg-emerald-500/15 p-4 text-xs text-emerald-100">
              <div className="space-y-1">
                <p className="text-sm font-extrabold text-emerald-300">
                  {t(
                    `Cita asignada · Aviso WhatsApp listo para ${lastCitaWa.athleteName}`,
                    `Appointment scheduled · WhatsApp notice ready for ${lastCitaWa.athleteName}`
                  )}
                </p>
                <p className="text-slate-200">
                  {t("Teléfono registrado en INSCRIBETE:", "Phone from registration:")}{" "}
                  <strong className="font-mono">{lastCitaWa.phoneDisplay}</strong>
                </p>
              </div>
              <div className="flex flex-wrap items-center gap-2">
                <a
                  href={lastCitaWa.waUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="rounded-xl bg-emerald-500 px-4 py-2 text-xs font-extrabold text-slate-950 hover:bg-emerald-400 transition-colors"
                >
                  📲 {t("Enviar Cita por WhatsApp", "Send Appointment via WhatsApp")}
                </a>
                <button
                  type="button"
                  onClick={() => {
                    navigator.clipboard?.writeText(lastCitaWa.message);
                  }}
                  className="rounded-xl border border-white/20 bg-white/5 px-3 py-2 text-xs font-semibold text-white hover:bg-white/10 cursor-pointer"
                >
                  {t("Copiar Mensaje", "Copy Message")}
                </button>
                <button
                  type="button"
                  onClick={() => setLastCitaWa(null)}
                  className="rounded-xl px-2.5 py-2 text-xs text-slate-300 hover:text-white cursor-pointer"
                >
                  ✕
                </button>
              </div>
            </div>
          )}

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
                {editingFormId
                  ? t("Editar Formulario de Evaluación", "Edit Evaluation Form")
                  : t("Crear Formulario de Evaluación", "Create Evaluation Form")}
              </h2>
              <p className="text-xs text-slate-400 mt-1">
                Agrega actividades con su descripción y ponderación, y clasifica
                el formulario por grupo.
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
                Clasificar por Grupo *
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

            <div className="flex flex-wrap gap-2">
              {editingFormId && (
                <button
                  type="button"
                  onClick={handleCancelEditForm}
                  className="rounded-xl border border-white/15 px-4 py-3 text-sm font-semibold text-slate-300 hover:bg-white/5 cursor-pointer"
                >
                  {t("Cancelar Edición", "Cancel Edit")}
                </button>
              )}
              <button
                type="submit"
                disabled={draftActivities.length === 0}
                className="flex-1 rounded-xl bg-emerald-500 py-3 text-sm font-bold text-slate-950 hover:bg-emerald-400 disabled:opacity-40 cursor-pointer"
              >
                {editingFormId
                  ? t("Actualizar Formulario", "Update Form")
                  : t("Guardar Formulario", "Save Form")}
              </button>
            </div>
          </form>

          {/* Lista de formularios guardados / predeterminados */}
          <div className="space-y-4">
            <h2 className="text-xl font-bold text-white">
              Formularios Disponibles
            </h2>
            {state.forms.map((form) => (
              <div
                key={form.id}
                className={`rounded-2xl border p-5 space-y-3 ${
                  editingFormId === form.id
                    ? "border-emerald-400/60 bg-emerald-500/5"
                    : "border-white/10 bg-[#0D1322]"
                }`}
              >
                <div className="flex flex-wrap items-start justify-between gap-2">
                  <div>
                    <h3 className="font-bold text-white">{form.name}</h3>
                    <p className="text-xs text-amber-300">{form.category}</p>
                  </div>
                  <div className="flex items-center gap-2">
                    {form.isDefault && (
                      <span className="rounded-full bg-white/10 px-2.5 py-0.5 text-[10px] font-semibold text-slate-300">
                        Predeterminado
                      </span>
                    )}
                    <button
                      type="button"
                      onClick={() => handleStartEditForm(form)}
                      className="rounded-lg border border-sky-400/40 bg-sky-500/15 px-2.5 py-1 text-[11px] font-bold text-sky-200 hover:bg-sky-500/25 cursor-pointer"
                    >
                      {t("Editar", "Edit")}
                    </button>
                    {state.forms.length > 1 && (
                      <button
                        type="button"
                        onClick={() => handleDeleteFormTemplate(form.id)}
                        className="rounded-lg border border-rose-500/40 bg-rose-500/10 px-2.5 py-1 text-[11px] font-bold text-rose-300 hover:bg-rose-500/20 cursor-pointer"
                      >
                        {t("Eliminar", "Delete")}
                      </button>
                    )}
                  </div>
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
            <div className="space-y-4 max-h-[480px] overflow-y-auto pr-1">
              <div className="space-y-2">
                <p className="text-[11px] font-bold uppercase tracking-wider text-emerald-400">
                  {t("Aspirantes por Evaluar", "Pending Applicants")}
                </p>
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

              <div className="border-t border-white/10 pt-3 space-y-2">
                <p className="text-[11px] font-bold uppercase tracking-wider text-purple-300">
                  {t(
                    "Atletas Registrados (Re-evaluación / Ascenso)",
                    "Registered Athletes (Re-evaluation / Promotion)"
                  )}
                </p>
                {filteredRegisteredForEval.length === 0 ? (
                  <p className="text-xs text-slate-400">
                    {t(
                      "No hay atletas registrados que coincidan.",
                      "No matching registered athletes."
                    )}
                  </p>
                ) : (
                  filteredRegisteredForEval.map((ath) => {
                    const isSelected =
                      selectedEvalAppId === ath.applicationId ||
                      selectedEvalAppId === `APP-${ath.athleteId}`;
                    return (
                      <button
                        key={ath.athleteId}
                        type="button"
                        onClick={() => handleSelectRegisteredAthleteForEval(ath)}
                        className={`w-full text-left rounded-xl border p-3 transition-all cursor-pointer ${
                          isSelected
                            ? "border-purple-400 bg-purple-500/15"
                            : "border-white/10 bg-[#070B14]/60 hover:border-purple-400/40"
                        }`}
                      >
                        <div className="flex items-center justify-between gap-2">
                          <p className="text-sm font-bold text-white truncate">
                            {ath.fullName}
                          </p>
                          <span className="shrink-0 rounded-full bg-purple-500/20 px-2 py-0.5 text-[10px] font-bold text-purple-200">
                            {ath.athleteId}
                          </span>
                        </div>
                        <p className="text-[11px] text-slate-400 truncate mt-0.5">
                          {ath.category} · {ath.age} años
                        </p>
                      </button>
                    );
                  })
                )}
              </div>
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
                    {currentEvalApp.status === "formalizado" && (
                      <span className="mt-1 inline-block rounded-full bg-purple-500/20 border border-purple-400/35 px-2.5 py-0.5 text-[10px] font-bold text-purple-200">
                        {t(
                          "Atleta Registrado · Re-evaluación de Grupo / Nivel",
                          "Registered Athlete · Group / Level Re-evaluation"
                        )}
                      </span>
                    )}
                  </div>

                  <div className="flex flex-wrap items-center gap-2">
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
                    <button
                      type="button"
                      onClick={handleStartNewAdditionalEval}
                      className="rounded-xl border border-cyan-400/40 bg-cyan-500/15 px-3 py-2 text-xs font-bold text-cyan-200 hover:bg-cyan-500/25 cursor-pointer"
                    >
                      + {t("Nueva Prueba", "New Test")}
                    </button>
                  </div>
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
                        {currentEvalApp.status !== "formalizado" && (
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
                        )}
                      </>
                    )}
                  </div>
                </div>

                {currentEvalApp.status === "formalizado" && (
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 rounded-xl border border-purple-500/30 bg-purple-500/10 p-3.5">
                    <div className="space-y-1 flex-1">
                      <p className="text-xs font-bold text-purple-200">
                        {t(
                          "Ascenso / Cambio de Grupo o Nivel",
                          "Group / Level Promotion"
                        )}
                      </p>
                      <select
                        value={promoteCategory}
                        onChange={(e) => setPromoteCategory(e.target.value)}
                        className="w-full rounded-lg border border-white/15 bg-[#070B14] px-3 py-2 text-xs text-white focus:border-purple-400 focus:outline-none"
                      >
                        {CHEER_CATEGORIES.map((c) => (
                          <option key={c} value={c}>
                            {c}
                          </option>
                        ))}
                      </select>
                    </div>
                    <button
                      type="button"
                      onClick={handlePromoteAthleteCategory}
                      className="shrink-0 rounded-xl bg-purple-500 px-4 py-2.5 text-xs font-bold text-white hover:bg-purple-400 cursor-pointer"
                    >
                      {t("Actualizar Grupo", "Update Group")}
                    </button>
                  </div>
                )}

                {(() => {
                  const evalList =
                    currentEvalApp.evaluationHistory &&
                    currentEvalApp.evaluationHistory.length > 0
                      ? currentEvalApp.evaluationHistory
                      : currentEvalApp.evaluation
                      ? [currentEvalApp.evaluation]
                      : [];
                  if (evalList.length === 0) return null;
                  return (
                    <div className="rounded-xl border border-white/10 bg-[#070B14]/70 p-4 space-y-2.5">
                      <p className="text-xs font-bold uppercase tracking-wider text-slate-300">
                        {t(
                          `Historial de Pruebas y Evaluaciones (${evalList.length})`,
                          `Evaluation & Test History (${evalList.length})`
                        )}
                      </p>
                      <div className="space-y-2 max-h-56 overflow-y-auto pr-1">
                        {evalList.map((pastEval, idx) => (
                          <div
                            key={`${pastEval.evaluatedAt}-${idx}`}
                            className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 rounded-lg border border-white/10 bg-[#0D1322] p-3 text-xs"
                          >
                            <div className="min-w-0">
                              <p className="font-bold text-white truncate">
                                {pastEval.formName}{" "}
                                <span className="font-mono text-emerald-300">
                                  ({pastEval.totalScore}/{pastEval.maxScore} pts)
                                </span>
                              </p>
                              <p className="text-[11px] text-slate-400">
                                {new Date(pastEval.evaluatedAt).toLocaleString("es-VE")} ·{" "}
                                {pastEval.category}
                              </p>
                              {pastEval.coachNotes && (
                                <p className="text-[11px] text-slate-300 italic mt-0.5 truncate">
                                  &ldquo;{pastEval.coachNotes}&rdquo;
                                </p>
                              )}
                            </div>
                            <button
                              type="button"
                              onClick={() =>
                                generateEvaluationPdf({
                                  ...currentEvalApp,
                                  evaluation: pastEval,
                                })
                              }
                              className="shrink-0 rounded-lg border border-amber-400/40 bg-amber-400/15 px-3 py-1.5 text-[11px] font-bold text-amber-200 hover:bg-amber-400/25 cursor-pointer"
                            >
                              {t("Generar PDF", "Generate PDF")}
                            </button>
                          </div>
                        ))}
                      </div>
                    </div>
                  );
                })()}

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

      {/* TAB 4: PERFIL DEL ATLETA Y REPORTES POR GRUPO */}
      {activeTab === "perfil" && (() => {
        const filteredAthletes =
          athleteCategoryFilter === "TODAS"
            ? state.athletes
            : state.athletes.filter(
                (a) => a.category === athleteCategoryFilter
              );
        const categoryLabel =
          athleteCategoryFilter === "TODAS"
            ? t("Todos los grupos", "All groups")
            : athleteCategoryFilter;

        return (
        <div className="space-y-6">
          {lastFormalizedWa && (
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 rounded-2xl border border-emerald-400/45 bg-emerald-500/15 p-4 text-xs text-emerald-100">
              <div className="space-y-1">
                <p className="text-sm font-extrabold text-emerald-300">
                  {t(
                    `Inscripción formalizada · Aviso WhatsApp listo para ${lastFormalizedWa.athleteName}`,
                    `Registration formalized · WhatsApp notice ready for ${lastFormalizedWa.athleteName}`
                  )}
                </p>
                <p className="text-slate-200">
                  {t("Teléfono registrado en INSCRIBETE:", "Phone from registration:")}{" "}
                  <strong className="font-mono">{lastFormalizedWa.phoneDisplay}</strong>
                </p>
              </div>
              <div className="flex flex-wrap gap-2 shrink-0">
                <a
                  href={lastFormalizedWa.waUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="rounded-xl bg-emerald-500 px-4 py-2 text-xs font-bold text-slate-950 hover:bg-emerald-400"
                >
                  {t("Enviar por WhatsApp", "Send via WhatsApp")}
                </a>
                <button
                  type="button"
                  onClick={() => {
                    navigator.clipboard?.writeText(lastFormalizedWa.message);
                  }}
                  className="rounded-xl border border-white/20 px-3 py-2 text-xs font-semibold text-white hover:bg-white/10 cursor-pointer"
                >
                  {t("Copiar Mensaje", "Copy Message")}
                </button>
                <button
                  type="button"
                  onClick={() => setLastFormalizedWa(null)}
                  className="rounded-xl border border-white/10 px-2.5 py-2 text-xs text-slate-300 hover:text-white cursor-pointer"
                >
                  ✕
                </button>
              </div>
            </div>
          )}

          {/* Barra de Reportes y Filtro por Categoría */}
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 rounded-2xl border border-white/10 bg-[#0D1322] p-5">
            <div>
              <h2 className="text-lg font-bold text-white">
                {t("Listado y Reportes de Atletas en la Academia", "Academy Athletes List & Reports")}
              </h2>
              <p className="text-xs text-slate-400 mt-1">
                {t("Total registrados:", "Total registered:")}{" "}
                <strong className="text-emerald-300">{state.athletes.length}</strong>{" "}
                · {t("Mostrando en filtro:", "Showing in filter:")}{" "}
                <strong className="text-amber-300">{filteredAthletes.length}</strong>
              </p>
            </div>

            <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2.5">
              <select
                aria-label={t("Filtrar por grupo", "Filter by group")}
                value={athleteCategoryFilter}
                onChange={(e) => setAthleteCategoryFilter(e.target.value)}
                className="rounded-xl border border-white/15 bg-[#070B14] px-3.5 py-2.5 text-xs font-semibold text-white focus:border-[#00B7A4] focus:outline-none"
              >
                <option value="TODAS">
                  {t("Todos los grupos", "All groups")} ({state.athletes.length})
                </option>
                {CHEER_CATEGORIES.map((cat) => {
                  const cnt = state.athletes.filter(
                    (a) => a.category === cat
                  ).length;
                  return (
                    <option key={cat} value={cat}>
                      {cat} ({cnt})
                    </option>
                  );
                })}
              </select>

              <button
                type="button"
                disabled={filteredAthletes.length === 0}
                onClick={() =>
                  generateAthletesListPdf(filteredAthletes, categoryLabel)
                }
                className="rounded-xl bg-[#00B7A4] px-4 py-2.5 text-xs font-bold text-slate-950 hover:bg-[#14CEBA] disabled:opacity-40 cursor-pointer shrink-0"
              >
                {t(
                  "Descargar Listado PDF (Membretado)",
                  "Download Athletes List PDF"
                )}
              </button>
            </div>
          </div>

          <div className="grid gap-6 lg:grid-cols-3">
            <div className="rounded-2xl border border-white/10 bg-[#0D1322] p-5 space-y-3">
              <h2 className="text-lg font-bold text-white">
                {t("Atletas", "Athletes")} ({filteredAthletes.length})
              </h2>
              {filteredAthletes.length === 0 ? (
                <p className="text-xs text-slate-400">
                  {state.athletes.length === 0
                    ? t(
                        "Aún no hay atletas formalizados. Formaliza un aspirante desde el módulo INSCRIPCION o Evaluación.",
                        "No formalized athletes yet."
                      )
                    : t(
                        "No hay atletas en este grupo.",
                        "No athletes in this category."
                      )}
                </p>
              ) : (
                <div className="space-y-2 max-h-[540px] overflow-y-auto pr-1">
                  {filteredAthletes.map((ath) => (
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
                        {ath.category}
                      </p>
                      <p className="text-[11px] text-slate-400">
                        Usuario: <strong>{ath.username}</strong> ·{" "}
                        {ath.profileCompleted ? "Ficha Completa" : "Ficha Pendiente"}
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
                      <div className="flex flex-wrap items-center gap-2">
                        <span className="rounded-xl border border-amber-400/30 bg-amber-400/10 px-3 py-1.5 font-mono text-xs font-bold text-amber-300">
                          ID: {selectedAthlete.athleteId}
                        </span>
                        <button
                          type="button"
                          onClick={() =>
                            generateAthleteProfilePdf(selectedAthlete)
                          }
                          className="rounded-xl border border-[#4CE4D4]/40 bg-[#00B7A4]/15 px-3 py-1.5 text-xs font-bold text-[#4CE4D4] hover:bg-[#00B7A4]/25 cursor-pointer"
                        >
                          {t("Perfil del Atleta", "Athlete Profile PDF")}
                        </button>
                      </div>
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
                          Estado de ficha oficial:
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
        );
      })()}

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
            {/* 9. CONTROL DE ASISTENCIA QR / CARNET (Wide Tile) */}
            <button
              type="button"
              onClick={() => setActiveTab("asistencia")}
              className="col-span-2 group relative flex flex-col justify-between overflow-hidden rounded-xl border border-emerald-400/40 bg-gradient-to-r from-[#065F46] via-[#0F766E] to-[#4A1C5C] p-4 sm:p-5 text-left shadow-lg transition-all duration-200 hover:scale-[1.015] hover:border-[#4CE4D4] cursor-pointer"
            >
              <div className="flex items-start justify-between">
                <svg className="h-9 w-9 text-white/95" fill="none" viewBox="0 0 24 24" strokeWidth={1.8} stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M3.75 4.875c0-.621.504-1.125 1.125-1.125h4.5c.621 0 1.125.504 1.125 1.125v4.5c0 .621-.504 1.125-1.125 1.125h-4.5A1.125 1.125 0 013.75 9.375v-4.5zM3.75 14.625c0-.621.504-1.125 1.125-1.125h4.5c.621 0 1.125.504 1.125 1.125v4.5c0 .621-.504 1.125-1.125 1.125h-4.5a1.125 1.125 0 01-1.125-1.125v-4.5zM13.5 4.875c0-.621.504-1.125 1.125-1.125h4.5c.621 0 1.125.504 1.125 1.125v4.5c0 .621-.504 1.125-1.125 1.125h-4.5A1.125 1.125 0 0113.5 9.375v-4.5z" />
                  <path strokeLinecap="round" strokeLinejoin="round" d="M6.75 6.75h.75v.75h-.75v-.75zM6.75 16.5h.75v.75h-.75v-.75zM16.5 6.75h.75v.75h-.75v-.75zM13.5 13.5h.75v.75h-.75v-.75zM13.5 19.5h.75v.75h-.75v-.75zM19.5 13.5h.75v.75h-.75v-.75zM19.5 19.5h.75v.75h-.75v-.75zM16.5 16.5h.75v.75h-.75v-.75z" />
                </svg>
                <span className="rounded-lg bg-black/30 px-3 py-1 text-xs font-extrabold text-emerald-200">
                  {state.attendanceRecords.length} {t("registrada(s)", "recorded")}
                </span>
              </div>
              <div>
                <p className="text-base sm:text-lg font-extrabold text-white">
                  {t("Control de Asistencia (QR y Carnet)", "Attendance Control (QR & ID Card)")}
                </p>
                <p className="text-[11px] text-slate-200/85">
                  {t("Escanear QR con cámara · Rechazo automático a morosos y suspendidos", "Scan QR with camera · Auto-reject overdue & suspended athletes")}
                </p>
              </div>
            </button>

            {/* 10. ESTADÍSTICAS Y MÉTRICAS DE LA PÁGINA (Wide Tile) */}
            <button
              type="button"
              onClick={() => setActiveTab("metricas")}
              className="col-span-2 group relative flex flex-col justify-between overflow-hidden rounded-xl border border-indigo-400/40 bg-gradient-to-r from-indigo-800 via-[#381B4C] to-[#0D3B4C] p-4 sm:p-5 text-left shadow-lg transition-all duration-200 hover:scale-[1.015] hover:border-indigo-300 cursor-pointer"
            >
              <div className="flex items-start justify-between">
                <svg className="h-9 w-9 text-white/95" fill="none" viewBox="0 0 24 24" strokeWidth={1.8} stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M3 13.125C3 12.504 3.504 12 4.125 12h2.25c.621 0 1.125.504 1.125 1.125v6.75C7.5 20.496 6.996 21 6.375 21h-2.25A1.125 1.125 0 013 19.875v-6.75zM9.75 8.625c0-.621.504-1.125 1.125-1.125h2.25c.621 0 1.125.504 1.125 1.125v11.25c0 .621-.504 1.125-1.125 1.125h-2.25a1.125 1.125 0 01-1.125-1.125V8.625zM16.5 4.125c0-.621.504-1.125 1.125-1.125h2.25C20.496 3 21 3.504 21 4.125v15.75c0 .621-.504 1.125-1.125 1.125h-2.25a1.125 1.125 0 01-1.125-1.125V4.125z" />
                </svg>
                <span className="rounded-lg bg-black/30 px-3 py-1 text-xs font-extrabold text-indigo-200">
                  {analytics.totalVisits} {t("visita(s)", "visits")}
                </span>
              </div>
              <div>
                <p className="text-base sm:text-lg font-extrabold text-white">
                  {t("Estadísticas y Métricas Web", "Web Analytics & Metrics")}
                </p>
                <p className="text-[11px] text-slate-200/85">
                  {t("Visitas totales, duración promedio, contenido más visto y países", "Total visits, avg duration, top content & countries")}
                </p>
              </div>
            </button>

            {/* 11. GESTIÓN DE USUARIOS ADMINISTRADORES Y ENTRENADORES */}
            <button
              type="button"
              onClick={() => setActiveTab("usuarios")}
              className="col-span-2 md:col-span-4 group relative flex flex-col justify-between overflow-hidden rounded-xl border border-amber-400/40 bg-gradient-to-r from-[#381B4C] via-[#0B1528] to-[#065F46] p-4 sm:p-5 text-left shadow-lg transition-all duration-200 hover:scale-[1.01] hover:border-amber-300 cursor-pointer"
            >
              <div className="flex items-start justify-between">
                <svg className="h-9 w-9 text-white/95" fill="none" viewBox="0 0 24 24" strokeWidth={1.8} stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M15 19.128a9.38 9.38 0 002.625.372 9.337 9.337 0 004.121-.952 4.125 4.125 0 00-7.533-2.493M15 19.128v-.003c0-1.113-.285-2.16-.786-3.07M15 19.128v.106A12.318 12.318 0 018.624 21c-2.331 0-4.512-.645-6.374-1.766l-.001-.109a6.375 6.375 0 0111.964-3.07M12 6.375a3.375 3.375 0 11-6.75 0 3.375 3.375 0 016.75 0zm8.25 2.25a2.625 2.625 0 11-5.25 0 2.625 2.625 0 015.25 0z" />
                </svg>
                <span className="rounded-lg bg-black/30 px-3 py-1 text-xs font-extrabold text-amber-200">
                  {state.systemUsers.length} {t("Admin / Entrenadores", "Admins / Coaches")} · {state.athletes.length} {t("Estándar", "Standard")}
                </span>
              </div>
              <div>
                <p className="text-base sm:text-lg font-extrabold text-white">
                  {t("Usuarios Administradores y Entrenadores", "Administrator & Coach Users")}
                </p>
                <p className="text-[11px] text-slate-200/85">
                  {t("Crear cuentas con acceso total a configuración, contabilidad y eventos", "Create accounts with full access to settings, accounting & events")}
                </p>
              </div>
            </button>

            {/* 12. AUDITORÍA Y LOGS DEL SISTEMA */}
            <button
              type="button"
              onClick={() => setActiveTab("auditoria")}
              className="col-span-2 md:col-span-4 group relative flex flex-col justify-between overflow-hidden rounded-xl border border-cyan-400/35 bg-gradient-to-r from-[#0B172A] via-[#131B2E] to-[#1E1B4B] p-4 sm:p-5 text-left shadow-lg transition-all duration-200 hover:scale-[1.01] hover:border-cyan-300 cursor-pointer"
            >
              <div className="flex items-start justify-between">
                <svg className="h-9 w-9 text-cyan-300" fill="none" viewBox="0 0 24 24" strokeWidth={1.8} stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M9 12h3.75M9 15h3.75M9 18h3.75m3 .75H18a2.25 2.25 0 002.25-2.25V6.108c0-1.135-.845-2.098-1.976-2.192a48.424 48.424 0 00-1.123-.08m-5.801 0c-.065.21-.1.433-.1.664 0 .414.336.75.75.75h4.5a.75.75 0 00.75-.75 2.25 2.25 0 00-.1-.664m-5.8 0A2.251 2.251 0 0113.5 2.25H15c1.012 0 1.867.668 2.15 1.586m-5.8 0c-.376.023-.75.05-1.124.08C9.095 4.01 8.25 4.973 8.25 6.108V8.25m0 0H4.875c-.621 0-1.125.504-1.125 1.125v11.25c0 .621.504 1.125 1.125 1.125h9.75c.621 0 1.125-.504 1.125-1.125V9.375c0-.621-.504-1.125-1.125-1.125H8.25z" />
                </svg>
                <span className="rounded-lg bg-black/30 px-3 py-1 text-xs font-extrabold text-cyan-200">
                  {(state.auditLogs ?? []).length} {t("Registros", "Records")}
                </span>
              </div>
              <div>
                <p className="text-base sm:text-lg font-extrabold text-white">
                  {t("Auditoría y Logs del Sistema", "System Audit & Logs")}
                </p>
                <p className="text-[11px] text-slate-200/85">
                  {t(
                    "Historial con fecha y hora de ingresos, modificaciones y eliminaciones por usuario",
                    "Date & time history of logins, modifications and deletions by user"
                  )}
                </p>
              </div>
            </button>
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
              <div className="flex flex-wrap gap-2 shrink-0">
                {([5, 10, 15] as const).map((dayNum) => (
                  <button
                    key={dayNum}
                    type="button"
                    onClick={() => {
                      const { nextState, sentCount } = syncScheduledPaymentReminders(
                        state,
                        dayNum
                      );
                      onStateChange(nextState);
                      setNotifyFeedback(
                        sentCount > 0
                          ? t(
                              `Se enviaron ${sentCount} recordatorio(s) programados del día ${dayNum}.`,
                              `Sent ${sentCount} scheduled reminder(s) for day ${dayNum}.`
                            )
                          : t(
                              `Los recordatorios del día ${dayNum} ya fueron enviados este mes.`,
                              `Reminders for day ${dayNum} were already sent this month.`
                            )
                      );
                    }}
                    className="rounded-xl border border-amber-400/40 bg-amber-400/15 px-3 py-2 text-xs font-bold text-amber-200 hover:bg-amber-400/25 cursor-pointer"
                  >
                    {t(`Recordatorio Día ${dayNum}`, `Day ${dayNum} Reminder`)}
                  </button>
                ))}
                <button
                  type="button"
                  onClick={handleNotifyAllDefaulters}
                  className="rounded-xl bg-rose-500 px-4 py-2 text-xs font-bold text-white hover:bg-rose-400 cursor-pointer"
                >
                  {t(
                    `Notificar a Todos (${defaultersList.length})`,
                    `Notify All (${defaultersList.length})`
                  )}
                </button>
              </div>
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
              {defaultersList.map((ath) => {
                const athPayStatus = getAthletePaymentStatus(state, ath);
                return (
                <div
                  key={ath.athleteId}
                  className={`rounded-2xl border bg-[#0D1322] p-5 space-y-3 ${
                    athPayStatus.isSuspended
                      ? "border-rose-500/60"
                      : "border-rose-500/25"
                  }`}
                >
                  <div className="flex items-start justify-between gap-2">
                    <div>
                      <p className="text-sm font-bold text-white">{ath.fullName}</p>
                      <p className="text-[11px] font-mono text-amber-300">{ath.athleteId}</p>
                      <p className="text-[11px] text-slate-400 mt-1">{ath.category}</p>
                    </div>
                    <span
                      className={`rounded-full px-2.5 py-0.5 text-[10px] font-bold ${
                        athPayStatus.isSuspended
                          ? "bg-rose-600 text-white"
                          : "bg-rose-500/20 text-rose-300"
                      }`}
                    >
                      {athPayStatus.isSuspended
                        ? t("SUSPENDIDO (2 meses)", "SUSPENDED (2 mos)")
                        : t("Moroso", "Overdue")}
                    </span>
                  </div>
                  <p className="text-xs text-slate-300">
                    {ath.repPhone
                      ? t("Tel. Representante:", "Guardian Phone:")
                      : t("Teléfono:", "Phone:")}{" "}
                    {ath.repPhone || ath.phone || t("No registrado", "Not registered")}
                  </p>
                  <div className="space-y-2">
                    <button
                      type="button"
                      onClick={() => handleSendPaymentNotification(ath.athleteId, ath.fullName)}
                      className="w-full rounded-xl border border-amber-400/40 bg-amber-400/15 py-2 text-xs font-bold text-amber-200 hover:bg-amber-400/25 cursor-pointer"
                    >
                      {t("Enviar Notificación de Pago", "Send Payment Notification")}
                    </button>
                    {(() => {
                      const rawPhone = (ath.repPhone || ath.phone || "").trim();
                      let digits = rawPhone.replace(/\D/g, "");
                      if (digits.startsWith("0")) digits = "58" + digits.slice(1);
                      if (digits.length < 7) return null;
                      const statusLabel = athPayStatus.isSuspended
                        ? "SUSPENDIDO POR MOROSIDAD (2 meses o más)"
                        : "PAGO PENDIENTE / MOROSO";
                      const waMsg = [
                        `Hola ${ath.repName ? ath.repName : ath.fullName}, te saludamos de *SYNERGIA All Stars Cheer*.`,
                        ``,
                        `Te enviamos este *Aviso Administrativo de Cobro* correspondiente al atleta:`,
                        `• *Atleta:* ${ath.fullName}`,
                        `• *ID:* ${ath.athleteId}`,
                        `• *Grupo:* ${ath.category}`,
                        `• *Estatus:* ${statusLabel}`,
                        ``,
                        `Por favor, regulariza tu mensualidad a través del módulo *Pagos* en el Sistema SYNERGIA o envíanos tu comprobante de pago por este medio para actualizar tu solvencia.`,
                        ``,
                        `¡Gracias por tu atención!`,
                      ].join("\n");
                      return (
                        <a
                          href={`https://wa.me/${digits}?text=${encodeURIComponent(waMsg)}`}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="flex w-full items-center justify-center gap-2 rounded-xl border border-emerald-400/40 bg-emerald-500/20 py-2 text-xs font-bold text-emerald-200 hover:bg-emerald-500/30 transition-colors"
                        >
                          <span>📲</span>
                          <span>{t("Enviar Aviso por WhatsApp", "Send WhatsApp Notice")}</span>
                        </a>
                      );
                    })()}
                  </div>
                </div>
                );
              })}
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

      {/* 8. EVENTOS DEL CALENDARIO PÚBLICO (SOLO ENTRENADORES) */}
      {activeTab === "eventos" && (
        <section className="grid gap-6 lg:grid-cols-2">
          <form
            onSubmit={handleAddEvent}
            className="rounded-3xl border border-white/10 bg-[#0D1322] p-6 space-y-4"
          >
            <div>
              <h2 className="text-lg font-bold text-white">
                {t("Agregar Nuevo Evento", "Add New Event")}
              </h2>
              <p className="text-xs text-slate-400 mt-1">
                {t(
                  "Los eventos creados aquí se muestran automáticamente en el calendario público de la página.",
                  "Events created here appear automatically on the public website calendar."
                )}
              </p>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-200">
                {t("Título del Evento *", "Event Title *")}
              </label>
              <input
                type="text"
                required
                value={evTitle}
                onChange={(e) => setEvTitle(e.target.value)}
                placeholder={t("Ej. Campeonato Regional All Star", "E.g. Regional All Star Championship")}
                className="mt-1.5 w-full rounded-xl border border-white/15 bg-[#070B14] px-3.5 py-2.5 text-sm text-white focus:border-emerald-400 focus:outline-none"
              />
            </div>

            <div className="grid gap-4 sm:grid-cols-2">
              <div>
                <label className="block text-xs font-semibold text-slate-200">
                  {t("Día del Evento *", "Event Date *")}
                </label>
                <input
                  type="date"
                  required
                  value={evDate}
                  onChange={(e) => setEvDate(e.target.value)}
                  className="mt-1.5 w-full rounded-xl border border-white/15 bg-[#070B14] px-3.5 py-2.5 text-sm text-white [color-scheme:dark] focus:border-emerald-400 focus:outline-none"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-200">
                  {t("Hora *", "Time *")}
                </label>
                <input
                  type="text"
                  required
                  value={evTime}
                  onChange={(e) => setEvTime(e.target.value)}
                  placeholder="Ej. 09:00 am – 04:00 pm"
                  className="mt-1.5 w-full rounded-xl border border-white/15 bg-[#070B14] px-3.5 py-2.5 text-sm text-white focus:border-emerald-400 focus:outline-none"
                />
              </div>
            </div>

            <div className="grid gap-4 sm:grid-cols-2">
              <div>
                <label className="block text-xs font-semibold text-slate-200">
                  {t("Sede / Lugar", "Location")}
                </label>
                <input
                  type="text"
                  value={evLocation}
                  onChange={(e) => setEvLocation(e.target.value)}
                  className="mt-1.5 w-full rounded-xl border border-white/15 bg-[#070B14] px-3.5 py-2.5 text-sm text-white focus:border-emerald-400 focus:outline-none"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-200">
                  {t("Grupo", "Group")}
                </label>
                <input
                  type="text"
                  value={evCategory}
                  onChange={(e) => setEvCategory(e.target.value)}
                  placeholder="Competencia / Evaluación / Gala"
                  className="mt-1.5 w-full rounded-xl border border-white/15 bg-[#070B14] px-3.5 py-2.5 text-sm text-white focus:border-emerald-400 focus:outline-none"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-200">
                {t("Descripción del Evento", "Event Description")}
              </label>
              <textarea
                rows={3}
                value={evDescription}
                onChange={(e) => setEvDescription(e.target.value)}
                placeholder={t("Detalles, indicaciones o requisitos del evento...", "Event details, notes or requirements...")}
                className="mt-1.5 w-full rounded-xl border border-white/15 bg-[#070B14] px-3.5 py-2.5 text-sm text-white focus:border-emerald-400 focus:outline-none"
              />
            </div>

            <div className="rounded-2xl border border-[#00B7A4]/35 bg-[#00B7A4]/10 p-4 space-y-3">
              <div className="flex flex-wrap items-center justify-between gap-2">
                <label className="text-xs font-bold text-[#4CE4D4]">
                  {t("Aviso y Recordatorio a Atletas", "Athlete Notice & Reminder")}
                </label>
                <label className="inline-flex items-center gap-2 text-xs text-white cursor-pointer">
                  <input
                    type="checkbox"
                    checked={evSendNotice}
                    onChange={(e) => setEvSendNotice(e.target.checked)}
                    className="h-4 w-4 accent-[#00B7A4]"
                  />
                  {t("Enviar aviso automático", "Send automatic notice")}
                </label>
              </div>

              {evSendNotice && (
                <>
                  <div>
                    <label className="block text-[11px] font-semibold text-slate-200">
                      {t("Días de anticipación para recordatorio", "Reminder days in advance")}
                    </label>
                    <input
                      type="number"
                      min={0}
                      max={60}
                      value={evReminderDays}
                      onChange={(e) => setEvReminderDays(e.target.value)}
                      className="mt-1 w-28 rounded-xl border border-white/15 bg-[#070B14] px-3 py-1.5 text-xs text-white"
                    />
                  </div>

                  <div className="space-y-2">
                    <div className="flex items-center justify-between gap-2">
                      <span className="text-[11px] font-semibold text-slate-200">
                        {t("Grupos a notificar:", "Groups to notify:")}
                      </span>
                      <button
                        type="button"
                        onClick={() => {
                          setEvTargetAll(true);
                          setEvSelectedCategories([]);
                        }}
                        className={`rounded-lg px-2.5 py-1 text-[11px] font-bold transition-colors cursor-pointer ${
                          evTargetAll
                            ? "bg-[#00B7A4] text-slate-950"
                            : "border border-white/20 text-slate-300 hover:bg-white/10"
                        }`}
                      >
                        {t("Todos los grupos", "All groups")}
                      </button>
                    </div>

                    <div className="grid gap-1.5 sm:grid-cols-2">
                      {CHEER_CATEGORIES.map((cat) => {
                        const selected =
                          !evTargetAll && evSelectedCategories.includes(cat);
                        return (
                          <button
                            key={cat}
                            type="button"
                            onClick={() => toggleEvCategory(cat)}
                            className={`rounded-xl border px-2.5 py-1.5 text-left text-[11px] font-semibold transition-all cursor-pointer ${
                              selected
                                ? "border-[#9D5BB8] bg-[#7E3D97]/35 text-white"
                                : "border-white/10 bg-[#070B14]/70 text-slate-300 hover:border-white/30"
                            }`}
                          >
                            {selected ? "✓ " : ""}
                            {cat}
                          </button>
                        );
                      })}
                    </div>
                  </div>
                </>
              )}
            </div>

            <div className="rounded-2xl border border-[#9D5BB8]/35 bg-[#7E3D97]/10 p-4 space-y-2">
              <label className="block text-xs font-bold text-purple-200">
                {t("Flyer del Evento (Opcional · Se visualiza en ventana flotante)", "Event Flyer (Optional · Viewed in floating modal)")}
              </label>
              <input
                type="file"
                accept="image/*"
                onChange={handleEvFlyerUpload}
                className="block w-full text-xs text-slate-300 file:mr-3 file:rounded-lg file:border-0 file:bg-[#7E3D97]/40 file:px-3 file:py-2 file:text-xs file:font-bold file:text-purple-100"
              />
              {evFlyerDataUrl && (
                // eslint-disable-next-line @next/next/no-img-element
                <img
                  src={evFlyerDataUrl}
                  alt="Vista previa flyer"
                  className="mt-2 h-32 w-auto rounded-xl border border-white/15 object-contain"
                />
              )}
            </div>

            {evSavedMsg && (
              <div className="rounded-xl border border-emerald-500/30 bg-emerald-500/10 p-3 text-xs text-emerald-200">
                {evSavedMsg}
              </div>
            )}

            <button
              type="submit"
              className="w-full rounded-xl bg-[#00B7A4] py-3 text-sm font-bold text-slate-950 hover:bg-[#14CEBA] cursor-pointer"
            >
              {t("Guardar y Publicar Evento", "Save & Publish Event")}
            </button>
          </form>

          {/* Lista de eventos ya configurados (para visualizar flyer o eliminar) */}
          <div className="rounded-3xl border border-white/10 bg-[#0D1322] p-6 space-y-4">
            <h2 className="text-lg font-bold text-white">
              {t("Eventos Configurados", "Configured Events")} ({state.events.length})
            </h2>

            {state.events.length === 0 ? (
              <p className="py-8 text-center text-xs text-slate-400">
                {t("No hay eventos configurados.", "No events configured.")}
              </p>
            ) : (
              <div className="space-y-3 max-h-[600px] overflow-y-auto pr-1">
                {state.events.map((ev) => (
                  <div
                    key={ev.id}
                    className="rounded-2xl border border-white/10 bg-[#070B14]/85 p-4 text-xs space-y-2"
                  >
                    <div className="flex items-start justify-between gap-2">
                      <div>
                        <span className="font-mono font-bold text-amber-300">
                          {ev.date}
                        </span>
                        <span className="ml-2 rounded-full bg-[#7E3D97]/30 px-2 py-0.5 text-[10px] font-bold text-purple-200">
                          {ev.category}
                        </span>
                        <h3 className="mt-1 text-sm font-bold text-white">
                          {ev.title}
                        </h3>
                      </div>

                      <button
                        type="button"
                        onClick={() => handleDeleteEvent(ev.id)}
                        className="shrink-0 rounded-lg border border-rose-500/40 bg-rose-500/10 px-2.5 py-1 text-[11px] font-bold text-rose-300 hover:bg-rose-500/20 cursor-pointer"
                      >
                        {t("Eliminar", "Delete")}
                      </button>
                    </div>

                    <p className="text-slate-300">
                      {ev.time} · {ev.location}
                    </p>
                    {ev.description && (
                      <p className="text-slate-400">{ev.description}</p>
                    )}

                    {ev.flyerDataUrl && (
                      <button
                        type="button"
                        onClick={() =>
                          setCoachFlyerModal({
                            title: ev.title,
                            url: ev.flyerDataUrl!,
                          })
                        }
                        className="inline-flex items-center gap-1.5 rounded-lg border border-[#9D5BB8]/50 bg-[#7E3D97]/25 px-3 py-1.5 text-[11px] font-bold text-purple-100 hover:bg-[#7E3D97]/45 cursor-pointer"
                      >
                        {t("Ver Flyer en Ventana", "View Flyer")}
                      </button>
                    )}
                  </div>
                ))}
              </div>
            )}
            {/* 9. CONTROL DE ASISTENCIA QR / CARNET (Wide Tile) */}
            <button
              type="button"
              onClick={() => setActiveTab("asistencia")}
              className="col-span-2 group relative flex flex-col justify-between overflow-hidden rounded-xl border border-emerald-400/40 bg-gradient-to-r from-[#065F46] via-[#0F766E] to-[#4A1C5C] p-4 sm:p-5 text-left shadow-lg transition-all duration-200 hover:scale-[1.015] hover:border-[#4CE4D4] cursor-pointer"
            >
              <div className="flex items-start justify-between">
                <svg className="h-9 w-9 text-white/95" fill="none" viewBox="0 0 24 24" strokeWidth={1.8} stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M3.75 4.875c0-.621.504-1.125 1.125-1.125h4.5c.621 0 1.125.504 1.125 1.125v4.5c0 .621-.504 1.125-1.125 1.125h-4.5A1.125 1.125 0 013.75 9.375v-4.5zM3.75 14.625c0-.621.504-1.125 1.125-1.125h4.5c.621 0 1.125.504 1.125 1.125v4.5c0 .621-.504 1.125-1.125 1.125h-4.5a1.125 1.125 0 01-1.125-1.125v-4.5zM13.5 4.875c0-.621.504-1.125 1.125-1.125h4.5c.621 0 1.125.504 1.125 1.125v4.5c0 .621-.504 1.125-1.125 1.125h-4.5A1.125 1.125 0 0113.5 9.375v-4.5z" />
                  <path strokeLinecap="round" strokeLinejoin="round" d="M6.75 6.75h.75v.75h-.75v-.75zM6.75 16.5h.75v.75h-.75v-.75zM16.5 6.75h.75v.75h-.75v-.75zM13.5 13.5h.75v.75h-.75v-.75zM13.5 19.5h.75v.75h-.75v-.75zM19.5 13.5h.75v.75h-.75v-.75zM19.5 19.5h.75v.75h-.75v-.75zM16.5 16.5h.75v.75h-.75v-.75z" />
                </svg>
                <span className="rounded-lg bg-black/30 px-3 py-1 text-xs font-extrabold text-emerald-200">
                  {state.attendanceRecords.length} {t("registrada(s)", "recorded")}
                </span>
              </div>
              <div>
                <p className="text-base sm:text-lg font-extrabold text-white">
                  {t("Control de Asistencia (QR y Carnet)", "Attendance Control (QR & ID Card)")}
                </p>
                <p className="text-[11px] text-slate-200/85">
                  {t("Escanear QR con cámara · Rechazo automático a morosos y suspendidos", "Scan QR with camera · Auto-reject overdue & suspended athletes")}
                </p>
              </div>
            </button>

            {/* 10. ESTADÍSTICAS Y MÉTRICAS DE LA PÁGINA (Wide Tile) */}
            <button
              type="button"
              onClick={() => setActiveTab("metricas")}
              className="col-span-2 group relative flex flex-col justify-between overflow-hidden rounded-xl border border-indigo-400/40 bg-gradient-to-r from-indigo-800 via-[#381B4C] to-[#0D3B4C] p-4 sm:p-5 text-left shadow-lg transition-all duration-200 hover:scale-[1.015] hover:border-indigo-300 cursor-pointer"
            >
              <div className="flex items-start justify-between">
                <svg className="h-9 w-9 text-white/95" fill="none" viewBox="0 0 24 24" strokeWidth={1.8} stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M3 13.125C3 12.504 3.504 12 4.125 12h2.25c.621 0 1.125.504 1.125 1.125v6.75C7.5 20.496 6.996 21 6.375 21h-2.25A1.125 1.125 0 013 19.875v-6.75zM9.75 8.625c0-.621.504-1.125 1.125-1.125h2.25c.621 0 1.125.504 1.125 1.125v11.25c0 .621-.504 1.125-1.125 1.125h-2.25a1.125 1.125 0 01-1.125-1.125V8.625zM16.5 4.125c0-.621.504-1.125 1.125-1.125h2.25C20.496 3 21 3.504 21 4.125v15.75c0 .621-.504 1.125-1.125 1.125h-2.25a1.125 1.125 0 01-1.125-1.125V4.125z" />
                </svg>
                <span className="rounded-lg bg-black/30 px-3 py-1 text-xs font-extrabold text-indigo-200">
                  {analytics.totalVisits} {t("visita(s)", "visits")}
                </span>
              </div>
              <div>
                <p className="text-base sm:text-lg font-extrabold text-white">
                  {t("Estadísticas y Métricas Web", "Web Analytics & Metrics")}
                </p>
                <p className="text-[11px] text-slate-200/85">
                  {t("Visitas totales, duración promedio, contenido más visto y países", "Total visits, avg duration, top content & countries")}
                </p>
              </div>
            </button>

            {/* 11. GESTIÓN DE USUARIOS ADMINISTRADORES Y ENTRENADORES */}
            <button
              type="button"
              onClick={() => setActiveTab("usuarios")}
              className="col-span-2 md:col-span-4 group relative flex flex-col justify-between overflow-hidden rounded-xl border border-amber-400/40 bg-gradient-to-r from-[#381B4C] via-[#0B1528] to-[#065F46] p-4 sm:p-5 text-left shadow-lg transition-all duration-200 hover:scale-[1.01] hover:border-amber-300 cursor-pointer"
            >
              <div className="flex items-start justify-between">
                <svg className="h-9 w-9 text-white/95" fill="none" viewBox="0 0 24 24" strokeWidth={1.8} stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M15 19.128a9.38 9.38 0 002.625.372 9.337 9.337 0 004.121-.952 4.125 4.125 0 00-7.533-2.493M15 19.128v-.003c0-1.113-.285-2.16-.786-3.07M15 19.128v.106A12.318 12.318 0 018.624 21c-2.331 0-4.512-.645-6.374-1.766l-.001-.109a6.375 6.375 0 0111.964-3.07M12 6.375a3.375 3.375 0 11-6.75 0 3.375 3.375 0 016.75 0zm8.25 2.25a2.625 2.625 0 11-5.25 0 2.625 2.625 0 015.25 0z" />
                </svg>
                <span className="rounded-lg bg-black/30 px-3 py-1 text-xs font-extrabold text-amber-200">
                  {state.systemUsers.length} {t("Admin / Entrenadores", "Admins / Coaches")} · {state.athletes.length} {t("Estándar", "Standard")}
                </span>
              </div>
              <div>
                <p className="text-base sm:text-lg font-extrabold text-white">
                  {t("Usuarios Administradores y Entrenadores", "Administrator & Coach Users")}
                </p>
                <p className="text-[11px] text-slate-200/85">
                  {t("Crear cuentas con acceso total a configuración, contabilidad y eventos", "Create accounts with full access to settings, accounting & events")}
                </p>
              </div>
            </button>

            {/* 12. AUDITORÍA Y LOGS DEL SISTEMA */}
            <button
              type="button"
              onClick={() => setActiveTab("auditoria")}
              className="col-span-2 md:col-span-4 group relative flex flex-col justify-between overflow-hidden rounded-xl border border-cyan-400/35 bg-gradient-to-r from-[#0B172A] via-[#131B2E] to-[#1E1B4B] p-4 sm:p-5 text-left shadow-lg transition-all duration-200 hover:scale-[1.01] hover:border-cyan-300 cursor-pointer"
            >
              <div className="flex items-start justify-between">
                <svg className="h-9 w-9 text-cyan-300" fill="none" viewBox="0 0 24 24" strokeWidth={1.8} stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M9 12h3.75M9 15h3.75M9 18h3.75m3 .75H18a2.25 2.25 0 002.25-2.25V6.108c0-1.135-.845-2.098-1.976-2.192a48.424 48.424 0 00-1.123-.08m-5.801 0c-.065.21-.1.433-.1.664 0 .414.336.75.75.75h4.5a.75.75 0 00.75-.75 2.25 2.25 0 00-.1-.664m-5.8 0A2.251 2.251 0 0113.5 2.25H15c1.012 0 1.867.668 2.15 1.586m-5.8 0c-.376.023-.75.05-1.124.08C9.095 4.01 8.25 4.973 8.25 6.108V8.25m0 0H4.875c-.621 0-1.125.504-1.125 1.125v11.25c0 .621.504 1.125 1.125 1.125h9.75c.621 0 1.125-.504 1.125-1.125V9.375c0-.621-.504-1.125-1.125-1.125H8.25z" />
                </svg>
                <span className="rounded-lg bg-black/30 px-3 py-1 text-xs font-extrabold text-cyan-200">
                  {(state.auditLogs ?? []).length} {t("Registros", "Records")}
                </span>
              </div>
              <div>
                <p className="text-base sm:text-lg font-extrabold text-white">
                  {t("Auditoría y Logs del Sistema", "System Audit & Logs")}
                </p>
                <p className="text-[11px] text-slate-200/85">
                  {t(
                    "Historial con fecha y hora de ingresos, modificaciones y eliminaciones por usuario",
                    "Date & time history of logins, modifications and deletions by user"
                  )}
                </p>
              </div>
            </button>
          </div>
        </section>
      )}

      {/* 9. CONTROL DE ASISTENCIA QR Y CARNET */}
      {activeTab === "asistencia" && (
        <AttendanceControl
          state={state}
          onStateChange={onStateChange}
          recordedBy={currentUser?.username ?? "coach"}
        />
      )}

      {/* 10. ESTADÍSTICAS Y MÉTRICAS DE PÁGINA */}
      {activeTab === "metricas" && (() => {
        const avgSeconds =
          analytics.totalVisits > 0
            ? analytics.totalDurationSeconds / analytics.totalVisits
            : 0;
        const rankedSections = Object.entries(analytics.sectionViews).sort(
          (a, b) => b[1] - a[1]
        );
        const topSection = rankedSections[0] ?? ["Inicio", 0];
        const maxSectionViews = Math.max(1, topSection[1]);

        const rankedCountries = Object.entries(analytics.visitsByCountry).sort(
          (a, b) => b[1] - a[1]
        );
        const totalCountryVisits = Math.max(
          1,
          rankedCountries.reduce((s, [, v]) => s + v, 0)
        );

        return (
          <section className="space-y-6">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 rounded-2xl border border-white/10 bg-[#0D1322] p-5">
              <div>
                <h2 className="text-lg font-bold text-white">
                  {t("Estadísticas y Métricas de la Página", "Website Statistics & Metrics")}
                </h2>
                <p className="text-xs text-slate-400 mt-1">
                  {t(
                    "Datos vinculados en tiempo real con la navegación, duración de sesiones y origen de los visitantes.",
                    "Real-time metrics linked to site navigation, session duration and visitor countries."
                  )}
                </p>
              </div>
              <div className="flex flex-wrap gap-2">
                <button
                  type="button"
                  onClick={() => generateAnalyticsPdf(analytics)}
                  className="rounded-xl border border-[#9D5BB8]/60 bg-[#7E3D97] px-4 py-2 text-xs font-bold text-white hover:bg-[#914BAE] cursor-pointer"
                >
                  {t("Reporte PDF (Membretado)", "PDF Report (Letterhead)")}
                </button>
                <button
                  type="button"
                  onClick={() => setAnalytics(loadAnalyticsState())}
                  className="rounded-xl bg-[#00B7A4] px-4 py-2 text-xs font-bold text-slate-950 hover:bg-[#14CEBA] cursor-pointer"
                >
                  {t("Actualizar Métricas", "Refresh Metrics")}
                </button>
                <button
                  type="button"
                  onClick={() => setAnalytics(resetAnalyticsState())}
                  className="rounded-xl border border-rose-500/40 bg-rose-500/10 px-4 py-2 text-xs font-bold text-rose-300 hover:bg-rose-500/20 cursor-pointer"
                >
                  {t("Reiniciar", "Reset")}
                </button>
              </div>
            </div>

            {/* KPIs */}
            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
              <div className="rounded-2xl border border-[#00B7A4]/30 bg-[#0D1322] p-5">
                <p className="text-xs text-slate-400">{t("Visitas Totales", "Total Visits")}</p>
                <p className="mt-1 text-3xl font-black text-[#4CE4D4]">
                  {analytics.totalVisits}
                </p>
              </div>
              <div className="rounded-2xl border border-[#9D5BB8]/35 bg-[#0D1322] p-5">
                <p className="text-xs text-slate-400">{t("Tiempo Total de Duración", "Total Duration")}</p>
                <p className="mt-1 text-3xl font-black text-purple-200">
                  {formatDuration(analytics.totalDurationSeconds)}
                </p>
              </div>
              <div className="rounded-2xl border border-emerald-500/30 bg-[#0D1322] p-5">
                <p className="text-xs text-slate-400">{t("Tiempo Promedio en Página", "Average Page Duration")}</p>
                <p className="mt-1 text-3xl font-black text-emerald-300">
                  {formatDuration(avgSeconds)}
                </p>
              </div>
              <div className="rounded-2xl border border-amber-400/30 bg-[#0D1322] p-5">
                <p className="text-xs text-slate-400">{t("Contenido Más Visto", "Most Viewed Content")}</p>
                <p className="mt-1 text-xl font-extrabold text-amber-300 truncate">
                  {topSection[0]}
                </p>
                <p className="text-[11px] text-slate-400">
                  {topSection[1]} {t("vista(s)", "views")}
                </p>
              </div>
            </div>

            <div className="grid gap-6 lg:grid-cols-2">
              {/* Contenido Más Visto */}
              <div className="rounded-2xl border border-white/10 bg-[#0D1322] p-5 space-y-4">
                <h3 className="text-base font-bold text-white">
                  {t("Contenido Más Visto", "Most Viewed Content")}
                </h3>
                <div className="space-y-3">
                  {rankedSections.map(([section, views]) => {
                    const pct = Math.round((views / maxSectionViews) * 100);
                    return (
                      <div key={section} className="space-y-1 text-xs">
                        <div className="flex justify-between">
                          <span className="font-semibold text-slate-200">{section}</span>
                          <span className="font-mono font-bold text-[#4CE4D4]">
                            {views}
                          </span>
                        </div>
                        <div className="h-2 w-full overflow-hidden rounded-full bg-white/10">
                          <div
                            className="h-full rounded-full bg-gradient-to-r from-[#00B7A4] to-[#7E3D97]"
                            style={{ width: `${pct}%` }}
                          />
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>

              {/* Visitas por País */}
              <div className="rounded-2xl border border-white/10 bg-[#0D1322] p-5 space-y-4">
                <h3 className="text-base font-bold text-white">
                  {t("Visitas por País", "Visits by Country")}
                </h3>
                {rankedCountries.length === 0 ? (
                  <p className="py-8 text-center text-xs text-slate-400">
                    {t("Aún no hay visitas registradas por país.", "No country visits recorded yet.")}
                  </p>
                ) : (
                  <div className="space-y-3">
                    {rankedCountries.map(([country, count]) => {
                      const pct = Math.round((count / totalCountryVisits) * 100);
                      return (
                        <div key={country} className="space-y-1 text-xs">
                          <div className="flex justify-between">
                            <span className="font-semibold text-slate-200">{country}</span>
                            <span className="font-mono font-bold text-amber-300">
                              {count} ({pct}%)
                            </span>
                          </div>
                          <div className="h-2 w-full overflow-hidden rounded-full bg-white/10">
                            <div
                              className="h-full rounded-full bg-gradient-to-r from-[#7E3D97] to-amber-400"
                              style={{ width: `${pct}%` }}
                            />
                          </div>
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>
            </div>
          </section>
        );
      })()}

      {/* 11. GESTIÓN DE USUARIOS ADMINISTRADORES Y ENTRENADORES */}
      {activeTab === "usuarios" && (
        <section className="grid gap-6 lg:grid-cols-2">
          <form
            onSubmit={handleCreateSystemUser}
            className="rounded-3xl border border-white/10 bg-[#0D1322] p-6 space-y-4"
          >
            <div>
              <h2 className="text-lg font-bold text-white">
                {t("Crear Usuario Administrador o Entrenador", "Create Administrator or Coach User")}
              </h2>
              <p className="mt-1 text-xs text-slate-400">
                {t(
                  "Los entrenadores y administradores tienen acceso completo a todos los módulos del sistema (contabilidad, pagos, eventos, reportes y usuarios). Los atletas son usuarios estándar.",
                  "Coaches and administrators have full access to all system modules (accounting, payments, events, reports and users). Athletes are standard users."
                )}
              </p>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-200">
                {t("Nombre Completo *", "Full Name *")}
              </label>
              <input
                type="text"
                required
                value={newSysFullName}
                onChange={(e) => setNewSysFullName(e.target.value)}
                placeholder="Ej. Coach Daniela Pérez"
                className="mt-1.5 w-full rounded-xl border border-white/15 bg-[#070B14] px-3.5 py-2.5 text-sm text-white focus:border-emerald-400 focus:outline-none"
              />
            </div>

            <div className="grid gap-4 sm:grid-cols-2">
              <div>
                <label className="block text-xs font-semibold text-slate-200">
                  {t("Rol Administrativo *", "Administrative Role *")}
                </label>
                <select
                  value={newSysRole}
                  onChange={(e) =>
                    setNewSysRole(
                      e.target.value as "Administrador" | "Entrenador"
                    )
                  }
                  className="mt-1.5 w-full rounded-xl border border-white/15 bg-[#070B14] px-3.5 py-2.5 text-sm text-white focus:border-emerald-400 focus:outline-none"
                >
                  <option value="Entrenador">Entrenador (Acceso Admin)</option>
                  <option value="Administrador">Administrador (Acceso Total)</option>
                </select>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-200">
                  {t("Usuario *", "Username *")}
                </label>
                <input
                  type="text"
                  required
                  value={newSysUsername}
                  onChange={(e) => setNewSysUsername(e.target.value)}
                  placeholder="Ej. dperez"
                  className="mt-1.5 w-full rounded-xl border border-white/15 bg-[#070B14] px-3.5 py-2.5 text-sm text-white focus:border-emerald-400 focus:outline-none"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-200">
                {t("Contraseña *", "Password *")}
              </label>
              <input
                type="password"
                required
                value={newSysPassword}
                onChange={(e) => setNewSysPassword(e.target.value)}
                placeholder="••••••••"
                className="mt-1.5 w-full rounded-xl border border-white/15 bg-[#070B14] px-3.5 py-2.5 text-sm text-white focus:border-emerald-400 focus:outline-none"
              />
            </div>

            {sysUserError && (
              <div className="rounded-xl border border-rose-500/30 bg-rose-500/10 p-3 text-xs text-rose-200">
                {sysUserError}
              </div>
            )}
            {sysUserSuccess && (
              <div className="rounded-xl border border-emerald-500/30 bg-emerald-500/10 p-3 text-xs text-emerald-200">
                {sysUserSuccess}
              </div>
            )}

            <button
              type="submit"
              className="w-full rounded-xl bg-[#00B7A4] py-3 text-sm font-bold text-slate-950 hover:bg-[#14CEBA] cursor-pointer"
            >
              {t("Crear Usuario Administrador", "Create Administrator User")}
            </button>
          </form>

          <div className="rounded-3xl border border-white/10 bg-[#0D1322] p-6 space-y-4">
            <div className="flex items-center justify-between">
              <h2 className="text-lg font-bold text-white">
                {t("Usuarios del Sistema", "System Users")}
              </h2>
              <span className="rounded-lg bg-purple-500/20 px-2.5 py-1 text-[11px] font-bold text-purple-200">
                {state.athletes.length} {t("Atletas (Estándar)", "Athletes (Standard)")}
              </span>
            </div>

            <div className="space-y-3 max-h-[540px] overflow-y-auto pr-1">
              {state.systemUsers.map((u) => (
                <div
                  key={u.username}
                  className="flex items-center justify-between gap-3 rounded-2xl border border-white/10 bg-[#070B14]/85 p-4 text-xs"
                >
                  <div className="min-w-0">
                    <div className="flex flex-wrap items-center gap-2">
                      <span className="text-sm font-bold text-white truncate">
                        {u.fullName}
                      </span>
                      <span className="rounded-full bg-emerald-500/20 px-2 py-0.5 text-[10px] font-bold text-emerald-300">
                        Usuario Administrador ({u.role})
                      </span>
                    </div>
                    <p className="mt-1 font-mono text-amber-300">
                      Usuario: {u.username}
                    </p>
                  </div>

                  {u.username.toLowerCase() !== "admin" && (
                    <button
                      type="button"
                      onClick={() => handleDeleteSystemUser(u.username)}
                      className="shrink-0 rounded-lg border border-rose-500/40 bg-rose-500/10 px-2.5 py-1.5 text-[11px] font-bold text-rose-300 hover:bg-rose-500/20 cursor-pointer"
                    >
                      {t("Eliminar", "Delete")}
                    </button>
                  )}
                </div>
              ))}

              {state.athletes.map((ath) => {
                const athPay = getAthletePaymentStatus(state, ath);
                const isEditing = editAthleteId === ath.athleteId;
                return (
                  <div
                    key={ath.athleteId}
                    className="rounded-2xl border border-purple-500/25 bg-[#070B14]/85 p-4 text-xs space-y-3"
                  >
                    <div className="flex flex-wrap items-start justify-between gap-3">
                      <div className="min-w-0 space-y-1">
                        <div className="flex flex-wrap items-center gap-2">
                          <span className="text-sm font-bold text-white truncate">
                            {ath.fullName}
                          </span>
                          <span className="rounded-full bg-purple-500/20 px-2 py-0.5 text-[10px] font-bold text-purple-200">
                            {t("Usuario Estándar (Atleta)", "Standard User (Athlete)")}
                          </span>
                          <span
                            className={`rounded-full px-2 py-0.5 text-[10px] font-bold ${
                              athPay.isSuspended
                                ? "bg-rose-600/30 text-rose-200"
                                : athPay.isOverdue
                                ? "bg-amber-500/25 text-amber-200"
                                : "bg-emerald-500/20 text-emerald-300"
                            }`}
                          >
                            {athPay.isSuspended
                              ? t("Suspendido", "Suspended")
                              : athPay.isOverdue
                              ? t("Moroso", "Overdue")
                              : t("Solvente", "Solvent")}
                          </span>
                          <span
                            className={`rounded-full px-2 py-0.5 text-[10px] font-bold ${
                              ath.profileCompleted
                                ? "bg-sky-500/20 text-sky-300"
                                : "bg-amber-500/20 text-amber-300"
                            }`}
                          >
                            {ath.profileCompleted
                              ? t("Perfil Completo", "Profile Complete")
                              : t("Formalización Pendiente", "Pending Profile")}
                          </span>
                        </div>
                        <p className="font-mono text-amber-300">
                          {t("Usuario:", "Username:")} {ath.username} · {t("Clave:", "Pass:")} {ath.password}
                        </p>
                        <p className="text-[11px] text-slate-400">
                          {ath.athleteId} · {ath.category} ({ath.position})
                        </p>
                      </div>

                      <div className="flex shrink-0 items-center gap-2">
                        <button
                          type="button"
                          onClick={() => handleStartEditAthleteUser(ath)}
                          className="rounded-lg border border-sky-400/40 bg-sky-500/15 px-2.5 py-1.5 text-[11px] font-bold text-sky-200 hover:bg-sky-500/25 cursor-pointer"
                        >
                          {t("Modificar", "Edit")}
                        </button>
                        <button
                          type="button"
                          onClick={() => handleRequestDeleteAthleteUser(ath)}
                          className="rounded-lg border border-rose-500/40 bg-rose-500/10 px-2.5 py-1.5 text-[11px] font-bold text-rose-300 hover:bg-rose-500/20 cursor-pointer"
                        >
                          {t("Eliminar", "Delete")}
                        </button>
                      </div>
                    </div>

                    {isEditing && (
                      <form
                        onSubmit={handleSaveEditAthleteUser}
                        className="rounded-xl border border-white/10 bg-white/5 p-3 space-y-2.5"
                      >
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                          <label className="space-y-1 text-[11px] text-slate-300">
                            <span>{t("Usuario", "Username")}</span>
                            <input
                              type="text"
                              value={editAthUsername}
                              onChange={(e) => setEditAthUsername(e.target.value)}
                              className="w-full rounded-lg border border-white/15 bg-[#0D1322] px-2.5 py-1.5 text-xs text-white"
                            />
                          </label>
                          <label className="space-y-1 text-[11px] text-slate-300">
                            <span>{t("Contraseña", "Password")}</span>
                            <input
                              type="text"
                              value={editAthPassword}
                              onChange={(e) => setEditAthPassword(e.target.value)}
                              className="w-full rounded-lg border border-white/15 bg-[#0D1322] px-2.5 py-1.5 text-xs text-white"
                            />
                          </label>
                          <label className="space-y-1 text-[11px] text-slate-300">
                            <span>{t("Grupo", "Group")}</span>
                            <select
                              value={editAthCategory}
                              onChange={(e) =>
                                setEditAthCategory(
                                  e.target.value as AthleteProfile["category"]
                                )
                              }
                              className="w-full rounded-lg border border-white/15 bg-[#0D1322] px-2.5 py-1.5 text-xs text-white"
                            >
                              {CHEER_CATEGORIES.map((c) => (
                                <option key={c} value={c}>
                                  {c}
                                </option>
                              ))}
                            </select>
                          </label>
                          <label className="space-y-1 text-[11px] text-slate-300">
                            <span>{t("Posición", "Position")}</span>
                            <select
                              value={editAthPosition}
                              onChange={(e) =>
                                setEditAthPosition(
                                  e.target.value as AthleteProfile["position"]
                                )
                              }
                              className="w-full rounded-lg border border-white/15 bg-[#0D1322] px-2.5 py-1.5 text-xs text-white"
                            >
                              {CHEER_POSITIONS.map((p) => (
                                <option key={p} value={p}>
                                  {p}
                                </option>
                              ))}
                            </select>
                          </label>
                        </div>
                        <div className="flex items-center justify-end gap-2">
                          <button
                            type="button"
                            onClick={() => setEditAthleteId(null)}
                            className="rounded-lg border border-white/15 px-3 py-1.5 text-[11px] font-semibold text-slate-300 hover:bg-white/10 cursor-pointer"
                          >
                            {t("Cancelar", "Cancel")}
                          </button>
                          <button
                            type="submit"
                            className="rounded-lg bg-emerald-500 px-3 py-1.5 text-[11px] font-bold text-slate-950 hover:bg-emerald-400 cursor-pointer"
                          >
                            {t("Guardar Cambios", "Save Changes")}
                          </button>
                        </div>
                      </form>
                    )}
                  </div>
                );
              })}
            </div>
          </div>
        </section>
      )}

      {/* MODAL FLOTANTE: Visor de Flyer (Entrenador, sin descarga) */}
      {coachFlyerModal && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/85 p-4 backdrop-blur-md"
          onClick={() => setCoachFlyerModal(null)}
        >
          <div
            className="w-full max-w-2xl overflow-hidden rounded-[24px] border border-white/15 bg-[#0B1120] shadow-2xl"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between border-b border-white/10 px-5 py-3.5">
              <p className="truncate text-sm font-bold text-white">
                {coachFlyerModal.title}
              </p>
              <button
                type="button"
                onClick={() => setCoachFlyerModal(null)}
                className="flex h-8 w-8 items-center justify-center rounded-full bg-white/10 text-xs text-white hover:bg-white/20 cursor-pointer"
              >
                ✕
              </button>
            </div>
            <div className="flex items-center justify-center bg-[#070B14] p-4 max-h-[78vh] overflow-auto">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={coachFlyerModal.url}
                alt={coachFlyerModal.title}
                className="max-h-[70vh] w-auto rounded-xl object-contain"
              />
            </div>
          </div>
        </div>
      )}

      {/* TAB 12: AUDITORÍA Y LOGS DEL SISTEMA */}
      {activeTab === "auditoria" && (() => {
        const allLogs = state.auditLogs ?? [];
        const filteredLogs = allLogs.filter((log) => {
          const matchesAction =
            auditActionFilter === "TODOS" || log.action === auditActionFilter;
          const q = auditSearch.trim().toLowerCase();
          const matchesQuery =
            !q ||
            log.actorName.toLowerCase().includes(q) ||
            log.actorUsername.toLowerCase().includes(q) ||
            log.module.toLowerCase().includes(q) ||
            log.detail.toLowerCase().includes(q);
          return matchesAction && matchesQuery;
        });

        const badgeClass = (act: AuditActionType) => {
          switch (act) {
            case "INGRESO":
              return "bg-emerald-500/20 text-emerald-300 border-emerald-500/35";
            case "CIERRE_SESION":
              return "bg-slate-500/20 text-slate-300 border-slate-500/35";
            case "CREACION":
              return "bg-sky-500/20 text-sky-300 border-sky-500/35";
            case "MODIFICACION":
              return "bg-amber-500/20 text-amber-300 border-amber-500/35";
            case "ELIMINACION":
              return "bg-rose-500/20 text-rose-300 border-rose-500/35";
            case "EVALUACION":
              return "bg-purple-500/20 text-purple-300 border-purple-500/35";
          }
        };

        return (
          <div className="rounded-3xl border border-white/10 bg-[#0D1322] p-6 space-y-5">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
              <div>
                <h2 className="text-lg font-bold text-white">
                  {t(
                    "Módulo de Auditoría y Logs del Sistema",
                    "System Audit & Activity Logs"
                  )}
                </h2>
                <p className="text-xs text-slate-400">
                  {t(
                    "Registro cronológico con fecha y hora de ingresos, modificaciones, evaluaciones y eliminaciones.",
                    "Chronological record with date and time of logins, modifications, evaluations and deletions."
                  )}
                </p>
              </div>
              <span className="self-start rounded-xl bg-cyan-500/15 border border-cyan-400/30 px-3 py-1.5 text-xs font-bold text-cyan-200">
                {filteredLogs.length} / {allLogs.length} {t("eventos", "events")}
              </span>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              <input
                type="text"
                value={auditSearch}
                onChange={(e) => setAuditSearch(e.target.value)}
                placeholder={t(
                  "Buscar usuario, módulo o detalle...",
                  "Search user, module or detail..."
                )}
                className="sm:col-span-2 rounded-xl border border-white/15 bg-[#070B14] px-3.5 py-2.5 text-sm text-white placeholder:text-slate-500 focus:border-cyan-400 focus:outline-none"
              />
              <select
                value={auditActionFilter}
                onChange={(e) =>
                  setAuditActionFilter(
                    e.target.value as AuditActionType | "TODOS"
                  )
                }
                className="rounded-xl border border-white/15 bg-[#070B14] px-3.5 py-2.5 text-sm text-white focus:border-cyan-400 focus:outline-none"
              >
                <option value="TODOS">{t("Todas las acciones", "All actions")}</option>
                <option value="INGRESO">INGRESO</option>
                <option value="CIERRE_SESION">CIERRE DE SESIÓN</option>
                <option value="CREACION">CREACIÓN</option>
                <option value="MODIFICACION">MODIFICACIÓN</option>
                <option value="ELIMINACION">ELIMINACIÓN</option>
                <option value="EVALUACION">EVALUACIÓN</option>
              </select>
            </div>

            {filteredLogs.length === 0 ? (
              <div className="rounded-2xl border border-white/10 bg-[#070B14]/70 py-12 text-center text-xs text-slate-400">
                {t(
                  "No hay registros de auditoría que coincidan con el filtro.",
                  "No audit logs match the current filter."
                )}
              </div>
            ) : (
              <div className="overflow-x-auto max-h-[540px] overflow-y-auto rounded-2xl border border-white/10">
                <table className="w-full text-left text-xs">
                  <thead className="sticky top-0 bg-[#070B14] text-[11px] uppercase tracking-wider text-slate-400 border-b border-white/10">
                    <tr>
                      <th className="px-4 py-3">{t("Fecha y Hora", "Date & Time")}</th>
                      <th className="px-4 py-3">{t("Usuario", "User")}</th>
                      <th className="px-4 py-3">{t("Acción", "Action")}</th>
                      <th className="px-4 py-3">{t("Módulo", "Module")}</th>
                      <th className="px-4 py-3">{t("Detalle", "Detail")}</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-white/5 bg-[#070B14]/60">
                    {filteredLogs.map((log) => (
                      <tr key={log.id} className="hover:bg-white/[0.03]">
                        <td className="whitespace-nowrap px-4 py-3 font-mono text-[11px] text-slate-300">
                          {new Date(log.timestamp).toLocaleString("es-VE")}
                        </td>
                        <td className="px-4 py-3">
                          <p className="font-bold text-white">{log.actorName}</p>
                          <p className="text-[10px] font-mono text-amber-300">
                            @{log.actorUsername} · {log.actorRole}
                          </p>
                        </td>
                        <td className="whitespace-nowrap px-4 py-3">
                          <span
                            className={`inline-block rounded-full border px-2.5 py-0.5 text-[10px] font-extrabold ${badgeClass(
                              log.action
                            )}`}
                          >
                            {log.action}
                          </span>
                        </td>
                        <td className="whitespace-nowrap px-4 py-3 font-semibold text-cyan-200">
                          {log.module}
                        </td>
                        <td className="px-4 py-3 text-slate-200 max-w-md">
                          {log.detail}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        );
      })()}

      {/* MODAL: Confirmación Segura de Eliminación de Atleta */}
      {deleteConfirmAth && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 p-4 backdrop-blur-sm">
          <form
            onSubmit={handleConfirmDeleteAthleteUser}
            className="w-full max-w-md rounded-2xl border border-rose-500/45 bg-[#0D1322] p-6 space-y-4 shadow-2xl"
          >
            <div className="flex items-start gap-3">
              <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-rose-500/20 text-rose-300 text-lg font-black">
                !
              </div>
              <div>
                <h3 className="text-base font-extrabold text-white">
                  {t(
                    "¿Eliminar por completo al atleta?",
                    "Permanently delete this athlete?"
                  )}
                </h3>
                <p className="mt-1 text-xs text-slate-300 leading-relaxed">
                  {t(
                    `Esta acción eliminará de forma permanente a ${deleteConfirmAth.fullName} (${deleteConfirmAth.athleteId}), incluyendo su usuario, perfil, pagos, solicitudes, asistencias y postulación.`,
                    `This will permanently delete ${deleteConfirmAth.fullName} (${deleteConfirmAth.athleteId}), including user account, profile, payments, requests, attendance and application.`
                  )}
                </p>
              </div>
            </div>

            <div className="rounded-xl border border-white/10 bg-[#070B14] p-3 text-xs text-slate-300">
              <p>
                {t("Autorizando como:", "Authorizing as:")}{" "}
                <strong className="text-white">
                  {currentUser?.fullName ?? "Administrador"} (@
                  {currentUser?.username ?? "admin"})
                </strong>
              </p>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-200 mb-1.5">
                {t(
                  "Ingresa la clave de tu perfil para autorizar la eliminación *",
                  "Enter your profile password to authorize deletion *"
                )}
              </label>
              <input
                type="password"
                required
                autoFocus
                value={deleteAuthPassword}
                onChange={(e) => {
                  setDeleteAuthPassword(e.target.value);
                  setDeleteAuthError(null);
                }}
                placeholder="••••••••"
                className="w-full rounded-xl border border-white/15 bg-[#070B14] px-3.5 py-2.5 text-sm text-white focus:border-rose-400 focus:outline-none"
              />
            </div>

            {deleteAuthError && (
              <div className="rounded-xl border border-rose-500/40 bg-rose-500/15 p-3 text-xs font-semibold text-rose-200">
                {deleteAuthError}
              </div>
            )}

            <div className="flex justify-end gap-2 pt-2">
              <button
                type="button"
                onClick={() => {
                  setDeleteConfirmAth(null);
                  setDeleteAuthPassword("");
                  setDeleteAuthError(null);
                }}
                className="rounded-xl border border-white/15 px-4 py-2 text-xs font-semibold text-slate-300 hover:bg-white/5 cursor-pointer"
              >
                {t("Cancelar", "Cancel")}
              </button>
              <button
                type="submit"
                className="rounded-xl bg-rose-600 px-4 py-2 text-xs font-bold text-white hover:bg-rose-500 cursor-pointer"
              >
                {t("Autorizar y Eliminar Todo", "Authorize & Delete All")}
              </button>
            </div>
          </form>
        </div>
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
                Grupo / Sede asignada *
              </label>
              <select
                value={citaCategory}
                onChange={(e) => setCitaCategory(e.target.value)}
                className="mt-1.5 w-full rounded-xl border border-white/15 bg-[#070B14] px-3 py-2.5 text-sm text-white"
              >
                {CHEER_CATEGORIES.map((cat) => (
                  <option key={cat} value={cat}>
                    {cat}
                  </option>
                ))}
              </select>
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
              Determina el grupo final. Al formalizar, se creará
              el perfil del atleta con su ID único, usuario (inicial + apellido)
              y clave provisional <strong className="text-amber-300">123456</strong>.
            </p>
            <div>
              <label className="block text-xs font-semibold text-slate-200">
                Grupo asignado *
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
