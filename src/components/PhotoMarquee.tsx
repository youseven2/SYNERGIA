"use client";

import { useCallback, useEffect, useRef, useState } from "react";
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
  imageUrl: string;
  objectPosClass?: string;
  fitClass?: string;
}

const GALLERY_ITEMS: GalleryItem[] = [
  {
    id: "stunts-1",
    titleEs: "Pirámides y Stunts de Alto Nivel",
    titleEn: "High-Level Pyramids & Stunts",
    subtitleEs: "Sincronización, fuerza y confianza en cada rutina All Star.",
    subtitleEn: "Synchronization, strength and trust in every All Star routine.",
    tagEs: "Stunts",
    tagEn: "Stunts",
    accent: "from-emerald-500/30 via-teal-500/15 to-[#0D1322]",
    imageUrl: "/gallery/galeria-1.jpg",
    objectPosClass: "object-[50%_15%]",
  },
  {
    id: "competencia-2",
    titleEs: "Presentación en Competencia",
    titleEn: "Competition Showcase",
    subtitleEs: "Elevaciones limpias y trabajo en equipo sobre el tabloncillo.",
    subtitleEn: "Clean stunts and teamwork on the competition floor.",
    tagEs: "Competencia",
    tagEn: "Competition",
    accent: "from-purple-500/30 via-teal-500/15 to-[#0D1322]",
    imageUrl: "/gallery/galeria-2.jpg",
    objectPosClass: "object-center",
  },
  {
    id: "equipo-3",
    titleEs: "Talento Juvenil SYNERGIA",
    titleEn: "SYNERGIA Youth Talent",
    subtitleEs: "Disciplina, técnica y pasión por el porrismo competitivo.",
    subtitleEn: "Discipline, technique and passion for competitive cheerleading.",
    tagEs: "Equipo",
    tagEn: "Team",
    accent: "from-cyan-500/30 via-emerald-500/15 to-[#0D1322]",
    imageUrl: "/gallery/galeria-3.jpg",
    objectPosClass: "object-[50%_68%]",
  },
  {
    id: "familia-4",
    titleEs: "Familia SYNERGIA ALL STARS",
    titleEn: "SYNERGIA ALL STARS Family",
    subtitleEs: "Atletas y entrenadores unidos en nuestra casa de entrenamiento.",
    subtitleEn: "Athletes and coaches united at our training headquarters.",
    tagEs: "Academia",
    tagEn: "Academy",
    accent: "from-fuchsia-500/25 via-emerald-500/15 to-[#0D1322]",
    imageUrl: "/gallery/galeria-4.jpg",
    objectPosClass: "object-[50%_62%]",
  },
  {
    id: "union-5",
    titleEs: "Unión y Espíritu All Star",
    titleEn: "All Star Unity & Spirit",
    subtitleEs: "Cada categoría creciendo junta en técnica y valores deportivos.",
    subtitleEn: "Every division growing together in technique and sportsmanship.",
    tagEs: "Familia All Star",
    tagEn: "All Star Family",
    accent: "from-teal-500/30 via-purple-500/15 to-[#0D1322]",
    imageUrl: "/gallery/galeria-5.jpg",
    objectPosClass: "object-[50%_62%]",
  },
  {
    id: "formacion-6",
    titleEs: "Formación Cheerleading",
    titleEn: "Cheerleading Training",
    subtitleEs: "Desarrollo técnico progresivo desde las categorías base.",
    subtitleEn: "Progressive technical development from foundational divisions.",
    tagEs: "Formación",
    tagEn: "Training",
    accent: "from-amber-400/30 via-emerald-500/15 to-[#0D1322]",
    imageUrl: "/gallery/galeria-6.jpg",
    objectPosClass: "object-[50%_62%]",
  },
  {
    id: "mini-stunts-7",
    titleEs: "Elevaciones Mini & Junior",
    titleEn: "Mini & Junior Stunts",
    subtitleEs: "Seguridad, altura y precisión en nuestras categorías formativas.",
    subtitleEn: "Safety, height and precision in our youth divisions.",
    tagEs: "Pirámides",
    tagEn: "Pyramids",
    accent: "from-purple-500/30 via-cyan-500/15 to-[#0D1322]",
    imageUrl: "/gallery/galeria-7.jpg",
    objectPosClass: "object-[50%_12%]",
  },
  {
    id: "campeones-8",
    titleEs: "Campeones en Tarima",
    titleEn: "Champions on Stage",
    subtitleEs: "Orgullo, medallas y trofeos conquistados en competencia.",
    subtitleEn: "Pride, medals and trophies earned in competition.",
    tagEs: "Campeones",
    tagEn: "Champions",
    accent: "from-amber-500/30 via-emerald-500/15 to-[#0D1322]",
    imageUrl: "/gallery/galeria-8.jpg",
    objectPosClass: "object-center",
  },
  {
    id: "medallistas-9",
    titleEs: "Medallistas SYNERGIA",
    titleEn: "SYNERGIA Medalists",
    subtitleEs: "Sonrisas y logros de nuestras futuras estrellas del cheer.",
    subtitleEn: "Smiles and achievements of our future cheer stars.",
    tagEs: "Podio",
    tagEn: "Podium",
    accent: "from-emerald-500/30 via-purple-500/15 to-[#0D1322]",
    imageUrl: "/gallery/galeria-9.jpg",
    objectPosClass: "object-center",
  },
];

