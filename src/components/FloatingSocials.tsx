"use client";

import { useEffect, useRef, useState } from "react";
import { useDevice } from "@/components/DeviceContext";
import { useI18n } from "@/components/I18nContext";

const WHATSAPP_CONTACTS = [
  {
    name: "Dir. Felix",
    initials: "DF",
    roleEs: "Dirección General",
    roleEn: "General Director",
    displayPhone: "+58 414-3311099",
    href: "https://wa.me/584143311099",
    accent: "from-[#00B7A4] to-emerald-500",
  },
  {
    name: "Dir. Daniela",
    initials: "DD",
    roleEs: "Dirección Académica",
    roleEn: "Academy Director",
    displayPhone: "+58 424-1535062",
    href: "https://wa.me/584241535062",
    accent: "from-[#7E3D97] to-fuchsia-500",
  },
];

export function FloatingSocials() {
  const { isMobile } = useDevice();
  const { t } = useI18n();
  const [waOpen, setWaOpen] = useState(false);
  const containerRef = useRef<HTMLElement | null>(null);

  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      if (
        containerRef.current &&
        !containerRef.current.contains(e.target as Node)
      ) {
        setWaOpen(false);
      }
    }
    function handleKeyDown(e: KeyboardEvent) {
      if (e.key === "Escape") setWaOpen(false);
    }
    document.addEventListener("mousedown", handleClickOutside);
    window.addEventListener("keydown", handleKeyDown);
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
      window.removeEventListener("keydown", handleKeyDown);
    };
  }, []);

  const btnSize = isMobile ? "h-11 w-11" : "h-12 w-12";
  const iconSize = "h-5 w-5";

  return (
    <aside
      ref={containerRef}
      aria-label={t("Redes Sociales", "Social Media")}
      className="fixed bottom-4 right-3 sm:bottom-6 sm:right-6 z-40 flex flex-col items-end gap-3 print:hidden"
    >
      {/* Ventana moderna y redondeada de WhatsApp */}
      {waOpen && (
        <div className="mb-1 w-[290px] sm:w-[310px] overflow-hidden rounded-[28px] border border-white/15 bg-[#0B1120]/95 shadow-[0_24px_60px_rgba(0,0,0,0.65)] backdrop-blur-xl transition-all">
          {/* Cabecera estética con degradado */}
          <div className="relative bg-gradient-to-r from-[#00B7A4]/25 via-[#0D1628] to-[#7E3D97]/30 px-5 py-4 border-b border-white/10">
            <div className="flex items-center justify-between gap-2">
              <div className="flex items-center gap-2.5">
                <span className="flex h-8 w-8 items-center justify-center rounded-full bg-emerald-500 text-slate-950 shadow-md shadow-emerald-500/30">
                  <svg className="h-4 w-4" viewBox="0 0 24 24" fill="currentColor">
                    <path d="M12.04 2C6.58 2 2.13 6.45 2.13 11.91c0 1.75.46 3.45 1.32 4.95L2.05 22l5.25-1.38c1.45.79 3.08 1.21 4.74 1.21 5.46 0 9.91-4.45 9.91-9.91C21.95 6.45 17.5 2 12.04 2zm5.82 14.12c-.24.68-1.41 1.3-1.95 1.38-.5.07-1.13.1-1.82-.12-.42-.13-.96-.31-1.65-.61-2.9-1.25-4.79-4.18-4.93-4.37-.15-.2-1.18-1.57-1.18-2.99 0-1.42.74-2.12 1.01-2.41.26-.29.57-.36.76-.36.19 0 .38 0 .55.01.18.01.42-.07.65.49.24.58.82 2 .89 2.15.07.15.12.32.02.52-.1.2-.15.32-.29.49-.15.17-.3.38-.43.51-.14.15-.29.31-.13.6.17.29.74 1.22 1.59 1.98 1.09.97 2.01 1.27 2.3 1.42.29.14.46.12.63-.07.17-.2.72-.84.91-1.13.19-.29.38-.24.65-.14.27.1 1.7.8 1.99.95.29.14.48.22.55.34.07.12.07.69-.17 1.37z" />
                  </svg>
                </span>
                <div>
                  <p className="text-xs font-extrabold tracking-wide text-white">
                    {t("Atención Directa", "Direct Support")}
                  </p>
                  <p className="flex items-center gap-1.5 text-[10px] font-medium text-emerald-300">
                    <span className="h-1.5 w-1.5 rounded-full bg-emerald-400 animate-pulse" />
                    {t("Elige un contacto", "Choose a contact")}
                  </p>
                </div>
              </div>

              <button
                type="button"
                onClick={() => setWaOpen(false)}
                aria-label={t("Cerrar", "Close")}
                className="flex h-7 w-7 items-center justify-center rounded-full bg-white/10 text-xs text-slate-300 hover:bg-white/20 hover:text-white transition-colors cursor-pointer"
              >
                ✕
              </button>
            </div>
          </div>

          {/* Lista de contactos */}
          <div className="p-3.5 space-y-2.5">
            {WHATSAPP_CONTACTS.map((contact) => (
              <a
                key={contact.href}
                href={contact.href}
                target="_blank"
                rel="noopener noreferrer"
                onClick={() => setWaOpen(false)}
                className="group flex items-center gap-3 rounded-2xl border border-white/10 bg-white/[0.04] p-3 transition-all duration-200 hover:-translate-y-0.5 hover:border-emerald-400/50 hover:bg-emerald-500/10"
              >
                <div
                  className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-gradient-to-br ${contact.accent} text-xs font-black text-white shadow-md`}
                >
                  {contact.initials}
                </div>
                <div className="min-w-0 flex-1">
                  <p className="text-sm font-bold text-white group-hover:text-emerald-300 transition-colors">
                    {contact.name}
                  </p>
                  <p className="text-[10px] text-slate-400">
                    {t(contact.roleEs, contact.roleEn)}
                  </p>
                  <p className="mt-0.5 text-[11px] font-mono font-semibold text-emerald-300">
                    {contact.displayPhone}
                  </p>
                </div>
                <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-emerald-500/15 text-xs font-bold text-emerald-300 group-hover:bg-emerald-500 group-hover:text-slate-950 transition-colors">
                  →
                </span>
              </a>
            ))}
          </div>
        </div>
      )}

      {/* Instagram */}
      <a
        href="https://www.instagram.com/synergia_allstars?gwpx=MXdmYXNxYmVta2xmcQ=="
        target="_blank"
        rel="noopener noreferrer"
        title={t("Síguenos en Instagram", "Follow us on Instagram")}
        aria-label="Instagram"
        className={`group flex ${btnSize} items-center justify-center rounded-full border border-white/15 bg-gradient-to-tr from-[#F58529] via-[#DD2A7B] to-[#8134AF] text-white shadow-lg shadow-pink-500/25 transition-all duration-200 hover:scale-110 hover:shadow-pink-500/45`}
      >
        <svg
          className={iconSize}
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth={2}
          strokeLinecap="round"
          strokeLinejoin="round"
        >
          <rect x="2" y="2" width="20" height="20" rx="5" ry="5" />
          <path d="M16 11.37A4 4 0 1 1 12.63 8 4 4 0 0 1 16 11.37z" />
          <line x1="17.5" y1="6.5" x2="17.51" y2="6.5" />
        </svg>
      </a>

      {/* WhatsApp */}
      <button
        type="button"
        onClick={() => setWaOpen((prev) => !prev)}
        title={t("Escríbenos por WhatsApp", "Chat on WhatsApp")}
        aria-label="WhatsApp"
        aria-expanded={waOpen}
        className={`group flex ${btnSize} items-center justify-center rounded-full border border-emerald-300/40 bg-emerald-500 text-slate-950 shadow-lg shadow-emerald-500/30 transition-all duration-200 hover:scale-110 hover:bg-emerald-400 hover:shadow-emerald-400/50 cursor-pointer`}
      >
        <svg className={iconSize} viewBox="0 0 24 24" fill="currentColor">
          <path d="M12.04 2C6.58 2 2.13 6.45 2.13 11.91c0 1.75.46 3.45 1.32 4.95L2.05 22l5.25-1.38c1.45.79 3.08 1.21 4.74 1.21 5.46 0 9.91-4.45 9.91-9.91C21.95 6.45 17.5 2 12.04 2zm5.82 14.12c-.24.68-1.41 1.3-1.95 1.38-.5.07-1.13.1-1.82-.12-.42-.13-.96-.31-1.65-.61-2.9-1.25-4.79-4.18-4.93-4.37-.15-.2-1.18-1.57-1.18-2.99 0-1.42.74-2.12 1.01-2.41.26-.29.57-.36.76-.36.19 0 .38 0 .55.01.18.01.42-.07.65.49.24.58.82 2 .89 2.15.07.15.12.32.02.52-.1.2-.15.32-.29.49-.15.17-.3.38-.43.51-.14.15-.29.31-.13.6.17.29.74 1.22 1.59 1.98 1.09.97 2.01 1.27 2.3 1.42.29.14.46.12.63-.07.17-.2.72-.84.91-1.13.19-.29.38-.24.65-.14.27.1 1.7.8 1.99.95.29.14.48.22.55.34.07.12.07.69-.17 1.37z" />
        </svg>
      </button>
    </aside>
  );
}
