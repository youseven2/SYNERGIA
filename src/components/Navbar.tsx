"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { useI18n } from "@/components/I18nContext";
import { useDevice } from "@/components/DeviceContext";
import {
  DEFAULT_EVENTS,
  SynergiaEvent,
  loadSynergiaState,
} from "@/lib/synergia-store";

interface SearchResultItem {
  id: string;
  title: string;
  subtitle: string;
  href: string;
  category: string;
}

const MONTHS_ES = [
  "Enero", "Febrero", "Marzo", "Abril", "Mayo", "Junio",
  "Julio", "Agosto", "Septiembre", "Octubre", "Noviembre", "Diciembre",
];
const MONTHS_EN = [
  "January", "February", "March", "April", "May", "June",
  "July", "August", "September", "October", "November", "December",
];
const WEEKDAYS_ES = ["Dom", "Lun", "Mar", "Mié", "Jue", "Vie", "Sáb"];
const WEEKDAYS_EN = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];

export function Navbar() {
  const [menuOpen, setMenuOpen] = useState(false);
  const [searchOpen, setSearchOpen] = useState(false);
  const [eventsOpen, setEventsOpen] = useState(false);
  const [aboutOpen, setAboutOpen] = useState(false);
  const [eventsList, setEventsList] = useState<SynergiaEvent[]>(DEFAULT_EVENTS);
  const [activeFlyer, setActiveFlyer] = useState<{
    title: string;
    url: string;
  } | null>(null);
  const [calYear, setCalYear] = useState(2026);
  const [calMonth, setCalMonth] = useState(10); // Noviembre (0-indexed)
  const [selectedDay, setSelectedDay] = useState<string | null>(null);
  const [query, setQuery] = useState("");
  const { lang, toggleLang, t } = useI18n();
  const { isMobile } = useDevice();
  const router = useRouter();

  useEffect(() => {
    if (!eventsOpen) return;
    const raf = requestAnimationFrame(() => {
      setEventsList(loadSynergiaState().events);
    });
    return () => cancelAnimationFrame(raf);
  }, [eventsOpen]);

  useEffect(() => {
    function handleKeyDown(e: KeyboardEvent) {
      if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === "k") {
        e.preventDefault();
        setSearchOpen((prev) => !prev);
      } else if (e.key === "Escape") {
        if (activeFlyer) {
          setActiveFlyer(null);
        } else {
          setSearchOpen(false);
          setEventsOpen(false);
          setAboutOpen(false);
        }
      }
    }
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [activeFlyer]);

  const searchResults = useMemo<SearchResultItem[]>(() => {
    const baseItems: SearchResultItem[] = [
      {
        id: "sec-home",
        title: t("Inicio · SYNERGIA ALL STARS", "Home · SYNERGIA ALL STARS"),
        subtitle: t(
          "Página principal y estadísticas de la escuela",
          "Main page and academy highlights"
        ),
        href: "/#inicio",
        category: t("Sección", "Section"),
      },
      {
        id: "sec-gallery",
        title: t("Galería de Porrismo", "Cheerleading Gallery"),
        subtitle: t(
          "Cintillo rotativo de fotos y momentos All Star",
          "Rotating photo gallery and All Star moments"
        ),
        href: "/#galeria",
        category: t("Sección", "Section"),
      },
      {
        id: "sec-teams",
        title: t("Equipos y Niveles Cheer", "Cheer Teams & Levels"),
        subtitle: t(
          "Tiny, Mini, Youth, Junior, Senior All Girl, Coed y Tumbling",
          "Tiny, Mini, Youth, Junior, Senior All Girl, Coed & Tumbling"
        ),
        href: "/#equipos",
        category: t("Equipos", "Teams"),
      },
      {
        id: "mod-inscripcion",
        title: t("Inscripción de Atletas", "Athlete Registration"),
        subtitle: t(
          "Formulario de ingreso por edad y representante",
          "Registration form by age and guardian"
        ),
        href: "/inscripcion",
        category: t("Módulo", "Module"),
      },
      {
        id: "mod-sistema",
        title: t("Ingresar al Sistema", "System Login"),
        subtitle: t(
          "Acceso para Administradores, Entrenadores y Atletas",
          "Access for Administrators, Coaches & Athletes"
        ),
        href: "/sistema",
        category: t("Módulo", "Module"),
      },
    ];

    if (typeof window !== "undefined" && searchOpen) {
      const state = loadSynergiaState();
      state.athletes.forEach((ath) => {
        baseItems.push({
          id: `ath-${ath.athleteId}`,
          title: `${ath.fullName} (${ath.athleteId})`,
          subtitle: `${ath.category} · ${ath.position}`,
          href: "/sistema",
          category: t("Atleta", "Athlete"),
        });
      });
    }

    const q = query.trim().toLowerCase();
    if (!q) return baseItems.slice(0, 6);
    return baseItems.filter(
      (item) =>
        item.title.toLowerCase().includes(q) ||
        item.subtitle.toLowerCase().includes(q) ||
        item.category.toLowerCase().includes(q)
    );
  }, [query, searchOpen, t]);

  function handleSelectResult(href: string) {
    setSearchOpen(false);
    setQuery("");
    setMenuOpen(false);
    router.push(href);
  }

  return (
    <>
      <header className="sticky top-0 z-50 border-b border-white/10 bg-[#050810]/95 shadow-lg shadow-black/40 backdrop-blur-md print:hidden">
        <div className="mx-auto flex max-w-7xl items-center justify-between gap-2 px-3 py-3 sm:px-6 lg:px-8">
          <Link href="/" className="flex items-center gap-2.5 sm:gap-3 group min-w-0">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src="/synergia-logo.svg"
              alt="SYNERGIA ALL STARS"
              className="h-9 sm:h-11 w-auto shrink-0 object-contain transition-transform group-hover:scale-105"
            />
          </Link>

          <nav className="hidden lg:flex items-center gap-5 text-sm font-semibold text-slate-200">
            <Link href="/#inicio" className="hover:text-[#00B7A4] transition-colors">
              {t("Inicio", "Home")}
            </Link>
            <Link href="/#galeria" className="hover:text-[#00B7A4] transition-colors">
              {t("Galería", "Gallery")}
            </Link>
            <Link href="/#equipos" className="hover:text-[#00B7A4] transition-colors">
              {t("Equipos Cheer", "Cheer Teams")}
            </Link>
            <button
              type="button"
              onClick={() => setEventsOpen(true)}
              className="hover:text-[#00B7A4] transition-colors cursor-pointer"
            >
              {t("Eventos", "Events")}
            </button>
            <button
              type="button"
              onClick={() => setAboutOpen(true)}
              className="hover:text-[#B575CF] transition-colors cursor-pointer"
            >
              {t("Conócenos", "About Us")}
            </button>
          </nav>

          <div className="flex items-center gap-1.5 sm:gap-2.5 shrink-0">
            {/* Botón de Buscar */}
            <button
              type="button"
              onClick={() => setSearchOpen(true)}
              title={t("Buscar en el sitio (Ctrl+K)", "Search site (Ctrl+K)")}
              aria-label={t("Buscar", "Search")}
              className="inline-flex h-9 w-9 items-center justify-center rounded-lg border border-white/10 bg-white/[0.04] text-slate-200 hover:border-emerald-400/50 hover:bg-emerald-500/10 hover:text-emerald-300 transition-colors cursor-pointer"
            >
              <svg
                className="h-4 w-4"
                fill="none"
                viewBox="0 0 24 24"
                strokeWidth={2}
                stroke="currentColor"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  d="M21 21l-4.35-4.35m0 0A7.5 7.5 0 1010.5 18a7.5 7.5 0 006.15-3.35z"
                />
              </svg>
            </button>

            {/* Traductor Automático ES / EN */}
            <button
              type="button"
              onClick={toggleLang}
              title={t("Cambiar idioma a Inglés", "Switch language to Spanish")}
              aria-label={t("Traducir idioma", "Translate language")}
              className="inline-flex h-9 items-center gap-1.5 rounded-lg border border-white/10 bg-white/[0.04] px-2.5 text-xs font-bold text-slate-200 hover:border-amber-400/50 hover:bg-amber-400/10 hover:text-amber-300 transition-colors cursor-pointer"
            >
              <svg
                className="h-3.5 w-3.5 text-emerald-400"
                fill="none"
                viewBox="0 0 24 24"
                strokeWidth={2}
                stroke="currentColor"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  d="M12 21a9 9 0 100-18 9 9 0 000 18zm0 0c2.485 0 4.5-4.03 4.5-9S14.485 3 12 3m0 18c-2.485 0-4.5-4.03-4.5-9S9.515 3 12 3m-9 9h18"
                />
              </svg>
              <span>{lang === "es" ? "ES" : "EN"}</span>
              {!isMobile && (
                <span className="text-[10px] font-medium text-slate-400">
                  → {lang === "es" ? "EN" : "ES"}
                </span>
              )}
            </button>

            <div className="hidden md:flex items-center gap-2.5">
              <Link
                href="/inscripcion"
                className="rounded-lg border border-[#9D5BB8]/60 bg-[#7E3D97]/25 px-3.5 py-2 text-xs lg:text-sm font-bold text-purple-200 hover:bg-[#7E3D97]/45 hover:border-[#B575CF] transition-all"
              >
                {t("INSCRIBETE", "REGISTER")}
              </Link>
              <Link
                href="/sistema"
                className="rounded-lg bg-[#00B7A4] px-3.5 py-2 text-xs lg:text-sm font-bold text-slate-950 shadow-lg shadow-[#00B7A4]/25 hover:bg-[#14CEBA] transition-all"
              >
                {t("Ingresar al Sistema", "System Login")}
              </Link>
            </div>

            <button
              type="button"
              onClick={() => setMenuOpen(!menuOpen)}
              className="lg:hidden rounded-lg border border-white/10 p-2 text-slate-300 hover:bg-white/5 hover:text-white cursor-pointer"
              aria-label={t("Abrir menú", "Open menu")}
            >
              <svg
                className="h-5 w-5"
                fill="none"
                viewBox="0 0 24 24"
                strokeWidth={1.8}
                stroke="currentColor"
              >
                {menuOpen ? (
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    d="M6 18L18 6M6 6l12 12"
                  />
                ) : (
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    d="M3.75 6.75h16.5M3.75 12h16.5m-16.5 5.25h16.5"
                  />
                )}
              </svg>
            </button>
          </div>
        </div>

        {menuOpen && (
          <div className="lg:hidden border-t border-white/10 bg-[#070B14] px-4 py-4 space-y-3">
            <Link
              href="/#inicio"
              onClick={() => setMenuOpen(false)}
              className="block py-2 text-sm font-semibold text-slate-200 hover:text-[#00B7A4]"
            >
              {t("Inicio", "Home")}
            </Link>
            <Link
              href="/#galeria"
              onClick={() => setMenuOpen(false)}
              className="block py-2 text-sm font-semibold text-slate-200 hover:text-[#00B7A4]"
            >
              {t("Galería", "Gallery")}
            </Link>
            <Link
              href="/#equipos"
              onClick={() => setMenuOpen(false)}
              className="block py-2 text-sm font-semibold text-slate-200 hover:text-[#00B7A4]"
            >
              {t("Equipos Cheer", "Cheer Teams")}
            </Link>
            <button
              type="button"
              onClick={() => {
                setMenuOpen(false);
                setEventsOpen(true);
              }}
              className="block w-full text-left py-2 text-sm font-semibold text-slate-200 hover:text-[#00B7A4] cursor-pointer"
            >
              {t("Eventos", "Events")}
            </button>
            <button
              type="button"
              onClick={() => {
                setMenuOpen(false);
                setAboutOpen(true);
              }}
              className="block w-full text-left py-2 text-sm font-semibold text-slate-200 hover:text-[#B575CF] cursor-pointer"
            >
              {t("Conócenos", "About Us")}
            </button>
            <div className="pt-2 flex flex-col sm:flex-row gap-2.5 md:hidden">
              <Link
                href="/inscripcion"
                onClick={() => setMenuOpen(false)}
                className="w-full text-center rounded-lg border border-[#B575CF]/60 bg-[#7E3D97] px-4 py-2.5 text-sm font-bold text-white"
              >
                {t("INSCRIBETE", "REGISTER")}
              </Link>
              <Link
                href="/sistema"
                onClick={() => setMenuOpen(false)}
                className="w-full text-center rounded-lg bg-[#00B7A4] px-4 py-2.5 text-sm font-bold text-slate-950"
              >
                {t("Ingresar al Sistema", "System Login")}
              </Link>
            </div>
          </div>
        )}
      </header>

      {/* Modal de Búsqueda */}
      {searchOpen && (
        <div
          className="fixed inset-0 z-50 flex items-start justify-center bg-black/75 backdrop-blur-sm px-4 pt-20 sm:pt-24"
          onClick={() => setSearchOpen(false)}
        >
          <div
            className="w-full max-w-lg rounded-2xl border border-white/15 bg-[#0D1322] p-4 shadow-2xl"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center gap-3 border-b border-white/10 pb-3">
              <svg
                className="h-5 w-5 text-emerald-400 shrink-0"
                fill="none"
                viewBox="0 0 24 24"
                strokeWidth={2}
                stroke="currentColor"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  d="M21 21l-4.35-4.35m0 0A7.5 7.5 0 1010.5 18a7.5 7.5 0 006.15-3.35z"
                />
              </svg>
              <input
                type="text"
                autoFocus
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                placeholder={t(
                  "Buscar equipos, inscripción, sistema o atletas...",
                  "Search teams, registration, system or athletes..."
                )}
                className="w-full bg-transparent text-sm text-white placeholder:text-slate-500 focus:outline-none"
              />
              <button
                type="button"
                onClick={() => setSearchOpen(false)}
                className="rounded-lg border border-white/10 px-2 py-1 text-[11px] font-semibold text-slate-400 hover:text-white cursor-pointer"
              >
                ESC
              </button>
            </div>

            <div className="mt-3 max-h-72 overflow-y-auto space-y-1.5">
              {searchResults.length === 0 ? (
                <p className="py-6 text-center text-xs text-slate-400">
                  {t(
                    "No se encontraron resultados para tu búsqueda.",
                    "No results found for your search."
                  )}
                </p>
              ) : (
                searchResults.map((item) => (
                  <button
                    key={item.id}
                    type="button"
                    onClick={() => handleSelectResult(item.href)}
                    className="flex w-full items-center justify-between gap-3 rounded-xl px-3 py-2.5 text-left hover:bg-white/[0.06] transition-colors cursor-pointer"
                  >
                    <div className="min-w-0">
                      <p className="truncate text-sm font-semibold text-white">
                        {item.title}
                      </p>
                      <p className="truncate text-xs text-slate-400">
                        {item.subtitle}
                      </p>
                    </div>
                    <span className="shrink-0 rounded-md bg-emerald-500/15 px-2 py-0.5 text-[10px] font-bold text-emerald-300">
                      {item.category}
                    </span>
                  </button>
                ))
              )}
            </div>
          </div>
        </div>
      )}

      {/* Ventana Flotante: Calendario de Eventos */}
      {eventsOpen && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 p-3 sm:p-6 backdrop-blur-md print:hidden"
          onClick={() => setEventsOpen(false)}
        >
          <div
            className="w-full max-w-4xl max-h-[92vh] overflow-y-auto rounded-[28px] border border-white/15 bg-[#0B1120] shadow-[0_28px_80px_rgba(0,0,0,0.85)]"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between gap-3 border-b border-white/10 bg-gradient-to-r from-[#00B7A4]/20 via-[#0D1628] to-[#7E3D97]/25 px-5 py-4 sm:px-7">
              <div>
                <span className="text-[11px] font-bold uppercase tracking-[0.2em] text-[#4CE4D4]">
                  SYNERGIA ALL STARS
                </span>
                <h2 className="mt-0.5 text-lg sm:text-xl font-extrabold text-white">
                  {t("Calendario de Eventos", "Events Calendar")}
                </h2>
              </div>
              <button
                type="button"
                onClick={() => setEventsOpen(false)}
                aria-label={t("Cerrar", "Close")}
                className="flex h-9 w-9 items-center justify-center rounded-full border border-white/15 bg-white/10 text-sm text-white hover:bg-white/20 cursor-pointer"
              >
                ✕
              </button>
            </div>

            <div className="grid gap-6 p-4 sm:p-6 lg:grid-cols-5">
              {/* Calendario interactivo con navegación por meses y años */}
              <div className="lg:col-span-3 rounded-2xl border border-white/10 bg-[#070B14] p-4 space-y-4">
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <div className="flex items-center gap-1.5">
                    <button
                      type="button"
                      onClick={() => setCalYear((y) => y - 1)}
                      title={t("Año anterior", "Previous year")}
                      className="rounded-lg border border-white/15 px-2.5 py-1.5 text-xs font-bold text-slate-200 hover:bg-white/10 cursor-pointer"
                    >
                      «
                    </button>
                    <button
                      type="button"
                      onClick={() => {
                        setSelectedDay(null);
                        if (calMonth === 0) {
                          setCalMonth(11);
                          setCalYear((y) => y - 1);
                        } else {
                          setCalMonth((m) => m - 1);
                        }
                      }}
                      title={t("Mes anterior", "Previous month")}
                      className="rounded-lg border border-white/15 px-2.5 py-1.5 text-xs font-bold text-slate-200 hover:bg-white/10 cursor-pointer"
                    >
                      ‹
                    </button>
                  </div>

                  <div className="flex items-center gap-2">
                    <select
                      aria-label={t("Mes", "Month")}
                      value={calMonth}
                      onChange={(e) => {
                        setSelectedDay(null);
                        setCalMonth(Number(e.target.value));
                      }}
                      className="rounded-lg border border-white/15 bg-[#0D1322] px-2.5 py-1.5 text-xs font-bold text-white focus:border-[#00B7A4] focus:outline-none"
                    >
                      {(lang === "en" ? MONTHS_EN : MONTHS_ES).map((m, idx) => (
                        <option key={m} value={idx}>
                          {m}
                        </option>
                      ))}
                    </select>
                    <select
                      aria-label={t("Año", "Year")}
                      value={calYear}
                      onChange={(e) => {
                        setSelectedDay(null);
                        setCalYear(Number(e.target.value));
                      }}
                      className="rounded-lg border border-white/15 bg-[#0D1322] px-2.5 py-1.5 text-xs font-bold text-white focus:border-[#00B7A4] focus:outline-none"
                    >
                      {[2024, 2025, 2026, 2027, 2028, 2029, 2030].map((yr) => (
                        <option key={yr} value={yr}>
                          {yr}
                        </option>
                      ))}
                    </select>
                  </div>

                  <div className="flex items-center gap-1.5">
                    <button
                      type="button"
                      onClick={() => {
                        setSelectedDay(null);
                        if (calMonth === 11) {
                          setCalMonth(0);
                          setCalYear((y) => y + 1);
                        } else {
                          setCalMonth((m) => m + 1);
                        }
                      }}
                      title={t("Mes siguiente", "Next month")}
                      className="rounded-lg border border-white/15 px-2.5 py-1.5 text-xs font-bold text-slate-200 hover:bg-white/10 cursor-pointer"
                    >
                      ›
                    </button>
                    <button
                      type="button"
                      onClick={() => setCalYear((y) => y + 1)}
                      title={t("Año siguiente", "Next year")}
                      className="rounded-lg border border-white/15 px-2.5 py-1.5 text-xs font-bold text-slate-200 hover:bg-white/10 cursor-pointer"
                    >
                      »
                    </button>
                  </div>
                </div>

                {/* Días de la semana */}
                <div className="grid grid-cols-7 gap-1 text-center text-[11px] font-bold text-slate-400">
                  {(lang === "en" ? WEEKDAYS_EN : WEEKDAYS_ES).map((d) => (
                    <div key={d} className="py-1">
                      {d}
                    </div>
                  ))}
                </div>

                {/* Celdas del calendario */}
                <div className="grid grid-cols-7 gap-1.5">
                  {(() => {
                    const firstWeekday = new Date(calYear, calMonth, 1).getDay();
                    const daysInMonth = new Date(calYear, calMonth + 1, 0).getDate();
                    const cells = [];
                    for (let i = 0; i < firstWeekday; i++) {
                      cells.push(<div key={`empty-${i}`} className="h-10" />);
                    }
                    for (let day = 1; day <= daysInMonth; day++) {
                      const dateStr = `${calYear}-${String(calMonth + 1).padStart(2, "0")}-${String(day).padStart(2, "0")}`;
                      const dayEvents = eventsList.filter((e) => e.date === dateStr);
                      const hasEvents = dayEvents.length > 0;
                      const isSelected = selectedDay === dateStr;
                      cells.push(
                        <button
                          key={dateStr}
                          type="button"
                          onClick={() =>
                            setSelectedDay((prev) => (prev === dateStr ? null : dateStr))
                          }
                          className={`relative flex h-10 flex-col items-center justify-center rounded-xl text-xs font-bold transition-all cursor-pointer ${
                            isSelected
                              ? "bg-[#7E3D97] text-white ring-2 ring-[#B575CF]"
                              : hasEvents
                              ? "bg-[#00B7A4]/20 text-[#4CE4D4] border border-[#00B7A4]/45 hover:bg-[#00B7A4]/35"
                              : "bg-white/[0.03] text-slate-300 hover:bg-white/[0.08]"
                          }`}
                        >
                          <span>{day}</span>
                          {hasEvents && (
                            <span className="mt-0.5 h-1.5 w-1.5 rounded-full bg-amber-300" />
                          )}
                        </button>
                      );
                    }
                    return cells;
                  })()}
                </div>
              </div>

              {/* Lista de eventos del mes o día seleccionado */}
              <div className="lg:col-span-2 flex flex-col space-y-3">
                <div className="flex items-center justify-between">
                  <h3 className="text-sm font-bold text-white">
                    {selectedDay
                      ? `${t("Eventos del", "Events on")} ${selectedDay}`
                      : `${t("Eventos de", "Events for")} ${
                          (lang === "en" ? MONTHS_EN : MONTHS_ES)[calMonth]
                        } ${calYear}`}
                  </h3>
                  {selectedDay && (
                    <button
                      type="button"
                      onClick={() => setSelectedDay(null)}
                      className="text-[11px] font-semibold text-[#4CE4D4] hover:underline cursor-pointer"
                    >
                      {t("Ver mes", "View month")}
                    </button>
                  )}
                </div>

                {(() => {
                  const monthPrefix = `${calYear}-${String(calMonth + 1).padStart(2, "0")}`;
                  const visibleEvents = selectedDay
                    ? eventsList.filter((e) => e.date === selectedDay)
                    : eventsList.filter((e) => e.date.startsWith(monthPrefix));

                  if (visibleEvents.length === 0) {
                    return (
                      <div className="rounded-2xl border border-white/10 bg-[#070B14] p-5 text-center text-xs text-slate-400">
                        {t(
                          "No hay eventos programados para esta fecha. Navega por otros meses o años.",
                          "No events scheduled for this date. Browse other months or years."
                        )}
                      </div>
                    );
                  }

                  return (
                    <div className="space-y-2.5 max-h-[340px] overflow-y-auto pr-1">
                      {visibleEvents.map((ev) => (
                        <div
                          key={ev.id}
                          className="rounded-2xl border border-[#00B7A4]/30 bg-[#070B14] p-3.5 text-xs space-y-1.5"
                        >
                          <div className="flex items-center justify-between gap-2">
                            <span className="font-mono font-bold text-amber-300">
                              {ev.date}
                            </span>
                            <span className="rounded-full bg-[#7E3D97]/30 px-2 py-0.5 text-[10px] font-bold text-purple-200">
                              {ev.category}
                            </span>
                          </div>
                          <p className="text-sm font-bold text-white">
                            {ev.title}
                          </p>
                          <p className="text-slate-300">{ev.time}</p>
                          {ev.location && (
                            <p className="text-[#4CE4D4]">{ev.location}</p>
                          )}
                          {ev.description && (
                            <p className="text-slate-400 leading-relaxed">
                              {ev.description}
                            </p>
                          )}
                          {ev.flyerDataUrl && (
                            <button
                              type="button"
                              onClick={() =>
                                setActiveFlyer({
                                  title: ev.title,
                                  url: ev.flyerDataUrl!,
                                })
                              }
                              className="mt-1 inline-flex items-center gap-1.5 rounded-lg border border-[#9D5BB8]/50 bg-[#7E3D97]/25 px-3 py-1.5 text-[11px] font-bold text-purple-100 hover:bg-[#7E3D97]/45 cursor-pointer"
                            >
                              {t("Ver Flyer", "View Flyer")}
                            </button>
                          )}
                        </div>
                      ))}
                    </div>
                  );
                })()}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Ventana Flotante: Conócenos (Misión y Visión) */}
      {aboutOpen && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 p-3 sm:p-6 backdrop-blur-md print:hidden"
          onClick={() => setAboutOpen(false)}
        >
          <div
            className="w-full max-w-3xl max-h-[90vh] overflow-y-auto rounded-[28px] border border-white/15 bg-[#0B1120] shadow-[0_28px_80px_rgba(0,0,0,0.85)]"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between gap-3 border-b border-white/10 bg-gradient-to-r from-[#7E3D97]/30 via-[#0D1628] to-[#00B7A4]/20 px-5 py-4 sm:px-7">
              <div>
                <span className="text-[11px] font-bold uppercase tracking-[0.2em] text-purple-200">
                  {t("Conócenos · Escuela de Formación de Porristas", "About Us · Cheerleading Training Academy")}
                </span>
                <h2 className="mt-0.5 text-lg sm:text-xl font-extrabold text-white">
                  SYNERGIA ALL STARS
                </h2>
              </div>
              <button
                type="button"
                onClick={() => setAboutOpen(false)}
                aria-label={t("Cerrar", "Close")}
                className="flex h-9 w-9 items-center justify-center rounded-full border border-white/15 bg-white/10 text-sm text-white hover:bg-white/20 cursor-pointer"
              >
                ✕
              </button>
            </div>

            <div className="grid gap-5 p-5 sm:p-7 md:grid-cols-2">
              <div className="rounded-2xl border border-[#00B7A4]/35 bg-gradient-to-br from-[#00B7A4]/15 to-[#070B14] p-5 space-y-3">
                <span className="inline-block rounded-lg bg-[#00B7A4]/20 px-3 py-1 text-xs font-extrabold uppercase tracking-wider text-[#4CE4D4]">
                  {t("Nuestra Misión", "Our Mission")}
                </span>
                <p className="text-sm leading-relaxed text-slate-200">
                  {t(
                    "Formar integralmente a niños, jóvenes y atletas en la disciplina del porrismo (cheerleading), desarrollando sus capacidades físicas, técnicas y acrobáticas bajo un ambiente seguro, disciplinado y apasionado, fomentando valores de trabajo en equipo, respeto, liderazgo y superación personal.",
                    "Comprehensively train children, youth and athletes in the discipline of cheerleading, developing their physical, technical and acrobatic skills in a safe, disciplined and passionate environment while fostering teamwork, respect, leadership and personal growth."
                  )}
                </p>
              </div>

              <div className="rounded-2xl border border-[#9D5BB8]/40 bg-gradient-to-br from-[#7E3D97]/20 to-[#070B14] p-5 space-y-3">
                <span className="inline-block rounded-lg bg-[#7E3D97]/30 px-3 py-1 text-xs font-extrabold uppercase tracking-wider text-purple-200">
                  {t("Nuestra Visión", "Our Vision")}
                </span>
                <p className="text-sm leading-relaxed text-slate-200">
                  {t(
                    "Consolidarnos como la escuela de formación de porristas referente a nivel nacional e internacional, reconocida por la excelencia técnica de nuestros equipos All Star, la innovación en nuestros procesos formativos y la proyección de atletas íntegros dentro y fuera de la tarima.",
                    "Establish ourselves as a leading cheerleading training academy nationally and internationally, recognized for the technical excellence of our All Star teams, innovative training programs and the development of well-rounded athletes on and off the mat."
                  )}
                </p>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Ventana Flotante: Visor de Flyer del Evento (sin descarga) */}
      {activeFlyer && (
        <div
          className="fixed inset-0 z-[60] flex items-center justify-center bg-black/85 p-4 backdrop-blur-md print:hidden"
          onClick={() => setActiveFlyer(null)}
        >
          <div
            className="w-full max-w-2xl overflow-hidden rounded-[24px] border border-white/15 bg-[#0B1120] shadow-2xl"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between border-b border-white/10 px-5 py-3.5">
              <p className="truncate text-sm font-bold text-white">
                {activeFlyer.title}
              </p>
              <button
                type="button"
                onClick={() => setActiveFlyer(null)}
                aria-label={t("Cerrar", "Close")}
                className="flex h-8 w-8 items-center justify-center rounded-full bg-white/10 text-xs text-white hover:bg-white/20 cursor-pointer"
              >
                ✕
              </button>
            </div>
            <div className="flex items-center justify-center bg-[#070B14] p-4 max-h-[78vh] overflow-auto">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={activeFlyer.url}
                alt={activeFlyer.title}
                className="max-h-[70vh] w-auto rounded-xl object-contain"
              />
            </div>
          </div>
        </div>
      )}
    </>
  );
}
