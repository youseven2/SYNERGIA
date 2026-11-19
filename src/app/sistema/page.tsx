"use client";

import { FormEvent, useState } from "react";
import Link from "next/link";
import { Navbar } from "@/components/Navbar";
import { Footer } from "@/components/Footer";

export default function SistemaPage() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [role, setRole] = useState("administrador");
  const [statusMessage, setStatusMessage] = useState<string | null>(null);

  function handleLogin(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setStatusMessage(
      `Acceso preparado para ${email} (${role}) en SYNERGIA ALL STARS. En los siguientes pasos conectaremos la autenticación y el panel del sistema.`
    );
  }

  return (
    <div className="flex min-h-screen flex-col">
      <Navbar />

      <main className="flex-1 flex items-center justify-center py-16 px-4 sm:px-6 lg:px-8">
        <div className="w-full max-w-md rounded-3xl border border-white/10 bg-[#0D1322] p-8 shadow-2xl">
          <div className="text-center">
            <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-2xl bg-emerald-500/20 text-emerald-400 font-black text-xl">
              ★
            </div>
            <h1 className="mt-4 text-2xl font-extrabold text-white">
              SYNERGIA ALL STARS
            </h1>
            <p className="mt-1.5 text-sm text-slate-400">
              Sistema de Gestión · Escuela de Porrismo
            </p>
          </div>

          <form onSubmit={handleLogin} className="mt-8 space-y-5">
            <div>
              <label
                htmlFor="role"
                className="block text-sm font-semibold text-slate-200"
              >
                Tipo de acceso
              </label>
              <select
                id="role"
                value={role}
                onChange={(e) => setRole(e.target.value)}
                className="mt-1.5 w-full rounded-xl border border-white/15 bg-[#070B14] px-4 py-3 text-sm text-white focus:border-emerald-400 focus:outline-none"
              >
                <option value="administrador">Administrador</option>
                <option value="coach">Coach / Entrenador de Cheer</option>
                <option value="coordinador">Coordinador de Equipos</option>
              </select>
            </div>

            <div>
              <label
                htmlFor="email"
                className="block text-sm font-semibold text-slate-200"
              >
                Correo electrónico o usuario
              </label>
              <input
                id="email"
                type="text"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="coach@synergiaallstars.com"
                className="mt-1.5 w-full rounded-xl border border-white/15 bg-[#070B14] px-4 py-3 text-sm text-white placeholder:text-slate-500 focus:border-emerald-400 focus:outline-none"
              />
            </div>

            <div>
              <label
                htmlFor="password"
                className="block text-sm font-semibold text-slate-200"
              >
                Contraseña
              </label>
              <input
                id="password"
                type="password"
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••"
                className="mt-1.5 w-full rounded-xl border border-white/15 bg-[#070B14] px-4 py-3 text-sm text-white placeholder:text-slate-500 focus:border-emerald-400 focus:outline-none"
              />
            </div>

            {statusMessage && (
              <div className="rounded-xl border border-emerald-500/30 bg-emerald-500/10 p-3.5 text-xs leading-relaxed text-emerald-200">
                {statusMessage}
              </div>
            )}

            <button
              type="submit"
              className="w-full rounded-xl bg-emerald-500 py-3.5 text-sm font-bold text-slate-950 shadow-lg shadow-emerald-500/20 hover:bg-emerald-400 transition-all cursor-pointer"
            >
              Ingresar al Sistema
            </button>
          </form>

          <div className="mt-6 border-t border-white/10 pt-5 flex items-center justify-between text-xs text-slate-400">
            <Link href="/" className="hover:text-white transition-colors">
              ← Volver al inicio
            </Link>
            <Link
              href="/inscripcion"
              className="text-amber-300 hover:text-amber-200 transition-colors"
            >
              ¿Eres atleta? Inscríbete aquí
            </Link>
          </div>
        </div>
      </main>

      <Footer />
    </div>
  );
}
