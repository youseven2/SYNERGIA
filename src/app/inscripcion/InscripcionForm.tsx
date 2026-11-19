"use client";

import { useSearchParams } from "next/navigation";
import { useState, FormEvent } from "react";
import Link from "next/link";

const DISCIPLINES = [
  { value: "futbol", label: "Fútbol" },
  { value: "baloncesto", label: "Baloncesto" },
  { value: "voleibol", label: "Voleibol" },
  { value: "atletismo", label: "Atletismo" },
  { value: "natacion", label: "Natación" },
  { value: "funcional", label: "Entrenamiento Funcional" },
];

const CATEGORIES = ["Sub-15", "Sub-18", "Sub-21", "Libre / Mayor"];

export function InscripcionForm() {
  const searchParams = useSearchParams();
  const initialSport = searchParams.get("disciplina") ?? "futbol";

  const [fullName, setFullName] = useState("");
  const [documentId, setDocumentId] = useState("");
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");
  const [birthDate, setBirthDate] = useState("");
  const [discipline, setDiscipline] = useState(
    DISCIPLINES.some((d) => d.value === initialSport) ? initialSport : "futbol"
  );
  const [category, setCategory] = useState("Sub-18");
  const [position, setPosition] = useState("");
  const [notes, setNotes] = useState("");
  const [submittedCode, setSubmittedCode] = useState<string | null>(null);

  function handleSubmit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const randomCode = `SYN-${Math.floor(100000 + Math.random() * 900000)}`;
    setSubmittedCode(randomCode);
  }

  if (submittedCode) {
    const selectedDiscipline =
      DISCIPLINES.find((d) => d.value === discipline)?.label ?? discipline;

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
          ¡Solicitud Registrada!
        </h2>
        <p className="mt-2 text-sm text-slate-300">
          Hemos recibido tu pre-inscripción para el equipo de{" "}
          <strong className="text-emerald-300">{selectedDiscipline}</strong> (
          {category}).
        </p>

        <div className="mt-6 rounded-2xl border border-white/10 bg-white/[0.03] p-4 text-left text-sm space-y-2">
          <div className="flex justify-between">
            <span className="text-slate-400">Código de seguimiento:</span>
            <span className="font-mono font-bold text-amber-300">
              {submittedCode}
            </span>
          </div>
          <div className="flex justify-between">
            <span className="text-slate-400">Atleta:</span>
            <span className="font-semibold text-white">{fullName}</span>
          </div>
          <div className="flex justify-between">
            <span className="text-slate-400">Correo:</span>
            <span className="text-slate-200">{email}</span>
          </div>
        </div>

        <div className="mt-8 flex flex-col sm:flex-row items-center justify-center gap-3">
          <button
            type="button"
            onClick={() => {
              setSubmittedCode(null);
              setFullName("");
              setDocumentId("");
              setEmail("");
              setPhone("");
              setBirthDate("");
              setPosition("");
              setNotes("");
            }}
            className="w-full sm:w-auto rounded-xl border border-white/15 px-5 py-2.5 text-sm font-semibold text-slate-200 hover:bg-white/5 transition-colors"
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
      className="mx-auto max-w-2xl rounded-3xl border border-white/10 bg-[#0D1322] p-6 sm:p-10 shadow-2xl space-y-6"
    >
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
            placeholder="Ej. Carlos Andrés Mendoza"
            className="mt-1.5 w-full rounded-xl border border-white/15 bg-[#070B14] px-4 py-3 text-sm text-white placeholder:text-slate-500 focus:border-emerald-400 focus:outline-none"
          />
        </div>

        <div>
          <label
            htmlFor="documentId"
            className="block text-sm font-semibold text-slate-200"
          >
            Cédula / Documento *
          </label>
          <input
            id="documentId"
            type="text"
            required
            value={documentId}
            onChange={(e) => setDocumentId(e.target.value)}
            placeholder="Ej. V-28450123"
            className="mt-1.5 w-full rounded-xl border border-white/15 bg-[#070B14] px-4 py-3 text-sm text-white placeholder:text-slate-500 focus:border-emerald-400 focus:outline-none"
          />
        </div>

        <div>
          <label
            htmlFor="birthDate"
            className="block text-sm font-semibold text-slate-200"
          >
            Fecha de nacimiento *
          </label>
          <input
            id="birthDate"
            type="date"
            required
            value={birthDate}
            onChange={(e) => setBirthDate(e.target.value)}
            className="mt-1.5 w-full rounded-xl border border-white/15 bg-[#070B14] px-4 py-3 text-sm text-white focus:border-emerald-400 focus:outline-none"
          />
        </div>

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

        <div>
          <label
            htmlFor="discipline"
            className="block text-sm font-semibold text-slate-200"
          >
            Disciplina deportiva *
          </label>
          <select
            id="discipline"
            value={discipline}
            onChange={(e) => setDiscipline(e.target.value)}
            className="mt-1.5 w-full rounded-xl border border-white/15 bg-[#070B14] px-4 py-3 text-sm text-white focus:border-emerald-400 focus:outline-none"
          >
            {DISCIPLINES.map((d) => (
              <option key={d.value} value={d.value}>
                {d.label}
              </option>
            ))}
          </select>
        </div>

        <div>
          <label
            htmlFor="category"
            className="block text-sm font-semibold text-slate-200"
          >
            Categoría *
          </label>
          <select
            id="category"
            value={category}
            onChange={(e) => setCategory(e.target.value)}
            className="mt-1.5 w-full rounded-xl border border-white/15 bg-[#070B14] px-4 py-3 text-sm text-white focus:border-emerald-400 focus:outline-none"
          >
            {CATEGORIES.map((c) => (
              <option key={c} value={c}>
                {c}
              </option>
            ))}
          </select>
        </div>

        <div className="sm:col-span-2">
          <label
            htmlFor="position"
            className="block text-sm font-semibold text-slate-200"
          >
            Posición o especialidad (opcional)
          </label>
          <input
            id="position"
            type="text"
            value={position}
            onChange={(e) => setPosition(e.target.value)}
            placeholder="Ej. Mediocampista, Base, 100m planos..."
            className="mt-1.5 w-full rounded-xl border border-white/15 bg-[#070B14] px-4 py-3 text-sm text-white placeholder:text-slate-500 focus:border-emerald-400 focus:outline-none"
          />
        </div>

        <div className="sm:col-span-2">
          <label
            htmlFor="notes"
            className="block text-sm font-semibold text-slate-200"
          >
            Experiencia previa o comentarios
          </label>
          <textarea
            id="notes"
            rows={3}
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
            placeholder="Cuéntanos sobre tus clubes anteriores, logros o disponibilidad..."
            className="mt-1.5 w-full rounded-xl border border-white/15 bg-[#070B14] px-4 py-3 text-sm text-white placeholder:text-slate-500 focus:border-emerald-400 focus:outline-none"
          />
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
