"use client";

import { useState, FormEvent, useMemo } from "react";
import Link from "next/link";
import {
  calculateAge,
  loadSynergiaState,
  saveSynergiaState,
  RegistrationApplication,
} from "@/lib/synergia-store";

const RELATIONSHIPS = ["Madre", "Padre", "Tutor Legal", "Familiar Autorizado"];

export function InscripcionForm() {
  const [birthDate, setBirthDate] = useState("");

  const age = useMemo(() => calculateAge(birthDate), [birthDate]);
  const isMinor = age !== null && age < 18;
  const isUnderNine = age !== null && age < 9;

  // Datos del representante (si edad < 18)
  const [repName, setRepName] = useState("");
  const [repDocumentId, setRepDocumentId] = useState("");
  const [repRelationship, setRepRelationship] = useState(RELATIONSHIPS[0]);
  const [repPhone, setRepPhone] = useState("");
  const [repEmail, setRepEmail] = useState("");

  // Datos del atleta
  const [fullName, setFullName] = useState("");
  const [documentId, setDocumentId] = useState("");
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");
  const [notes, setNotes] = useState("");
  const [submittedCode, setSubmittedCode] = useState<string | null>(null);

  // Si es menor de 9 años, usa automáticamente la cédula del representante
  const effectiveAthleteDocumentId = isUnderNine ? repDocumentId : documentId;

  function handleSubmit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    if (age === null) return;

    const trackingCode = `SAS-${Math.floor(100000 + Math.random() * 900000)}`;
    const newApp: RegistrationApplication = {
      id: `app-${Date.now()}`,
      trackingCode,
      createdAt: new Date().toISOString(),
      birthDate,
      age,
      isMinor,
      isUnderNine,
      repName: isMinor ? repName.trim() : undefined,
      repDocumentId: isMinor ? repDocumentId.trim() : undefined,
      repRelationship: isMinor ? repRelationship : undefined,
      repPhone: isMinor ? repPhone.trim() : undefined,
      repEmail: isMinor ? repEmail.trim() : undefined,
      fullName: fullName.trim(),
      documentId: effectiveAthleteDocumentId.trim(),
      email: (isMinor ? repEmail : email).trim(),
      phone: (isMinor ? repPhone : phone).trim(),
      notes: notes.trim(),
      status: "nuevo",
    };

    const state = loadSynergiaState();
    saveSynergiaState({
      ...state,
      applications: [newApp, ...state.applications],
    });

    setSubmittedCode(trackingCode);
  }

  function resetForm() {
    setSubmittedCode(null);
    setBirthDate("");
    setRepName("");
    setRepDocumentId("");
    setRepPhone("");
    setRepEmail("");
    setFullName("");
    setDocumentId("");
    setEmail("");
    setPhone("");
    setNotes("");
  }

  if (submittedCode) {
    return (
      <div className="mx-auto max-w-xl rounded-3xl border border-emerald-500/30 bg-[#0D1424] p-8 text-center shadow-2xl">
        <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-emerald-500/20 text-emerald-400">
          <svg
            className="h-8 w-8"
            fill="none"
            viewBox="0 0 24 24"
            strokeWidth={2.2}
            stroke="currentColor"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              d="M4.5 12.75l6 6 9-13.5"
            />
          </svg>
        </div>

        <h2 className="mt-5 text-2xl font-extrabold text-white">
          ¡Solicitud Enviada al Sistema!
        </h2>
        <p className="mt-2 text-sm text-slate-300 leading-relaxed">
          Tu registro como aspirante en{" "}
          <strong className="text-emerald-300">SYNERGIA ALL STARS</strong> ha
          generado un aviso para el entrenador. Pronto se te asignará una{" "}
          <strong className="text-amber-300">cita de prueba</strong> para
          evaluar tu nivel y determinar tu categoría y posición.
        </p>

        <div className="mt-6 rounded-2xl border border-white/10 bg-white/[0.03] p-4 text-left text-sm space-y-2">
          <div className="flex justify-between gap-2">
            <span className="text-slate-400">Código de seguimiento:</span>
            <span className="font-mono font-bold text-amber-300">
              {submittedCode}
            </span>
          </div>
          {isMinor && (
            <>
              <div className="flex justify-between gap-2">
                <span className="text-slate-400">Representante:</span>
                <span className="font-semibold text-white">
                  {repName} ({repRelationship})
                </span>
              </div>
              <div className="flex justify-between gap-2">
                <span className="text-slate-400">Cédula Representante:</span>
                <span className="text-slate-200">{repDocumentId}</span>
              </div>
            </>
          )}
          <div className="flex justify-between gap-2">
            <span className="text-slate-400">Atleta:</span>
            <span className="font-semibold text-white">{fullName}</span>
          </div>
          <div className="flex justify-between gap-2">
            <span className="text-slate-400">Documento del Atleta:</span>
            <span className="text-slate-200">
              {effectiveAthleteDocumentId}
              {isUnderNine ? " (Cédula del representante)" : ""}
            </span>
          </div>
          <div className="flex justify-between gap-2">
            <span className="text-slate-400">Estado:</span>
            <span className="text-emerald-300 font-semibold">
              Esperando cita del entrenador
            </span>
          </div>
        </div>

        <div className="mt-8 flex flex-col sm:flex-row items-center justify-center gap-3">
          <button
            type="button"
            onClick={resetForm}
            className="w-full sm:w-auto rounded-xl border border-white/15 px-5 py-2.5 text-sm font-semibold text-slate-200 hover:bg-white/5 transition-colors cursor-pointer"
          >
            Registrar otro aspirante
          </button>
          <Link
            href="/"
            className="w-full sm:w-auto rounded-xl bg-emerald-500 px-5 py-2.5 text-sm font-bold text-slate-950 hover:bg-emerald-400 transition-colors"
          >
            Volver al inicio
          </Link>
        </div>
      </div>
    );
  }

  return (
    <form
      onSubmit={handleSubmit}
      className="mx-auto max-w-2xl rounded-3xl border border-white/10 bg-[#0D1322] p-6 sm:p-10 shadow-2xl space-y-8"
    >
      {/* Paso 1: Fecha de nacimiento con calendario y búsqueda rápida */}
      <div className="rounded-2xl border border-white/10 bg-[#070B14]/70 p-5 space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2">
          <label
            htmlFor="birthDate"
            className="block text-sm font-bold text-white"
          >
            Fecha de nacimiento del atleta *
          </label>
          {age !== null && (
            <span
              className={`inline-flex items-center rounded-full px-3 py-1 text-xs font-semibold ${
                isUnderNine
                  ? "bg-amber-400/15 text-amber-300 border border-amber-400/30"
                  : isMinor
                  ? "bg-emerald-500/15 text-emerald-300 border border-emerald-500/30"
                  : "bg-slate-700/50 text-slate-200 border border-white/10"
              }`}
            >
              Edad: {age} años ·{" "}
              {isUnderNine
                ? "Menor de 9 años (usa cédula del representante)"
                : isMinor
                ? "Menor de 18 años (inscribe representante)"
                : "Mayor de edad"}
            </span>
          )}
        </div>

        {/* Calendario */}
        <input
          id="birthDate"
          type="date"
          required
          value={birthDate}
          onChange={(e) => setBirthDate(e.target.value)}
          className="w-full rounded-xl border border-white/15 bg-[#070B14] px-4 py-3 text-sm text-white focus:border-emerald-400 focus:outline-none [color-scheme:dark]"
        />

        <p className="text-xs text-slate-400">
          La categoría y posición serán asignadas por el entrenador luego de
          realizar la prueba de evaluación.
        </p>
      </div>

      {/* Sección del Representante (si edad < 18, aparece PRIMERO) */}
      {isMinor && (
        <div className="space-y-5 rounded-2xl border border-emerald-500/30 bg-emerald-500/[0.04] p-5 sm:p-6">
          <div className="border-b border-emerald-500/20 pb-3">
            <span className="text-[11px] font-bold uppercase tracking-wider text-emerald-400">
              Paso 1 · Atleta menor de 18 años
            </span>
            <h2 className="mt-1 text-lg font-bold text-white">
              Datos del Representante Legal
            </h2>
          </div>

          <div className="grid gap-5 sm:grid-cols-2">
            <div className="sm:col-span-2">
              <label
                htmlFor="repName"
                className="block text-sm font-semibold text-slate-200"
              >
                Nombre completo del representante *
              </label>
              <input
                id="repName"
                type="text"
                required
                value={repName}
                onChange={(e) => setRepName(e.target.value)}
                placeholder="Ej. María Elena Rodríguez"
                className="mt-1.5 w-full rounded-xl border border-white/15 bg-[#070B14] px-4 py-3 text-sm text-white placeholder:text-slate-500 focus:border-emerald-400 focus:outline-none"
              />
            </div>

            <div>
              <label
                htmlFor="repDocumentId"
                className="block text-sm font-semibold text-slate-200"
              >
                Cédula del representante *
              </label>
              <input
                id="repDocumentId"
                type="text"
                required
                value={repDocumentId}
                onChange={(e) => setRepDocumentId(e.target.value)}
                placeholder="Ej. V-16450987"
                className="mt-1.5 w-full rounded-xl border border-white/15 bg-[#070B14] px-4 py-3 text-sm text-white placeholder:text-slate-500 focus:border-emerald-400 focus:outline-none"
              />
            </div>

            <div>
              <label
                htmlFor="repRelationship"
                className="block text-sm font-semibold text-slate-200"
              >
                Parentesco *
              </label>
              <select
                id="repRelationship"
                value={repRelationship}
                onChange={(e) => setRepRelationship(e.target.value)}
                className="mt-1.5 w-full rounded-xl border border-white/15 bg-[#070B14] px-4 py-3 text-sm text-white focus:border-emerald-400 focus:outline-none"
              >
                {RELATIONSHIPS.map((rel) => (
                  <option key={rel} value={rel}>
                    {rel}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label
                htmlFor="repPhone"
                className="block text-sm font-semibold text-slate-200"
              >
                Teléfono / WhatsApp del representante *
              </label>
              <input
                id="repPhone"
                type="tel"
                required
                value={repPhone}
                onChange={(e) => setRepPhone(e.target.value)}
                placeholder="+58 412 000 0000"
                className="mt-1.5 w-full rounded-xl border border-white/15 bg-[#070B14] px-4 py-3 text-sm text-white placeholder:text-slate-500 focus:border-emerald-400 focus:outline-none"
              />
            </div>

            <div>
              <label
                htmlFor="repEmail"
                className="block text-sm font-semibold text-slate-200"
              >
                Correo del representante *
              </label>
              <input
                id="repEmail"
                type="email"
                required
                value={repEmail}
                onChange={(e) => setRepEmail(e.target.value)}
                placeholder="representante@correo.com"
                className="mt-1.5 w-full rounded-xl border border-white/15 bg-[#070B14] px-4 py-3 text-sm text-white placeholder:text-slate-500 focus:border-emerald-400 focus:outline-none"
              />
            </div>
          </div>
        </div>
      )}

      {/* Sección Datos del Atleta */}
      <div className="space-y-5">
        {isMinor && (
          <div className="border-b border-white/10 pb-3">
            <span className="text-[11px] font-bold uppercase tracking-wider text-amber-300">
              Paso 2 · Datos del aspirante
            </span>
            <h2 className="mt-1 text-lg font-bold text-white">
              Datos del Atleta
            </h2>
          </div>
        )}

        <div className="grid gap-5 sm:grid-cols-2">
          <div className="sm:col-span-2">
            <label
              htmlFor="fullName"
              className="block text-sm font-semibold text-slate-200"
            >
              Nombre completo del atleta *
            </label>
            <input
              id="fullName"
              type="text"
              required
              value={fullName}
              onChange={(e) => setFullName(e.target.value)}
              placeholder="Ej. Valeria Sofía Mendoza"
              className="mt-1.5 w-full rounded-xl border border-white/15 bg-[#070B14] px-4 py-3 text-sm text-white placeholder:text-slate-500 focus:border-emerald-400 focus:outline-none"
            />
          </div>

          <div className="sm:col-span-2">
            <div className="flex flex-wrap items-center justify-between gap-2">
              <label
                htmlFor="documentId"
                className="block text-sm font-semibold text-slate-200"
              >
                Cédula / Documento del atleta *
              </label>
              {isUnderNine && (
                <span className="rounded-md bg-amber-400/15 px-2.5 py-0.5 text-[11px] font-semibold text-amber-300">
                  Menor de 9 años: usa cédula del representante
                </span>
              )}
            </div>
            <input
              id="documentId"
              type="text"
              required
              readOnly={isUnderNine}
              value={effectiveAthleteDocumentId}
              onChange={(e) => setDocumentId(e.target.value)}
              placeholder={
                isUnderNine
                  ? "Se llenará automáticamente con la cédula del representante"
                  : "Ej. V-28450123"
              }
              className={`mt-1.5 w-full rounded-xl border px-4 py-3 text-sm text-white placeholder:text-slate-500 focus:outline-none ${
                isUnderNine
                  ? "border-amber-400/40 bg-amber-400/5 text-amber-200 cursor-not-allowed"
                  : "border-white/15 bg-[#070B14] focus:border-emerald-400"
              }`}
            />
            <p className="mt-1.5 text-xs text-slate-400">
              {isUnderNine
                ? "Como el atleta es menor de 9 años y no posee cédula, se registra con el número del representante. Cuando cumpla 9 años y tenga cédula propia podrá modificarlo."
                : "Si el atleta cumplió 9 años o más y ya posee cédula, ingrésala o modifícala aquí."}
            </p>
          </div>

          {!isMinor && (
            <>
              <div>
                <label
                  htmlFor="email"
                  className="block text-sm font-semibold text-slate-200"
                >
                  Correo electrónico *
                </label>
                <input
                  id="email"
                  type="email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="atleta@correo.com"
                  className="mt-1.5 w-full rounded-xl border border-white/15 bg-[#070B14] px-4 py-3 text-sm text-white placeholder:text-slate-500 focus:border-emerald-400 focus:outline-none"
                />
              </div>

              <div>
                <label
                  htmlFor="phone"
                  className="block text-sm font-semibold text-slate-200"
                >
                  Teléfono / WhatsApp *
                </label>
                <input
                  id="phone"
                  type="tel"
                  required
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                  placeholder="+58 412 000 0000"
                  className="mt-1.5 w-full rounded-xl border border-white/15 bg-[#070B14] px-4 py-3 text-sm text-white placeholder:text-slate-500 focus:border-emerald-400 focus:outline-none"
                />
              </div>
            </>
          )}

          <div className="sm:col-span-2">
            <label
              htmlFor="notes"
              className="block text-sm font-semibold text-slate-200"
            >
              Experiencia previa en porrismo, gimnasia o danza (opcional)
            </label>
            <textarea
              id="notes"
              rows={3}
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="Cuéntanos si has practicado porrismo, gimnasia o si es tu primera vez..."
              className="mt-1.5 w-full rounded-xl border border-white/15 bg-[#070B14] px-4 py-3 text-sm text-white placeholder:text-slate-500 focus:border-emerald-400 focus:outline-none"
            />
          </div>
        </div>
      </div>

      <div className="flex flex-col-reverse sm:flex-row items-center justify-between gap-4 pt-2">
        <Link
          href="/"
          className="text-sm font-medium text-slate-400 hover:text-white transition-colors"
        >
          ← Volver a la página principal
        </Link>
        <button
          type="submit"
          className="w-full sm:w-auto rounded-xl bg-amber-400 px-7 py-3.5 text-sm font-bold text-slate-950 shadow-lg shadow-amber-400/20 hover:bg-amber-300 transition-all cursor-pointer"
        >
          Enviar Solicitud
        </button>
      </div>
    </form>
  );
}
