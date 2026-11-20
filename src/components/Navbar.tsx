"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { useI18n } from "@/components/I18nContext";
import { useDevice } from "@/components/DeviceContext";
import { loadSynergiaState } from "@/lib/synergia-store";

interface SearchResultItem {
  id: string;
  title: string;
  subtitle: string;
  href: string;
  category: string;
}

export function Navbar() {
  const [menuOpen, setMenuOpen] = useState(false);
  const [searchOpen, setSearchOpen] = useState(false);
  const [query, setQuery] = useState("");
  const { lang, toggleLang, t } = useI18n();
  const { isMobile } = useDevice();
  const router = useRouter();

  useEffect(() => {
    function handleKeyDown(e: KeyboardEvent) {
      if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === "k") {
        e.preventDefault();
        setSearchOpen((prev) => !prev);
      } else if (e.key === "Escape") {
        setSearchOpen(false);
      }
    }
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, []);

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
      <header className="sticky top-0 z-50 border-b border-[#9D5BB8]/40 bg-gradient-to-r from-[#3B1752]/95 via-[#592678]/95 to-[#3B1752]/95 shadow-lg shadow-[#7E3D97]/25 backdrop-blur-md print:hidden">
        <div className="mx-auto flex max-w-7xl items-center justify-between gap-2 px-3 py-3 sm:px-6 lg:px-8">
          <Link href="/" className="flex items-center gap-2.5 sm:gap-3 group min-w-0">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src="/synergia-logo.svg"
              alt="SYNERGIA ALL STARS"
              className="h-9 sm:h-11 w-auto shrink-0 object-contain transition-transform group-hover:scale-105"
            />
          </Link>

          <nav className="hidden lg:flex items-center gap-6 text-sm font-semibold text-purple-100">
            <Link href="/#inicio" className="hover:text-[#4CE4D4] transition-colors">
              {t("Inicio", "Home")}
            </Link>
            <Link href="/#galeria" className="hover:text-[#4CE4D4] transition-colors">
              {t("Galería", "Gallery")}
            </Link>
            <Link href="/#equipos" className="hover:text-[#4CE4D4] transition-colors">
              {t("Equipos Cheer", "Cheer Teams")}
            </Link>
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
          <div className="lg:hidden border-t border-[#9D5BB8]/35 bg-[#38164D] px-4 py-4 space-y-3">
            <Link
              href="/#inicio"
              onClick={() => setMenuOpen(false)}
              className="block py-2 text-sm font-semibold text-purple-100 hover:text-[#4CE4D4]"
            >
              {t("Inicio", "Home")}
            </Link>
            <Link
              href="/#galeria"
              onClick={() => setMenuOpen(false)}
              className="block py-2 text-sm font-semibold text-purple-100 hover:text-[#4CE4D4]"
            >
              {t("Galería", "Gallery")}
            </Link>
            <Link
              href="/#equipos"
              onClick={() => setMenuOpen(false)}
              className="block py-2 text-sm font-semibold text-purple-100 hover:text-[#4CE4D4]"
            >
              {t("Equipos Cheer", "Cheer Teams")}
            </Link>
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
    </>
  );
}
