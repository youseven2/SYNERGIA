"use client";

import Link from "next/link";
import { useState } from "react";

export function Navbar() {
  const [menuOpen, setMenuOpen] = useState(false);

  return (
    <header className="sticky top-0 z-50 border-b border-white/10 bg-[#070B14]/85 backdrop-blur-md">
      <div className="mx-auto flex max-w-7xl items-center justify-between px-4 py-3.5 sm:px-6 lg:px-8">
        <Link href="/" className="flex items-center gap-3 group">
          <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-gradient-to-br from-emerald-400 to-teal-600 text-slate-950 font-black text-lg shadow-lg shadow-emerald-500/20 transition-transform group-hover:scale-105">
            S
          </div>
          <div>
            <span className="block text-lg font-extrabold tracking-tight text-white">
              SYNERGIA
            </span>
            <span className="block text-[10px] font-semibold uppercase tracking-[0.2em] text-emerald-400">
              Portal Deportivo
            </span>
          </div>
        </Link>

        <nav className="hidden md:flex items-center gap-8 text-sm font-medium text-slate-300">
          <Link href="/#inicio" className="hover:text-white transition-colors">
            Inicio
          </Link>
          <Link
            href="/#disciplinas"
            className="hover:text-white transition-colors"
          >
            Disciplinas
          </Link>
          <Link
            href="/#acceso-rapido"
            className="hover:text-white transition-colors"
          >
            Plataforma
          </Link>
        </nav>

        <div className="hidden md:flex items-center gap-3">
          <Link
            href="/inscripcion"
            className="rounded-lg border border-emerald-500/40 bg-emerald-500/10 px-4 py-2 text-sm font-semibold text-emerald-300 hover:bg-emerald-500/20 hover:border-emerald-400 transition-all"
          >
            Inscribirse a Equipos
          </Link>
          <Link
            href="/sistema"
            className="rounded-lg bg-emerald-500 px-4 py-2 text-sm font-bold text-slate-950 shadow-lg shadow-emerald-500/25 hover:bg-emerald-400 transition-all"
          >
            Ingresar al Sistema
          </Link>
        </div>

        <button
          type="button"
          onClick={() => setMenuOpen(!menuOpen)}
          className="md:hidden rounded-lg border border-white/10 p-2 text-slate-300 hover:bg-white/5 hover:text-white"
          aria-label="Abrir menú"
        >
          <svg
            className="h-6 w-6"
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

      {menuOpen && (
        <div className="md:hidden border-t border-white/10 bg-[#0B1120] px-4 py-4 space-y-3">
          <Link
            href="/#inicio"
            onClick={() => setMenuOpen(false)}
            className="block py-2 text-sm font-medium text-slate-300 hover:text-white"
          >
            Inicio
          </Link>
          <Link
            href="/#disciplinas"
            onClick={() => setMenuOpen(false)}
            className="block py-2 text-sm font-medium text-slate-300 hover:text-white"
          >
            Disciplinas
          </Link>
          <Link
            href="/#acceso-rapido"
            onClick={() => setMenuOpen(false)}
            className="block py-2 text-sm font-medium text-slate-300 hover:text-white"
          >
            Plataforma
          </Link>
          <div className="pt-2 flex flex-col gap-2.5">
            <Link
              href="/inscripcion"
              onClick={() => setMenuOpen(false)}
              className="w-full text-center rounded-lg border border-emerald-500/40 bg-emerald-500/10 px-4 py-2.5 text-sm font-semibold text-emerald-300"
            >
              Inscribirse a Equipos
            </Link>
            <Link
              href="/sistema"
              onClick={() => setMenuOpen(false)}
              className="w-full text-center rounded-lg bg-emerald-500 px-4 py-2.5 text-sm font-bold text-slate-950"
            >
              Ingresar al Sistema
            </Link>
          </div>
        </div>
      )}
    </header>
  );
}
