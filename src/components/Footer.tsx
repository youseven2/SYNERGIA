import Link from "next/link";

export function Footer() {
  return (
    <footer className="border-t border-white/10 bg-[#050810] py-10 text-sm text-slate-400">
      <div className="mx-auto flex max-w-7xl flex-col items-center justify-between gap-4 px-4 sm:flex-row sm:px-6 lg:px-8">
        <div className="flex items-center gap-2.5">
          <span className="inline-flex h-7 w-7 items-center justify-center rounded-lg bg-emerald-500/20 text-xs font-black text-emerald-400">
            ★
          </span>
          <span className="font-semibold text-slate-200">
            SYNERGIA ALL STARS
          </span>
          <span className="text-slate-600">•</span>
          <span>Escuela Exclusiva de Porrismo</span>
        </div>

        <div className="flex items-center gap-6">
          <Link
            href="/inscripcion"
            className="hover:text-amber-300 transition-colors"
          >
            Inscripción de Atletas
          </Link>
          <Link
            href="/sistema"
            className="hover:text-emerald-400 transition-colors"
          >
            Ingresar al Sistema
          </Link>
        </div>
      </div>
    </footer>
  );
}
