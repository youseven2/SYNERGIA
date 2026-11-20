"use client";

import Link from "next/link";
import { Navbar } from "@/components/Navbar";
import { Footer } from "@/components/Footer";
import { PhotoMarquee } from "@/components/PhotoMarquee";
import { useI18n } from "@/components/I18nContext";
import { useDevice } from "@/components/DeviceContext";

const CHEER_TEAMS = [
  {
    name: "Tiny & Mini All Stars",
    slug: "mini",
    levelEs: "Nivel 1 · Iniciación",
    levelEn: "Level 1 · Beginner",
    descriptionEs:
      "Bases de porrismo, coordinación rítmica, saltos básicos, flexibilidad y trabajo en equipo para los más pequeños.",
    descriptionEn:
      "Cheerleading fundamentals, rhythmic coordination, basic jumps, flexibility and teamwork for our youngest athletes.",
    badgeEs: "Inscripciones Abiertas",
    badgeEn: "Open Registration",
  },
  {
    name: "Youth Cheer",
    slug: "youth",
    levelEs: "Nivel 1 – 2 · Formativo",
    levelEn: "Level 1 – 2 · Formative",
    descriptionEs:
      "Desarrollo técnico en elevaciones (stunts), pirámides seguras y transiciones coreográficas.",
    descriptionEn:
      "Technical development in stunts, safe pyramids and choreographic transitions.",
    badgeEs: "Cupos Disponibles",
    badgeEn: "Spots Available",
  },
  {
    name: "Junior All Stars",
    slug: "junior",
    levelEs: "Nivel 2 – 3 · Competitivo",
    levelEn: "Level 2 – 3 · Competitive",
    descriptionEs:
      "Rutinas de alta energía, tumbling sincronizado, lanzamientos (baskets) y preparación para campeonatos.",
    descriptionEn:
      "High-energy routines, synchronized tumbling, basket tosses and championship preparation.",
    badgeEs: "Alta Demanda",
    badgeEn: "High Demand",
  },
  {
    name: "Senior All Girl",
    slug: "senior-all-girl",
    levelEs: "Nivel 3 – 4 · Avanzado",
    levelEn: "Level 3 – 4 · Advanced",
    descriptionEs:
      "Equipo femenino de alto rendimiento enfocado en precisión, dificultad técnica y presencia escénica.",
    descriptionEn:
      "High-performance all-girl team focused on precision, technical difficulty and stage presence.",
    badgeEs: "Selección Oficial",
    badgeEn: "Official Roster",
  },
  {
    name: "Senior & Open Coed",
    slug: "coed",
    levelEs: "Nivel 3 – 5 · Mixto",
    levelEn: "Level 3 – 5 · Coed",
    descriptionEs:
      "Stunts mixtos de máxima potencia, pirámides complejas y acrobacia de élite para atletas experimentados.",
    descriptionEn:
      "Maximum power coed stunts, complex pyramids and elite acrobatics for experienced athletes.",
    badgeEs: "Alto Rendimiento",
    badgeEn: "Elite Performance",
  },
  {
    name: "Academia de Tumbling & Stunts",
    slug: "tumbling",
    levelEs: "Todos los Niveles",
    levelEn: "All Levels",
    descriptionEs:
      "Clases especializadas de gimnasia aplicada al cheerleading: rondadas, flic-flacs, mortales y técnica de vuelo.",
    descriptionEn:
      "Specialized gymnastics classes for cheerleading: round-offs, back handsprings, tucks and flying technique.",
    badgeEs: "Refuerzo Técnico",
    badgeEn: "Technical Boost",
  },
];

