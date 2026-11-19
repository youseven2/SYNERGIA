"use client";

import { FormEvent, useEffect, useState } from "react";
import Link from "next/link";
import { Navbar } from "@/components/Navbar";
import { Footer } from "@/components/Footer";
import {
  AthleteProfile,
  SynergiaState,
  SystemUser,
  authenticateSystemUser,
  loadSynergiaState,
  saveSynergiaState,
} from "@/lib/synergia-store";
import { CoachDashboard } from "@/components/sistema/CoachDashboard";
import { AthletePortal } from "@/components/sistema/AthletePortal";
import { useI18n } from "@/components/I18nContext";
import { useDevice } from "@/components/DeviceContext";

type SessionMode =
  | { type: "none" }
  | { type: "coach"; user: SystemUser }
  | { type: "athlete"; athleteId: string };

export default function SistemaPage() {
  const [state, setState] = useState<SynergiaState | null>(null);
  const [session, setSession] = useState<SessionMode>({ type: "none" });

  const [role, setRole] = useState<"coach" | "atleta">("coach");
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [loginError, setLoginError] = useState<string | null>(null);

  const { t } = useI18n();
  const { deviceType, isMobile } = useDevice();

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
      if (!username.trim() || !password.trim()) {
        setLoginError(
          t(
            "Ingresa tu usuario y contraseña.",
            "Enter your username and password."
          )
        );
        return;
      }
      const authenticated = authenticateSystemUser(state, username, password);
      if (!authenticated) {
        setLoginError(
          t(
            "Usuario o contraseña incorrectos. Verifica tus credenciales de acceso.",
            "Invalid username or password. Please verify your access credentials."
          )
        );
        return;
      }
      setSession({ type: "coach", user: authenticated });
      return;
    }

    const found = state.athletes.find(
      (a) =>
        a.username.toLowerCase() === username.trim().toLowerCase() &&
        a.password === password
    );

    if (!found) {
      setLoginError(
        t(
          "Usuario o contraseña de atleta incorrectos. Recuerda que el usuario es la inicial del nombre + apellido y la clave provisional es 123456.",
          "Incorrect athlete username or password. Remember the username is first initial + last name and the provisional password is 123456."
        )
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
        <main className="flex-1 flex items-center justify-center text-slate-400 text-sm px-4 text-center">
          {t(
            "Cargando sistema SYNERGIA ALL STARS...",
            "Loading SYNERGIA ALL STARS system..."
          )}
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

  const deviceLabel =
    deviceType === "mobile"
      ? t("Celular", "Mobile")
      : deviceType === "tablet"
      ? t("Tablet", "Tablet")
      : t("Computadora", "Desktop");

  return (
    <div className="flex min-h-screen flex-col">
      <Navbar />

      <main className="flex-1">
        {session.type === "coach" ? (
          <CoachDashboard
            state={state}
            onStateChange={setState}
            onLogout={handleLogout}
            currentUser={session.user}
          />
        ) : session.type === "athlete" && activeAthlete ? (
          <AthletePortal
            athlete={activeAthlete}
            onUpdateAthlete={handleUpdateAthlete}
            onLogout={handleLogout}
          />
        ) : (
          <div
            className={`flex items-center justify-center px-4 sm:px-6 lg:px-8 ${
              isMobile ? "py-10" : "py-16"
            }`}
          >
            <div className="w-full max-w-md rounded-3xl border border-white/10 bg-[#0D1322] p-6 sm:p-8 shadow-2xl">
              <div className="text-center">
                <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-2xl bg-emerald-500/20 text-emerald-400 font-black text-xl">
                  ★
                </div>
                <h1 className="mt-4 text-2xl font-extrabold text-white">
                  SYNERGIA ALL STARS
                </h1>
                <p className="mt-1.5 text-sm text-slate-400">
                  {t(
                    "Sistema de Gestión · Escuela Exclusiva de Porrismo",
                    "Management System · Exclusive Cheerleading Academy"
                  )}
                </p>
                <div className="mt-2.5 inline-flex items-center gap-1.5 rounded-full border border-white/10 bg-white/[0.04] px-3 py-1 text-[11px] font-medium text-slate-300">
                  <span className="h-1.5 w-1.5 rounded-full bg-emerald-400" />
                  {t("Vista adaptada para", "View adapted for")}: {deviceLabel}
                </div>
              </div>

              {newApplicantsCount > 0 && (
                <div className="mt-5 rounded-xl border border-amber-400/35 bg-amber-400/10 p-3 text-center text-xs font-semibold text-amber-200">
                  {t(
                    `Aviso del sistema: hay ${newApplicantsCount} aspirante(s) nuevo(s) esperando cita en el módulo INSCRIPCION.`,
                    `System notice: ${newApplicantsCount} new applicant(s) waiting for an appointment in the REGISTRATION module.`
                  )}
                </div>
              )}

              <form onSubmit={handleLogin} className="mt-6 space-y-5">
                <div>
                  <label
                    htmlFor="role"
                    className="block text-sm font-semibold text-slate-200"
                  >
                    {t("Tipo de acceso", "Access type")}
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
                      {t(
                        "Entrenador / Administrador / Coordinador",
                        "Coach / Administrator / Coordinator"
                      )}
                    </option>
                    <option value="atleta">
                      {t("Atleta Formalizado", "Formalized Athlete")}
                    </option>
                  </select>
                </div>

                <div>
                  <label
                    htmlFor="username"
                    className="block text-sm font-semibold text-slate-200"
                  >
                    {t("Usuario", "Username")}
                  </label>
                  <input
                    id="username"
                    type="text"
                    required
                    value={username}
                    onChange={(e) => setUsername(e.target.value)}
                    placeholder={
                      role === "coach"
                        ? "admin"
                        : t(
                            "Ej. vmendoza (inicial + apellido)",
                            "E.g. vmendoza (initial + last name)"
                          )
                    }
                    className="mt-1.5 w-full rounded-xl border border-white/15 bg-[#070B14] px-4 py-3 text-sm text-white placeholder:text-slate-500 focus:border-emerald-400 focus:outline-none"
                  />
                </div>

                <div>
                  <label
                    htmlFor="password"
                    className="block text-sm font-semibold text-slate-200"
                  >
                    {t("Contraseña", "Password")}
                  </label>
                  <input
                    id="password"
                    type="password"
                    required
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder={
                      role === "atleta"
                        ? t("Clave provisional: 123456", "Provisional password: 123456")
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
                  {t("Ingresar al Sistema", "Sign In")}
                </button>
              </form>

              <div className="mt-6 border-t border-white/10 pt-5 flex flex-wrap items-center justify-between gap-2 text-xs text-slate-400">
                <Link href="/" className="hover:text-white transition-colors">
                  {t("← Volver al inicio", "← Back to home")}
                </Link>
                <Link
                  href="/inscripcion"
                  className="text-amber-300 hover:text-amber-200 transition-colors"
                >
                  {t("¿Eres aspirante? INSCRIBETE", "New applicant? REGISTER")}
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
