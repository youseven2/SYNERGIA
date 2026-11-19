"use client";

import { useSearchParams } from "next/navigation";
import { useState, FormEvent } from "react";
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

export function InscripcionForm() {
  const searchParams = useSearchParams();
  const initialCategory = searchParams.get("categoria") ?? "junior";

  const [fullName, setFullName] = useState("");
  const [documentId, setDocumentId] = useState("");
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");
  const [birthDate, setBirthDate] = useState("");
  const [category, setCategory] = useState(
    CHEER_CATEGORIES.some((c) => c.value === initialCategory)
      ? initialCategory
      : "junior"
  );
  const [position, setPosition] = useState(CHEER_POSITIONS[0]);
  const [notes, setNotes] = useState("");
  const [submittedCode, setSubmittedCode] = useState<string | null>(null);

  function handleSubmit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const randomCode = `SAS-${Math.floor(100000 + Math.random() * 900000)}`;
    setSubmittedCode(randomCode);
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
          Hemos recibido tu solicitud para{" "}
          <strong className="text-emerald-300">SYNERGIA ALL STARS</strong> en la
          categoría{" "}
          <strong className="text-amber-300">{selectedCategoryLabel}</strong>.
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
            <span className="text-slate-400">Posición:</span>
            <span className="text-slate-200">{position}</span>
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
            placeholder="Ej. Valeria Sofía Mendoza"
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
            Posición en Cheerleading *
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
