import Link from "next/link";
import { Navbar } from "@/components/Navbar";
import { Footer } from "@/components/Footer";
import { PhotoMarquee } from "@/components/PhotoMarquee";

const CHEER_TEAMS = [
  {
    name: "Tiny & Mini All Stars",
    slug: "mini",
    level: "Nivel 1 · Iniciación",
    description:
      "Bases de porrismo, coordinación rítmica, saltos básicos, flexibilidad y trabajo en equipo para los más pequeños.",
    badge: "Inscripciones Abiertas",
  },
  {
    name: "Youth Cheer",
    slug: "youth",
    level: "Nivel 1 – 2 · Formativo",
    description:
      "Desarrollo técnico en elevaciones (stunts), pirámides seguras y transiciones coreográficas.",
    badge: "Cupos Disponibles",
  },
  {
    name: "Junior All Stars",
    slug: "junior",
    level: "Nivel 2 – 3 · Competitivo",
    description:
      "Rutinas de alta energía, tumbling sincronizado, lanzamientos (baskets) y preparación para campeonatos.",
    badge: "Alta Demanda",
  },
  {
    name: "Senior All Girl",
    slug: "senior-all-girl",
    level: "Nivel 3 – 4 · Avanzado",
    description:
      "Equipo femenino de alto rendimiento enfocado en precisión, dificultad técnica y presencia escénica.",
    badge: "Selección Oficial",
  },
  {
    name: "Senior & Open Coed",
    slug: "coed",
    level: "Nivel 3 – 5 · Mixto",
    description:
      "Stunts mixtos de máxima potencia, pirámides complejas y acrobacia de élite para atletas experimentados.",
    badge: "Alto Rendimiento",
  },
  {
    name: "Academia de Tumbling & Stunts",
    slug: "tumbling",
    level: "Todos los Niveles",
    description:
      "Clases especializadas de gimnasia aplicada al cheerleading: rondadas, flic-flacs, mortales y técnica de vuelo.",
    badge: "Refuerzo Técnico",
  },
];

