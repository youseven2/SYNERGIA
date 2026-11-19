"use client";

import { useSearchParams } from "next/navigation";
import { useState, FormEvent, useMemo } from "react";
import Link from "next/link";

const CHEER_CATEGORIES = [
  { value: "mini", label: "Tiny & Mini All Stars (Nivel 1)" },
  { value: "youth", label: "Youth Cheer (Nivel 1 – 2)" },
  { value: "junior", label: "Junior All Stars (Nivel 2 – 3)" },
  { value: "senior-all-girl", label: "Senior All Girl (Nivel 3 – 4)" },
  { value: "coed", label: "Senior & Open Coed (Nivel 3 – 5)" },
  { value: "tumbling", label: "Academia de Tumbling & Stunts" },
];

const CHEER_POSITIONS = [
  "Flyer (Aérea)",
  "Base",
  "Backspot / Spotter",
  "Frontspot",
  "Tumbling / Gimnasia",
  "Sin experiencia (evaluación inicial)",
];

const RELATIONSHIPS = ["Madre", "Padre", "Tutor Legal", "Familiar Autorizado"];

function calculateAge(birthDateStr: string): number | null {
  if (!birthDateStr) return null;
  const birth = new Date(`${birthDateStr}T00:00:00`);
  if (Number.isNaN(birth.getTime())) return null;

  const today = new Date();
  let age = today.getFullYear() - birth.getFullYear();
  const monthDiff = today.getMonth() - birth.getMonth();
  if (
    monthDiff < 0 ||
    (monthDiff === 0 && today.getDate() < birth.getDate())
  ) {
    age--;
  }
  return age >= 0 ? age : null;
}

export function InscripcionForm() {
  const searchParams = useSearchParams();
  const initialCategory = searchParams.get("categoria") ?? "junior";

  // Fecha de nacimiento primero para determinar flujo por edad
  const [birthDate, setBirthDate] = useState("");
  const age = useMemo(() => calculateAge(birthDate), [birthDate]);
  const isMinor = age !== null && age < 18;
  const isUnderNine = age !== null && age < 9;

  // Datos del representante (requerido si edad < 18)
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
  const [category, setCategory] = useState(
    CHEER_CATEGORIES.some((c) => c.value === initialCategory)
      ? initialCategory
      : "junior"
  );
  const [position, setPosition] = useState(CHEER_POSITIONS[0]);
  const [notes, setNotes] = useState("");
  const [submittedCode, setSubmittedCode] = useState<string | null>(null);

  // Si es menor de 9 años, usa automáticamente la cédula del representante
  const effectiveAthleteDocumentId = isUnderNine ? repDocumentId : documentId;

  function handleSubmit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const randomCode = `SAS-${Math.floor(100000 + Math.random() * 900000)}`;
    setSubmittedCode(randomCode);
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
    const selectedCategoryLabel =
      CHEER_CATEGORIES.find((c) => c.value === category)?.label ?? category;

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
          ¡Pre-inscripción Registrada!
        </h2>
        <p className="mt-2 text-sm text-slate-300">
          Hemos recibido la solicitud para{" "}
          <strong className="text-emerald-300">SYNERGIA ALL STARS</strong> en la
          categoría{" "}
          <strong className="text-amber-300">{selectedCategoryLabel}</strong>.
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
            <span className="text-slate-400">Posición:</span>
            <span className="text-slate-200">{position}</span>
          </div>
        </div>

        <div className="mt-8 flex flex-col sm:flex-row items-center justify-center gap-3">
          <button
            type="button"
            onClick={resetForm}
            className="w-full sm:w-auto rounded-xl border border-white/15 px-5 py-2.5 text-sm font-semibold text-slate-200 hover:bg-white/5 transition-colors cursor-pointer"
          >
            Registrar otro atleta
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
      {/* Paso 1: Fecha de nacimiento para validar edad */}
      <div className="rounded-2xl border border-white/10 bg-[#070B14]/70 p-5">
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
                ? "Menor de 9 años (inscribe representante, usa su cédula)"
                : isMinor
                ? "Menor de 18 años (inscribe representante)"
                : "Mayor de edad"}
            </span>
          )}
        </div>

        <input
          id="birthDate"
          type="date"
          required
          value={birthDate}
          onChange={(e) => setBirthDate(e.target.value)}
          className="mt-2.5 w-full rounded-xl border border-white/15 bg-[#070B14] px-4 py-3 text-sm text-white focus:border-emerald-400 focus:outline-none"
        />
        <p className="mt-2 text-xs text-slate-400">
          Si el atleta es menor de 18 años, el representante debe completar sus
          datos primero.
        </p>
      </div>

      {/* Sección del Representante (solo si edad < 18, aparece PRIMERO) */}
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
              Paso 2 · Datos deportivos y personales
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

          <div>
            <label
              htmlFor="category"
              className="block text-sm font-semibold text-slate-200"
            >
              Equipo / Categoría de Porrismo *
            </label>
            <select
              id="category"
              value={category}
              onChange={(e) => setCategory(e.target.value)}
              className="mt-1.5 w-full rounded-xl border border-white/15 bg-[#070B14] px-4 py-3 text-sm text-white focus:border-emerald-400 focus:outline-none"
            >
              {CHEER_CATEGORIES.map((c) => (
                <option key={c.value} value={c.value}>
                  {c.label}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label
              htmlFor="position"
              className="block text-sm font-semibold text-slate-200"
            >
              Posición en Porrismo *
            </label>
            <select
              id="position"
              value={position}
              onChange={(e) => setPosition(e.target.value)}
              className="mt-1.5 w-full rounded-xl border border-white/15 bg-[#070B14] px-4 py-3 text-sm text-white focus:border-emerald-400 focus:outline-none"
            >
              {CHEER_POSITIONS.map((p) => (
                <option key={p} value={p}>
                  {p}
                </option>
              ))}
            </select>
          </div>

          <div className="sm:col-span-2">
            <label
              htmlFor="notes"
              className="block text-sm font-semibold text-slate-200"
            >
              Experiencia en porrismo, gimnasia o danza (opcional)
            </label>
            <textarea
              id="notes"
              rows={3}
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="Cuéntanos tu nivel de tumbling, experiencia en stunts o si es tu primera vez..."
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
          Enviar Inscripción
        </button>
      </div>
    </form>
  );
}
