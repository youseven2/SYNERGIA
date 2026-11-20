"use client";

import { useI18n } from "@/components/I18nContext";

export function Footer() {
  const { t } = useI18n();

  return (
    <footer className="border-t border-white/10 bg-[#050810] py-8 sm:py-10 text-sm text-slate-400 print:hidden">
      <div className="mx-auto flex max-w-7xl flex-col items-center justify-between gap-4 px-4 sm:flex-row sm:px-6 lg:px-8">
        <div className="flex flex-wrap items-center justify-center gap-3 text-center sm:text-left">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src="/synergia-logo.svg"
            alt="SYNERGIA ALL STARS"
            className="h-8 sm:h-9 w-auto object-contain"
          />
          <span className="text-slate-600 hidden sm:inline">•</span>
          <span>
            {t("Escuela Exclusiva de Porrismo", "Exclusive Cheerleading Academy")}
          </span>
        </div>

        <p className="text-xs text-slate-500">
          © 2026 SYNERGIA ALL STARS
        </p>
      </div>
    </footer>
  );
}