export default function HomePage() {
  return (
    <div className="flex min-h-screen flex-col">
      <Navbar />

      <main className="flex-1">
        {/* Hero Section */}
        <section
          id="inicio"
          className="relative overflow-hidden border-b border-white/10 pt-20 pb-20 sm:pt-28 sm:pb-28"
        >
          <div
            aria-hidden="true"
            className="pointer-events-none absolute inset-0 -z-10"
          >
            <div className="absolute -top-36 left-1/2 h-[480px] w-[820px] -translate-x-1/2 rounded-full bg-emerald-500/15 blur-[130px]" />
            <div className="absolute bottom-0 right-0 h-[320px] w-[420px] rounded-full bg-amber-500/10 blur-[120px]" />
          </div>

          <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
            <div className="mx-auto max-w-3xl text-center">
              <div className="mb-6 inline-flex items-center gap-2 rounded-full border border-emerald-500/30 bg-emerald-500/10 px-4 py-1.5 text-xs font-semibold uppercase tracking-wider text-emerald-300">
                <span className="h-2 w-2 rounded-full bg-emerald-400 animate-pulse" />
                Escuela Exclusiva de Porrismo & Cheerleading
              </div>

              <h1 className="text-4xl font-black tracking-tight text-white sm:text-6xl leading-[1.08]">
                SYNERGIA{" "}
                <span className="bg-gradient-to-r from-emerald-400 via-teal-300 to-amber-300 bg-clip-text text-transparent">
                  ALL STARS
                </span>
              </h1>

              <p className="mt-6 text-lg leading-relaxed text-slate-300 sm:text-xl">
                Formamos atletas de porrismo con disciplina, técnica y espíritu
                competitivo. Accede al sistema interno o inscríbete para formar
                parte de nuestros equipos All Star.
              </p>

              {/* Primary Action Buttons */}
              <div className="mt-10 flex flex-col items-center justify-center gap-4 sm:flex-row">
                <Link
                  href="/sistema"
                  className="inline-flex w-full sm:w-auto items-center justify-center gap-2.5 rounded-xl bg-emerald-500 px-7 py-4 text-base font-bold text-slate-950 shadow-xl shadow-emerald-500/25 hover:bg-emerald-400 hover:-translate-y-0.5 transition-all"
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
                      d="M15.75 9V5.25A2.25 2.25 0 0013.5 3h-6a2.25 2.25 0 00-2.25 2.25v13.5A2.25 2.25 0 007.5 21h6a2.25 2.25 0 002.25-2.25V15m3 0l3-3m0 0l-3-3m3 3H9"
                    />
                  </svg>
                  Ingresar al Sistema
                </Link>

                <Link
                  href="/inscripcion"
                  className="inline-flex w-full sm:w-auto items-center justify-center gap-2.5 rounded-xl border border-amber-400/40 bg-amber-400/10 px-7 py-4 text-base font-bold text-amber-300 hover:bg-amber-400/20 hover:border-amber-300 hover:-translate-y-0.5 transition-all"
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
                      d="M18 7.5v3m0 0v3m0-3h3m-3 0h-3m-2.25-4.125a3.375 3.375 0 11-6.75 0 3.375 3.375 0 016.75 0zM3 19.235v-.11a6.375 6.375 0 0112.75 0v.109A12.318 12.318 0 019.374 21c-2.331 0-4.512-.645-6.374-1.766z"
                    />
                  </svg>
                  Inscribirse a Equipos
                </Link>
              </div>
            </div>

            {/* Quick Stats Bar */}
            <div className="mx-auto mt-16 grid max-w-4xl grid-cols-2 gap-4 sm:grid-cols-4">
              {[
                { label: "Disciplina Única", value: "100% Cheer" },
                { label: "Divisiones", value: "Tiny a Open" },
                { label: "Posiciones", value: "Flyer · Base · Back" },
                { label: "Sistema Interno", value: "24/7 Online" },
              ].map((stat) => (
                <div
                  key={stat.label}
                  className="rounded-2xl border border-white/10 bg-white/[0.03] p-4 text-center backdrop-blur-sm"
                >
                  <div className="text-lg font-extrabold text-white sm:text-xl">
                    {stat.value}
                  </div>
                  <div className="mt-1 text-xs font-medium text-slate-400">
                    {stat.label}
                  </div>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* Cintillo Rotativo de Fotos */}
        <PhotoMarquee />

        {/* Equipos Cheerleading Section */}
        <section id="equipos" className="py-20 sm:py-24">
          <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
            <div className="flex flex-col justify-between gap-4 sm:flex-row sm:items-end">
              <div>
                <p className="text-xs font-bold uppercase tracking-[0.2em] text-emerald-400">
                  Programa All Star
                </p>
                <h2 className="mt-2 text-3xl font-extrabold tracking-tight text-white sm:text-4xl">
                  Equipos y Niveles de Porrismo
                </h2>
                <p className="mt-2 max-w-2xl text-slate-400">
                  En SYNERGIA ALL STARS nos dedicamos exclusivamente al
                  cheerleading. Elige tu categoría según edad y nivel técnico.
                </p>
              </div>
              <Link
                href="/inscripcion"
                className="text-sm font-semibold text-amber-300 hover:text-amber-200 transition-colors"
              >
                Ir al formulario de inscripción →
              </Link>
            </div>

            <div className="mt-12 grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
              {CHEER_TEAMS.map((team) => (
                <div
                  key={team.slug}
                  className="group flex flex-col justify-between rounded-2xl border border-white/10 bg-[#0D1322] p-6 transition-all hover:border-emerald-500/40 hover:bg-[#10182B]"
                >
                  <div>
                    <div className="flex items-center justify-between gap-2">
                      <h3 className="text-xl font-bold text-white group-hover:text-emerald-300 transition-colors">
                        {team.name}
                      </h3>
                      <span className="rounded-full bg-emerald-500/10 px-2.5 py-1 text-[11px] font-semibold text-emerald-300 border border-emerald-500/20">
                        {team.badge}
                      </span>
                    </div>
                    <p className="mt-2 text-xs font-medium text-amber-300/90">
                      {team.level}
                    </p>
                    <p className="mt-3 text-sm leading-relaxed text-slate-400">
                      {team.description}
                    </p>
                  </div>

                  <div className="mt-6 pt-4 border-t border-white/5">
                    <Link
                      href={`/inscripcion?categoria=${team.slug}`}
                      className="inline-flex items-center gap-1.5 text-sm font-semibold text-emerald-400 hover:text-emerald-300"
                    >
                      Postular a {team.name}
                      <span aria-hidden="true">→</span>
                    </Link>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* Dual Portal Section */}
        <section
          id="acceso-rapido"
          className="border-t border-white/10 bg-[#0A0F1C] py-20"
        >
          <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
            <div className="grid gap-8 md:grid-cols-2">
              <div className="rounded-3xl border border-emerald-500/25 bg-gradient-to-br from-emerald-500/10 to-transparent p-8">
                <span className="inline-block rounded-lg bg-emerald-500/20 px-3 py-1 text-xs font-bold uppercase tracking-wider text-emerald-300">
                  Gestión Interna
                </span>
                <h3 className="mt-4 text-2xl font-bold text-white">
                  Sistema SYNERGIA ALL STARS
                </h3>
                <p className="mt-3 text-slate-300 leading-relaxed">
                  Acceso exclusivo para directivos, coaches y coordinadores de
                  la escuela. Administra atletas, asistencias, niveles y
                  solicitudes de ingreso.
                </p>
                <div className="mt-6">
                  <Link
                    href="/sistema"
                    className="inline-flex items-center gap-2 rounded-xl bg-emerald-500 px-5 py-3 text-sm font-bold text-slate-950 hover:bg-emerald-400 transition-colors"
                  >
                    Ingresar al Sistema
                    <span aria-hidden="true">→</span>
                  </Link>
                </div>
              </div>

              <div className="rounded-3xl border border-amber-400/25 bg-gradient-to-br from-amber-400/10 to-transparent p-8">
                <span className="inline-block rounded-lg bg-amber-400/20 px-3 py-1 text-xs font-bold uppercase tracking-wider text-amber-300">
                  Portal de Atletas
                </span>
                <h3 className="mt-4 text-2xl font-bold text-white">
                  Inscripción a Equipos Cheer
                </h3>
                <p className="mt-3 text-slate-300 leading-relaxed">
                  ¿Quieres ser parte de SYNERGIA ALL STARS? Registra tus datos,
                  elige tu categoría y posición (Flyer, Base, Backspot o
                  Tumbling) para agendar tu evaluación.
                </p>
                <div className="mt-6">
                  <Link
                    href="/inscripcion"
                    className="inline-flex items-center gap-2 rounded-xl border border-amber-400/50 bg-amber-400/15 px-5 py-3 text-sm font-bold text-amber-200 hover:bg-amber-400/25 transition-colors"
                  >
                    Completar Inscripción
                    <span aria-hidden="true">→</span>
                  </Link>
                </div>
              </div>
            </div>
          </div>
        </section>
      </main>

      <Footer />
    </div>
  );
}
