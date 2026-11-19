"use client";

import { FormEvent, useEffect, useState } from "react";
import Link from "next/link";
import { Navbar } from "@/components/Navbar";
import { Footer } from "@/components/Footer";
import {
  AthleteProfile,
  SynergiaState,
  loadSynergiaState,
  saveSynergiaState,
} from "@/lib/synergia-store";
import { CoachDashboard } from "@/components/sistema/CoachDashboard";
import { AthletePortal } from "@/components/sistema/AthletePortal";

type SessionMode =
  | { type: "none" }
  | { type: "coach" }
  | { type: "athlete"; athleteId: string };

export default function SistemaPage() {
  const [state, setState] = useState<SynergiaState | null>(null);
  const [session, setSession] = useState<SessionMode>({ type: "none" });

  const [role, setRole] = useState<"coach" | "atleta">("coach");
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [loginError, setLoginError] = useState<string | null>(null);

  useEffect(() => {
    const raf = requestAnimationFrame(() => {
      setState(loadSynergiaState());
    });
    return () => cancelAnimationFrame(raf);
  }, []);

  function handleLogin(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setLoginError(null);
    if (!state) return;

    if (role === "coach") {
      // Acceso de entrenador / administrador
      if (!username.trim() || !password.trim()) {
        setLoginError("Ingresa tu usuario y contraseña.");
        return;
      }
      setSession({ type: "coach" });
      return;
    }

    // Acceso de atleta: usuario (inicial + apellido) y clave (provisional "123456" o actualizada)
    const found = state.athletes.find(
      (a) =>
        a.username.toLowerCase() === username.trim().toLowerCase() &&
        a.password === password
    );

    if (!found) {
      setLoginError(
        "Usuario o contraseña de atleta incorrectos. Recuerda que el usuario es la inicial del nombre + apellido y la clave provisional es 123456."
      );
      return;
    }

    setSession({ type: "athlete", athleteId: found.athleteId });
  }

  function handleUpdateAthlete(updated: AthleteProfile) {
    if (!state) return;
    const nextState: SynergiaState = {
      ...state,
      athletes: state.athletes.map((a) =>
        a.athleteId === updated.athleteId ? updated : a
      ),
    };
    saveSynergiaState(nextState);
    setState(nextState);
  }

  function handleLogout() {
    setSession({ type: "none" });
    setUsername("");
    setPassword("");
    setLoginError(null);
  }

  if (!state) {
    return (
      <div className="flex min-h-screen flex-col">
        <Navbar />
        <main className="flex-1 flex items-center justify-center text-slate-400 text-sm">
          Cargando sistema SYNERGIA ALL STARS...
        </main>
        <Footer />
      </div>
    );
  }

  const newApplicantsCount = state.applications.filter(
    (a) => a.status === "nuevo"
  ).length;

  const activeAthlete =
    session.type === "athlete"
      ? state.athletes.find((a) => a.athleteId === session.athleteId) ?? null
      : null;

  return (
    <div className="flex min-h-screen flex-col">
      <Navbar />

      <main className="flex-1">
        {session.type === "coach" ? (
          <CoachDashboard
            state={state}
            onStateChange={setState}
            onLogout={handleLogout}
          />
        ) : session.type === "athlete" && activeAthlete ? (
          <AthletePortal
            athlete={activeAthlete}
            onUpdateAthlete={handleUpdateAthlete}
            onLogout={handleLogout}
          />
        ) : (
          <div className="flex items-center justify-center py-16 px-4 sm:px-6 lg:px-8">
            <div className="w-full max-w-md rounded-3xl border border-white/10 bg-[#0D1322] p-8 shadow-2xl">
              <div className="text-center">
                <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-2xl bg-emerald-500/20 text-emerald-400 font-black text-xl">
                  ★
                </div>
                <h1 className="mt-4 text-2xl font-extrabold text-white">
                  SYNERGIA ALL STARS
                </h1>
                <p className="mt-1.5 text-sm text-slate-400">
                  Sistema de Gestión · Escuela Exclusiva de Porrismo
                </p>
              </div>

              {newApplicantsCount > 0 && (
                <div className="mt-5 rounded-xl border border-amber-400/35 bg-amber-400/10 p-3 text-center text-xs font-semibold text-amber-200">
                  Aviso del sistema: hay {newApplicantsCount} aspirante(s)
                  nuevo(s) esperando cita en el módulo INSCRIPCION.
                </div>
              )}

              <form onSubmit={handleLogin} className="mt-6 space-y-5">
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
                    onChange={(e) =>
                      setRole(e.target.value as "coach" | "atleta")
                    }
                    className="mt-1.5 w-full rounded-xl border border-white/15 bg-[#070B14] px-4 py-3 text-sm text-white focus:border-emerald-400 focus:outline-none"
                  >
                    <option value="coach">
                      Entrenador / Administrador / Coordinador
                    </option>
                    <option value="atleta">Atleta Formalizado</option>
                  </select>
                </div>

                <div>
                  <label
                    htmlFor="username"
                    className="block text-sm font-semibold text-slate-200"
                  >
                    Usuario
                  </label>
                  <input
                    id="username"
                    type="text"
                    required
                    value={username}
                    onChange={(e) => setUsername(e.target.value)}
                    placeholder={
                      role === "coach"
                        ? "admin o coach"
                        : "Ej. vmendoza (inicial + apellido)"
                    }
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
                    placeholder={
                      role === "atleta"
                        ? "Clave provisional: 123456"
                        : "••••••••"
                    }
                    className="mt-1.5 w-full rounded-xl border border-white/15 bg-[#070B14] px-4 py-3 text-sm text-white placeholder:text-slate-500 focus:border-emerald-400 focus:outline-none"
                  />
                </div>

                {loginError && (
                  <div className="rounded-xl border border-rose-500/30 bg-rose-500/10 p-3 text-xs text-rose-200">
                    {loginError}
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
                  ¿Eres aspirante? INSCRIBETE
                </Link>
              </div>
            </div>
          </div>
        )}
      </main>

      <Footer />
    </div>
  );
}