type SpeedOption = "slow" | "normal" | "fast";

const SPEED_SECONDS: Record<SpeedOption, string> = {
  slow: "56s",
  normal: "36s",
  fast: "20s",
};

export function PhotoMarquee() {
  const [isPaused, setIsPaused] = useState(false);
  const [speed, setSpeed] = useState<SpeedOption>("slow");
  const [selectedIndex, setSelectedIndex] = useState<number | null>(null);
  const touchStartXRef = useRef<number | null>(null);
  const { lang, t } = useI18n();

  const totalPhotos = GALLERY_ITEMS.length;

  const goPrev = useCallback(() => {
    setSelectedIndex((prev) =>
      prev === null ? null : (prev - 1 + totalPhotos) % totalPhotos
    );
  }, [totalPhotos]);

  const goNext = useCallback(() => {
    setSelectedIndex((prev) =>
      prev === null ? null : (prev + 1) % totalPhotos
    );
  }, [totalPhotos]);

  useEffect(() => {
    if (selectedIndex === null) return;
    function handleKeyDown(e: KeyboardEvent) {
      if (e.key === "Escape") setSelectedIndex(null);
      else if (e.key === "ArrowLeft") goPrev();
      else if (e.key === "ArrowRight") goNext();
    }
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [selectedIndex, goPrev, goNext]);

  const loopItems = [...GALLERY_ITEMS, ...GALLERY_ITEMS];
  const activePhoto =
    selectedIndex !== null ? GALLERY_ITEMS[selectedIndex] : null;

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
            const realIndex = idx % totalPhotos;
            return (
              <article
                key={`${item.id}-${idx}`}
                onClick={() => setSelectedIndex(realIndex)}
                role="button"
                tabIndex={0}
                onKeyDown={(e) => {
                  if (e.key === "Enter" || e.key === " ") {
                    e.preventDefault();
                    setSelectedIndex(realIndex);
                  }
                }}
                className="group relative w-[250px] sm:w-[320px] md:w-[340px] shrink-0 overflow-hidden rounded-2xl border border-white/10 bg-[#0D1322] shadow-xl transition-transform duration-300 hover:-translate-y-1 hover:border-emerald-400/50 cursor-pointer"
              >
                <div
                  className={`relative h-52 sm:h-60 w-full bg-gradient-to-br ${item.accent} flex flex-col items-center justify-center overflow-hidden`}
                >
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img
                    src={item.imageUrl}
                    alt={title}
                    className={`h-full w-full ${
                      item.fitClass ?? "object-cover"
                    } ${
                      item.objectPosClass ?? "object-center"
                    } transition-transform duration-500 group-hover:scale-105`}
                  />

                  <span className="absolute top-3 left-3 rounded-full border border-white/15 bg-[#070B14]/75 px-3 py-1 text-[11px] font-bold uppercase tracking-wider text-emerald-300 backdrop-blur-md">
                    {tag}
                  </span>

                  <span className="absolute bottom-3 right-3 rounded-full border border-white/20 bg-[#070B14]/75 px-2.5 py-1 text-[10px] font-bold text-white opacity-0 group-hover:opacity-100 transition-opacity backdrop-blur-md">
                    🔍 {t("Ampliar", "Zoom")}
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

      {/* Ventana flotante centrada (Lightbox) con navegación izquierda / derecha */}
      {activePhoto && selectedIndex !== null && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/85 p-3 sm:p-6 backdrop-blur-md"
          onClick={() => setSelectedIndex(null)}
          onTouchStart={(e) => {
            touchStartXRef.current = e.touches[0]?.clientX ?? null;
          }}
          onTouchEnd={(e) => {
            if (touchStartXRef.current === null) return;
            const endX = e.changedTouches[0]?.clientX ?? touchStartXRef.current;
            const diff = endX - touchStartXRef.current;
            touchStartXRef.current = null;
            if (Math.abs(diff) > 45) {
              if (diff > 0) goPrev();
              else goNext();
            }
          }}
        >
          <div
            className="relative w-full max-w-4xl overflow-hidden rounded-[26px] border border-white/15 bg-[#0B1120] shadow-[0_28px_90px_rgba(0,0,0,0.85)]"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Cabecera */}
            <div className="flex items-center justify-between gap-3 border-b border-white/10 bg-gradient-to-r from-[#00B7A4]/20 via-[#0D1628] to-[#7E3D97]/25 px-5 py-3.5">
              <div className="min-w-0">
                <div className="flex items-center gap-2">
                  <span className="rounded-full bg-[#00B7A4]/20 px-2.5 py-0.5 text-[10px] font-bold uppercase tracking-wider text-[#4CE4D4]">
                    {lang === "en" ? activePhoto.tagEn : activePhoto.tagEs}
                  </span>
                  <span className="font-mono text-xs font-bold text-slate-300">
                    {selectedIndex + 1} / {totalPhotos}
                  </span>
                </div>
                <h3 className="mt-0.5 truncate text-base sm:text-lg font-extrabold text-white">
                  {lang === "en" ? activePhoto.titleEn : activePhoto.titleEs}
                </h3>
              </div>

              <button
                type="button"
                onClick={() => setSelectedIndex(null)}
                aria-label={t("Cerrar", "Close")}
                className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full border border-white/15 bg-white/10 text-sm font-bold text-white hover:bg-white/20 transition-colors cursor-pointer"
              >
                ✕
              </button>
            </div>

            {/* Imagen principal con flechas izquierda y derecha */}
            <div className="relative flex items-center justify-center bg-[#070B14] px-2 py-4 sm:px-14 sm:py-5">
              <button
                type="button"
                onClick={goPrev}
                aria-label={t("Foto anterior", "Previous photo")}
                className="absolute left-2 sm:left-3 z-10 flex h-10 w-10 sm:h-11 sm:w-11 items-center justify-center rounded-full border border-white/20 bg-black/65 text-lg font-bold text-white shadow-lg hover:bg-[#00B7A4] hover:text-slate-950 transition-colors cursor-pointer"
              >
                ←
              </button>

              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={activePhoto.imageUrl}
                alt={lang === "en" ? activePhoto.titleEn : activePhoto.titleEs}
                className="max-h-[65vh] w-auto max-w-full rounded-xl object-contain shadow-2xl"
              />

              <button
                type="button"
                onClick={goNext}
                aria-label={t("Siguiente foto", "Next photo")}
                className="absolute right-2 sm:right-3 z-10 flex h-10 w-10 sm:h-11 sm:w-11 items-center justify-center rounded-full border border-white/20 bg-black/65 text-lg font-bold text-white shadow-lg hover:bg-[#00B7A4] hover:text-slate-950 transition-colors cursor-pointer"
              >
                →
              </button>
            </div>

            {/* Pie con descripción y miniaturas */}
            <div className="border-t border-white/10 bg-[#0D1322] px-5 py-3.5 space-y-3">
              <p className="text-xs sm:text-sm text-slate-300 text-center">
                {lang === "en" ? activePhoto.subtitleEn : activePhoto.subtitleEs}
              </p>
              <div className="flex items-center justify-center gap-2 overflow-x-auto pb-1">
                {GALLERY_ITEMS.map((thumb, i) => (
                  <button
                    key={thumb.id}
                    type="button"
                    onClick={() => setSelectedIndex(i)}
                    className={`h-11 w-14 shrink-0 overflow-hidden rounded-lg border-2 transition-all cursor-pointer ${
                      i === selectedIndex
                        ? "border-[#00B7A4] scale-105 shadow-md shadow-[#00B7A4]/30"
                        : "border-white/10 opacity-55 hover:opacity-100"
                    }`}
                  >
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img
                      src={thumb.imageUrl}
                      alt={lang === "en" ? thumb.titleEn : thumb.titleEs}
                      className={`h-full w-full object-cover ${
                        thumb.objectPosClass ?? "object-center"
                      }`}
                    />
                  </button>
                ))}
              </div>
            </div>
          </div>
        </div>
      )}
    </section>
  );
}
