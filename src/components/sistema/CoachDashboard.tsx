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
  SynergiaState,
  generateAthleteId,
  generateAthleteUsername,
  saveSynergiaState,
} from "@/lib/synergia-store";
import { generateEvaluationPdf } from "@/lib/pdf-report";
import { AthleteCarnet } from "@/components/AthleteCarnet";

type CoachTab = "inscripcion" | "formularios" | "evaluacion" | "perfil";

interface CoachDashboardProps {
  state: SynergiaState;
  onStateChange: (next: SynergiaState) => void;
  onLogout: () => void;
}

export function CoachDashboard({
  state,
  onStateChange,
  onLogout,
}: CoachDashboardProps) {
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

  return (
    <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8 space-y-6">
      {/* Top Bar */}
      <div className="flex flex-col gap-4 rounded-2xl border border-white/10 bg-[#0D1322] p-5 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <span className="text-[11px] font-bold uppercase tracking-[0.2em] text-emerald-400">
            Panel de Entrenador · SYNERGIA ALL STARS
          </span>
          <h1 className="mt-1 text-2xl font-extrabold text-white">
            Sistema de Gestión Deportiva
          </h1>
        </div>

        <div className="flex flex-wrap items-center gap-3">
          {newApplicantsCount > 0 && (
            <button
              type="button"
              onClick={() => setActiveTab("inscripcion")}
              className="inline-flex items-center gap-2 rounded-xl border border-amber-400/40 bg-amber-400/15 px-3.5 py-2 text-xs font-bold text-amber-200 animate-pulse cursor-pointer"
            >
              <span className="h-2 w-2 rounded-full bg-amber-400" />
              Aviso: {newApplicantsCount} aspirante(s) nuevo(s)
            </button>
          )}
          <button
            type="button"
            onClick={onLogout}
            className="rounded-xl border border-white/15 px-4 py-2 text-xs font-semibold text-slate-300 hover:bg-white/5 hover:text-white transition-colors cursor-pointer"
          >
            Cerrar Sesión
          </button>
        </div>
      </div>

      {/* Navigation Tabs */}
      <div className="flex flex-wrap gap-2 border-b border-white/10 pb-3">
        {(
          [
            {
              key: "inscripcion",
              label: "INSCRIPCION",
              badge: newApplicantsCount,
            },
            {
              key: "formularios",
              label: "Formularios",
              badge: state.forms.length,
            },
            {
              key: "evaluacion",
              label: "Evaluación y PDF",
              badge: 0,
            },
            {
              key: "perfil",
              label: "Perfil del Atleta",
              badge: state.athletes.length,
            },
          ] as const
        ).map((tab) => (
          <button
            key={tab.key}
            type="button"
            onClick={() => setActiveTab(tab.key)}
            className={`inline-flex items-center gap-2 rounded-xl px-4 py-2.5 text-sm font-bold transition-all cursor-pointer ${
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