export default function HomePage() {
  const { lang, t } = useI18n();
  const { isMobile, isTablet } = useDevice();

  return (
    <div className="flex min-h-screen flex-col">
      <Navbar />

      <main className="flex-1">
        {/* Hero Section */}
        <section
          id="inicio"
          className={`relative overflow-hidden border-b border-white/10 ${
            isMobile ? "pt-12 pb-14" : isTablet ? "pt-16 pb-20" : "pt-24 pb-28"
          }`}
        >
          <div
            aria-hidden="true"
            className="pointer-events-none absolute inset-0 -z-10"
          >
            <div className="absolute -top-36 left-1/2 h-[480px] w-[820px] -translate-x-1/2 rounded-full bg-[#00B7A4]/15 blur-[130px]" />
            <div className="absolute top-12 left-1/4 h-[320px] w-[420px] rounded-full bg-[#7E3D97]/25 blur-[130px]" />
            <div className="absolute bottom-0 right-0 h-[320px] w-[420px] rounded-full bg-[#7E3D97]/20 blur-[120px]" />
          </div>

          <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
            <div className="mx-auto max-w-3xl text-center">
              <div className="mb-6 inline-flex items-center gap-2 rounded-full border border-[#9D5BB8]/45 bg-[#7E3D97]/20 px-4 py-1.5 text-xs font-semibold uppercase tracking-wider text-purple-200">
                <span className="h-2 w-2 rounded-full bg-[#00B7A4] animate-pulse" />
                {t(
                  "Escuela Exclusiva de Porrismo",
                  "Exclusive Cheerleading Academy"
                )}
              </div>

              <h1 className="sr-only">SYNERGIA ALL STARS</h1>
              <div className="mx-auto flex justify-center">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src="/synergia-logo.svg"
                  alt="SYNERGIA ALL STARS"
                  className="w-full max-w-[260px] sm:max-w-[380px] md:max-w-[460px] lg:max-w-[520px] h-auto object-contain drop-shadow-[0_14px_36px_rgba(126,61,151,0.32)]"
                />
              </div>

              <p className="mt-5 text-base leading-relaxed text-slate-300 sm:text-lg lg:text-xl">
                {t(
                  "Formamos atletas de porrismo con disciplina, técnica y espíritu competitivo. Accede al sistema interno o inscríbete para formar parte de nuestros equipos All Star.",
                  "We train cheerleading athletes with discipline, technique and competitive spirit. Access the internal system or register to join our All Star teams."
                )}
              </p>

              {/* Botones principales junto al logo central */}
              <div className="mt-8 sm:mt-10 flex flex-col items-center justify-center gap-3.5 sm:flex-row sm:gap-4">
                <Link
                  href="/inscripcion"
                  className="inline-flex w-full sm:w-auto items-center justify-center gap-2.5 rounded-xl border border-[#9D5BB8]/60 bg-[#7E3D97] px-7 py-3.5 sm:py-4 text-sm sm:text-base font-bold text-white shadow-xl shadow-[#7E3D97]/30 hover:bg-[#914BAE] hover:-translate-y-0.5 transition-all"
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
                  {t("INSCRIBETE", "REGISTER NOW")}
                </Link>

                <Link
                  href="/sistema"
                  className="inline-flex w-full sm:w-auto items-center justify-center gap-2.5 rounded-xl bg-[#00B7A4] px-7 py-3.5 sm:py-4 text-sm sm:text-base font-bold text-slate-950 shadow-xl shadow-[#00B7A4]/25 hover:bg-[#14CEBA] hover:-translate-y-0.5 transition-all"
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
                  {t("Ingresar al Sistema", "System Login")}
                </Link>
              </div>
            </div>

            {/* Quick Stats Bar */}
            <div className="mx-auto mt-12 sm:mt-16 grid max-w-4xl grid-cols-2 gap-3 sm:gap-4 sm:grid-cols-4">
              {[
                {
                  label: t("Disciplina Única", "Single Discipline"),
                  value: "100% Cheer",
                },
                {
                  label: t("Divisiones", "Divisions"),
                  value: t("Tiny a Open", "Tiny to Open"),
                },
                {
                  label: t("Posiciones", "Positions"),
                  value: "Flyer · Base · Back",
                },
                {
                  label: t("Sistema Interno", "Internal System"),
                  value: "24/7 Online",
                },
              ].map((stat, idx) => (
                <div
                  key={stat.label}
                  className={`rounded-2xl border bg-white/[0.03] p-3.5 sm:p-4 text-center backdrop-blur-sm ${
                    idx % 2 === 0
                      ? "border-[#00B7A4]/25"
                      : "border-[#7E3D97]/35"
                  }`}
                >
                  <div className="text-base font-extrabold text-white sm:text-xl">
                    {stat.value}
                  </div>
                  <div className="mt-1 text-[11px] sm:text-xs font-medium text-slate-400">
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
        <section id="equipos" className="py-16 sm:py-24">
          <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
            <div className="flex flex-col justify-between gap-4 sm:flex-row sm:items-end">
              <div>
                <p className="text-xs font-bold uppercase tracking-[0.2em] text-[#9D5BB8]">
                  {t("Programa All Star", "All Star Program")}
                </p>
                <h2 className="mt-2 text-2xl font-extrabold tracking-tight text-white sm:text-4xl">
                  {t(
                    "Equipos y Niveles de Porrismo",
                    "Cheerleading Teams & Levels"
                  )}
                </h2>
                <p className="mt-2 max-w-2xl text-sm sm:text-base text-slate-400">
                  {t(
                    "En SYNERGIA ALL STARS nos dedicamos exclusivamente al cheerleading. Elige tu categoría según edad y nivel técnico.",
                    "At SYNERGIA ALL STARS we are dedicated exclusively to cheerleading. Choose your category by age and technical level."
                  )}
                </p>
              </div>
              <Link
                href="/inscripcion"
                className="text-sm font-semibold text-amber-300 hover:text-amber-200 transition-colors"
              >
                {t(
                  "Ir al formulario de inscripción →",
                  "Go to registration form →"
                )}
              </Link>
            </div>

            <div className="mt-10 sm:mt-12 grid gap-5 sm:gap-6 sm:grid-cols-2 lg:grid-cols-3">
              {CHEER_TEAMS.map((team, idx) => (
                <div
                  key={team.slug}
                  className={`group flex flex-col justify-between rounded-2xl border border-white/10 bg-[#0D1322] p-5 sm:p-6 transition-all hover:bg-[#10182B] ${
                    idx % 2 === 0
                      ? "hover:border-[#00B7A4]/50"
                      : "hover:border-[#9D5BB8]/55"
                  }`}
                >
                  <div>
                    <div className="flex items-center justify-between gap-2">
                      <h3 className="text-lg sm:text-xl font-bold text-white group-hover:text-[#00B7A4] transition-colors">
                        {team.name}
                      </h3>
                      <span
                        className={`shrink-0 rounded-full px-2.5 py-1 text-[10px] sm:text-[11px] font-semibold border ${
                          idx % 2 === 0
                            ? "bg-[#00B7A4]/10 text-[#4CE4D4] border-[#00B7A4]/25"
                            : "bg-[#7E3D97]/20 text-purple-200 border-[#9D5BB8]/35"
                        }`}
                      >
                        {lang === "en" ? team.badgeEn : team.badgeEs}
                      </span>
                    </div>
                    <p className="mt-2 text-xs font-medium text-amber-300/90">
                      {lang === "en" ? team.levelEn : team.levelEs}
                    </p>
                    <p className="mt-3 text-sm leading-relaxed text-slate-400">
                      {lang === "en" ? team.descriptionEn : team.descriptionEs}
                    </p>
                  </div>

                  <div className="mt-6 pt-4 border-t border-white/5">
                    <Link
                      href={`/inscripcion?categoria=${team.slug}`}
                      className="inline-flex items-center gap-1.5 text-sm font-semibold text-emerald-400 hover:text-emerald-300"
                    >
                      {t(`Postular a ${team.name}`, `Apply for ${team.name}`)}
                      <span aria-hidden="true">→</span>
                    </Link>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </section>
      </main>

      <Footer />
    </div>
  );
}
