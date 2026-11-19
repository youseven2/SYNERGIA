"use client";

import Link from "next/link";
import { useI18n } from "@/components/I18nContext";

export function Footer() {
  const { t } = useI18n();

  return (
    <footer className="border-t border-white/10 bg-[#050810] py-8 sm:py-10 text-sm text-slate-400 print:hidden">
      <div className="mx-auto flex max-w-7xl flex-col items-center justify-between gap-4 px-4 sm:flex-row sm:px-6 lg:px-8">
        <div className="flex flex-wrap items-center justify-center gap-2.5 text-center sm:text-left">
          <span className="inline-flex h-7 w-7 items-center justify-center rounded-lg bg-emerald-500/20 text-xs font-black text-emerald-400">
            ★
          </span>
          <span className="font-semibold text-slate-200">
            SYNERGIA ALL STARS
          </span>
          <span className="text-slate-600 hidden sm:inline">•</span>
          <span>
            {t("Escuela Exclusiva de Porrismo", "Exclusive Cheerleading Academy")}
          </span>
        </div>

        <div className="flex flex-wrap items-center justify-center gap-5 sm:gap-6">
          <Link
            href="/inscripcion"
            className="hover:text-amber-300 transition-colors"
          >
            {t("Inscripción de Atletas", "Athlete Registration")}
          </Link>
          <Link
            href="/sistema"
            className="hover:text-emerald-400 transition-colors"
          >
            {t("Ingresar al Sistema", "System Login")}
          </Link>
        </div>
      </div>
    </footer>
  );
}
