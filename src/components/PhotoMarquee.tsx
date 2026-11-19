"use client";

import { useState } from "react";
import { useI18n } from "@/components/I18nContext";

interface GalleryItem {
  id: string;
  titleEs: string;
  titleEn: string;
  subtitleEs: string;
  subtitleEn: string;
  tagEs: string;
  tagEn: string;
  accent: string;
  imageUrl?: string;
}

const GALLERY_ITEMS: GalleryItem[] = [
  {
    id: "stunts",
    titleEs: "Elevaciones y Stunts",
    titleEn: "Lifts & Stunts",
    subtitleEs: "Sincronización, fuerza y confianza en cada rutina All Star.",
    subtitleEn: "Synchronization, strength and trust in every All Star routine.",
    tagEs: "Stunts",
    tagEn: "Stunts",
    accent: "from-emerald-500/30 via-teal-500/15 to-[#0D1322]",
  },
  {
    id: "tumbling",
    titleEs: "Tumbling y Acrobacia",
    titleEn: "Tumbling & Acrobatics",
    subtitleEs: "Técnica progresiva en piso para saltos y giros limpios.",
    subtitleEn: "Progressive floor technique for clean jumps and twists.",
    tagEs: "Tumbling",
    tagEn: "Tumbling",
    accent: "from-amber-500/30 via-orange-500/15 to-[#0D1322]",
  },
  {
    id: "pyramids",
    titleEs: "Pirámides de Alto Impacto",
    titleEn: "High-Impact Pyramids",
    subtitleEs: "Trabajo en equipo entre flyers, bases y backspots.",
    subtitleEn: "Teamwork between flyers, bases and backspots.",
    tagEs: "Pirámides",
    tagEn: "Pyramids",
    accent: "from-cyan-500/30 via-emerald-500/15 to-[#0D1322]",
  },
  {
    id: "nationals",
    titleEs: "Competencias All Star",
    titleEn: "All Star Competitions",
    subtitleEs: "Representando a SYNERGIA ALL STARS en tarima nacional.",
    subtitleEn: "Representing SYNERGIA ALL STARS on the national stage.",
    tagEs: "Competencia",
    tagEn: "Competition",
    accent: "from-fuchsia-500/25 via-emerald-500/15 to-[#0D1322]",
  },
  {
    id: "training",
    titleEs: "Entrenamiento Funcional Cheer",
    titleEn: "Functional Cheer Training",
    subtitleEs: "Flexibilidad, potencia explosiva y prevención de lesiones.",
    subtitleEn: "Flexibility, explosive power and injury prevention.",
    tagEs: "Preparación",
    tagEn: "Training",
    accent: "from-teal-500/30 via-amber-500/15 to-[#0D1322]",
  },
  {
    id: "team",
    titleEs: "Espíritu SYNERGIA",
    titleEn: "SYNERGIA Spirit",
    subtitleEs: "Disciplina, unión y pasión por el porrismo competitivo.",
    subtitleEn: "Discipline, unity and passion for competitive cheerleading.",
    tagEs: "Familia All Star",
    tagEn: "All Star Family",
    accent: "from-amber-400/30 via-emerald-500/15 to-[#0D1322]",
  },
];

type SpeedOption = "slow" | "normal" | "fast";

const SPEED_SECONDS: Record<SpeedOption, string> = {
  slow: "48s",
  normal: "30s",
  fast: "16s",
};

