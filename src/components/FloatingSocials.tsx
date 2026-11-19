"use client";

import { useDevice } from "@/components/DeviceContext";
import { useI18n } from "@/components/I18nContext";

export function FloatingSocials() {
  const { isMobile } = useDevice();
  const { t } = useI18n();

  const btnSize = isMobile ? "h-10 w-10" : "h-11 w-11";
  const iconSize = isMobile ? "h-5 w-5" : "h-5 w-5";

  return (
    <aside
      aria-label={t("Redes Sociales", "Social Media")}
      className="fixed bottom-4 right-3 sm:bottom-6 sm:right-6 z-40 flex flex-col gap-2.5 print:hidden"
    >
      {/* Instagram */}
      <a
        href="https://www.instagram.com/"
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

      {/* TikTok */}
      <a
        href="https://www.tiktok.com/"
        target="_blank"
        rel="noopener noreferrer"
        title={t("Síguenos en TikTok", "Follow us on TikTok")}
        aria-label="TikTok"
        className={`group flex ${btnSize} items-center justify-center rounded-full border border-cyan-400/40 bg-[#0D1322] text-white shadow-lg shadow-cyan-500/20 transition-all duration-200 hover:scale-110 hover:border-pink-400/60 hover:shadow-cyan-400/35`}
      >
        <svg className={iconSize} viewBox="0 0 24 24" fill="currentColor">
          <path d="M19.59 6.69a4.83 4.83 0 0 1-3.77-4.25V2h-3.45v13.67a2.89 2.89 0 0 1-2.88 2.5 2.89 2.89 0 0 1-2.89-2.89 2.89 2.89 0 0 1 2.89-2.89c.28 0 .54.04.79.1v-3.5a6.37 6.37 0 0 0-.79-.05A6.34 6.34 0 0 0 3.15 15a6.34 6.34 0 0 0 6.34 6.34 6.34 6.34 0 0 0 6.34-6.34V8.71a8.21 8.21 0 0 0 4.76 1.52V6.78a4.85 4.85 0 0 1-1-.09z" />
        </svg>
      </a>

      {/* WhatsApp */}
      <a
        href="https://wa.me/"
        target="_blank"
        rel="noopener noreferrer"
        title={t("Escríbenos por WhatsApp", "Chat on WhatsApp")}
        aria-label="WhatsApp"
        className={`group flex ${btnSize} items-center justify-center rounded-full border border-emerald-300/40 bg-emerald-500 text-slate-950 shadow-lg shadow-emerald-500/30 transition-all duration-200 hover:scale-110 hover:bg-emerald-400 hover:shadow-emerald-400/50`}
      >
        <svg className={iconSize} viewBox="0 0 24 24" fill="currentColor">
          <path d="M12.04 2C6.58 2 2.13 6.45 2.13 11.91c0 1.75.46 3.45 1.32 4.95L2.05 22l5.25-1.38c1.45.79 3.08 1.21 4.74 1.21 5.46 0 9.91-4.45 9.91-9.91C21.95 6.45 17.5 2 12.04 2zm5.82 14.12c-.24.68-1.41 1.3-1.95 1.38-.5.07-1.13.1-1.82-.12-.42-.13-.96-.31-1.65-.61-2.9-1.25-4.79-4.18-4.93-4.37-.15-.2-1.18-1.57-1.18-2.99 0-1.42.74-2.12 1.01-2.41.26-.29.57-.36.76-.36.19 0 .38 0 .55.01.18.01.42-.07.65.49.24.58.82 2 .89 2.15.07.15.12.32.02.52-.1.2-.15.32-.29.49-.15.17-.3.38-.43.51-.14.15-.29.31-.13.6.17.29.74 1.22 1.59 1.98 1.09.97 2.01 1.27 2.3 1.42.29.14.46.12.63-.07.17-.2.72-.84.91-1.13.19-.29.38-.24.65-.14.27.1 1.7.8 1.99.95.29.14.48.22.55.34.07.12.07.69-.17 1.37z" />
        </svg>
      </a>
    </aside>
  );
}