export function PhotoMarquee() {
  const [isPaused, setIsPaused] = useState(false);
  const [speed, setSpeed] = useState<SpeedOption>("normal");
  const { lang, t } = useI18n();

  const loopItems = [...GALLERY_ITEMS, ...GALLERY_ITEMS];

  return (
    <section
      id="galeria"
      className="border-b border-white/10 bg-[#090E1A] py-14 sm:py-16 overflow-hidden"
    >
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 mb-8">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
          <div>
            <p className="text-xs font-bold uppercase tracking-[0.2em] text-amber-300">
              {t("Galería en Movimiento", "Motion Gallery")}
            </p>
            <h2 className="mt-1.5 text-2xl font-extrabold tracking-tight text-white sm:text-3xl">
              {t("Momentos SYNERGIA ALL STARS", "SYNERGIA ALL STARS Moments")}
            </h2>
            <p className="mt-1 text-sm text-slate-400">
              {t(
                "Cintillo rotativo de fotos de entrenamientos, rutinas y competencias de porrismo.",
                "Rotating photo reel of cheerleading trainings, routines and competitions."
              )}
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-2 rounded-2xl border border-white/10 bg-[#0D1322] p-2 text-xs">
            <button
              type="button"
              onClick={() => setIsPaused((prev) => !prev)}
              className={`rounded-xl px-3 py-1.5 font-semibold transition-colors cursor-pointer ${
                isPaused
                  ? "bg-amber-400/20 text-amber-300 border border-amber-400/30"
                  : "bg-emerald-500/20 text-emerald-300 border border-emerald-500/30"
              }`}
            >
              {isPaused
                ? t("▶ Reanudar", "▶ Resume")
                : t("❚❚ Pausar", "❚❚ Pause")}
            </button>

            <span className="text-slate-600 px-1">|</span>

            <span className="text-slate-400 font-medium px-1">
              {t("Velocidad:", "Speed:")}
            </span>
            {(
              [
                { key: "slow", label: t("Lento", "Slow") },
                { key: "normal", label: t("Normal", "Normal") },
                { key: "fast", label: t("Rápido", "Fast") },
              ] as const
            ).map((opt) => (
              <button
                key={opt.key}
                type="button"
                onClick={() => setSpeed(opt.key)}
                className={`rounded-lg px-2.5 py-1.5 font-semibold transition-colors cursor-pointer ${
                  speed === opt.key
                    ? "bg-white/15 text-white"
                    : "text-slate-400 hover:text-white hover:bg-white/5"
                }`}
              >
                {opt.label}
              </button>
            ))}
          </div>
        </div>
      </div>

      <div className="marquee-wrapper relative w-full overflow-hidden">
        <div
          aria-hidden="true"
          className="pointer-events-none absolute inset-y-0 left-0 z-10 w-10 sm:w-24 bg-gradient-to-r from-[#090E1A] to-transparent"
        />
        <div
          aria-hidden="true"
          className="pointer-events-none absolute inset-y-0 right-0 z-10 w-10 sm:w-24 bg-gradient-to-l from-[#090E1A] to-transparent"
        />

        <div
          className={`animate-marquee gap-5 px-4 ${isPaused ? "paused" : ""}`}
          style={
            {
              "--marquee-duration": SPEED_SECONDS[speed],
            } as React.CSSProperties
          }
        >
          {loopItems.map((item, idx) => {
            const title = lang === "en" ? item.titleEn : item.titleEs;
            const subtitle = lang === "en" ? item.subtitleEn : item.subtitleEs;
            const tag = lang === "en" ? item.tagEn : item.tagEs;
            return (
              <article
                key={`${item.id}-${idx}`}
                className="group relative w-[250px] sm:w-[320px] md:w-[340px] shrink-0 overflow-hidden rounded-2xl border border-white/10 bg-[#0D1322] shadow-xl transition-transform duration-300 hover:-translate-y-1 hover:border-emerald-400/40"
              >
                <div
                  className={`relative h-44 sm:h-52 w-full bg-gradient-to-br ${item.accent} flex flex-col items-center justify-center p-6 text-center overflow-hidden`}
                >
                  {item.imageUrl ? (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img
                      src={item.imageUrl}
                      alt={title}
                      className="absolute inset-0 h-full w-full object-cover transition-transform duration-500 group-hover:scale-105"
                    />
                  ) : (
                    <>
                      <div className="flex h-14 w-14 items-center justify-center rounded-2xl border border-white/15 bg-white/10 text-2xl text-white backdrop-blur-sm">
                        ★
                      </div>
                      <span className="mt-3 text-[11px] font-semibold uppercase tracking-[0.2em] text-slate-300/80">
                        {t("Espacio para Foto", "Photo Space")}
                      </span>
                    </>
                  )}

                  <span className="absolute top-3 left-3 rounded-full border border-white/15 bg-[#070B14]/75 px-3 py-1 text-[11px] font-bold uppercase tracking-wider text-emerald-300 backdrop-blur-md">
                    {tag}
                  </span>
                </div>

                <div className="p-5">
                  <h3 className="text-base font-bold text-white group-hover:text-emerald-300 transition-colors">
                    {title}
                  </h3>
                  <p className="mt-1.5 text-xs leading-relaxed text-slate-400">
                    {subtitle}
                  </p>
                </div>
              </article>
            );
          })}
        </div>
      </div>
    </section>
  );
}
