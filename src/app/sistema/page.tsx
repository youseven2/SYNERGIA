"use client";

import { FormEvent, useCallback, useEffect, useRef, useState } from "react";
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

const SESSION_STORAGE_KEY = "synergia_active_session_v1";
const COACH_TAB_STORAGE_KEY = "synergia_coach_active_tab";
const INACTIVITY_LIMIT_MS = 10 * 60 * 1000; // 10 minutos

type SessionMode =
  | { type: "none" }
  | { type: "coach"; user: SystemUser }
  | { type: "athlete"; athleteId: string };

interface StoredSessionPayload {
  session: SessionMode;
  lastActivity: number;
}

export default function SistemaPage() {
  const [state, setState] = useState<SynergiaState | null>(null);
  const [session, setSession] = useState<SessionMode>({ type: "none" });

  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [loginError, setLoginError] = useState<string | null>(null);

  const { t } = useI18n();
  const { deviceType, isMobile } = useDevice();
  const lastActivityRef = useRef<number>(0);

  const persistSession = useCallback((nextSession: SessionMode) => {
    if (typeof window === "undefined") return;
    if (nextSession.type === "none") {
      window.localStorage.removeItem(SESSION_STORAGE_KEY);
      window.sessionStorage.removeItem(COACH_TAB_STORAGE_KEY);
      return;
    }
    const now = Date.now();
    lastActivityRef.current = now;
    const payload: StoredSessionPayload = { session: nextSession, lastActivity: now };
    window.localStorage.setItem(SESSION_STORAGE_KEY, JSON.stringify(payload));
  }, []);

  const handleLogout = useCallback(
    (inactivityReason?: string) => {
      persistSession({ type: "none" });
      setSession({ type: "none" });
      setUsername("");
      setPassword("");
      setLoginError(inactivityReason ?? null);
    },
    [persistSession]
  );

  useEffect(() => {
    const raf = requestAnimationFrame(() => {
      const loadedState = loadSynergiaState();
      setState(loadedState);

      try {
        const raw = window.localStorage.getItem(SESSION_STORAGE_KEY);
        if (!raw) return;
        const parsed = JSON.parse(raw) as StoredSessionPayload;
        if (!parsed?.session || parsed.session.type === "none") {
          window.localStorage.removeItem(SESSION_STORAGE_KEY);
          return;
        }

        const now = Date.now();
        if (now - parsed.lastActivity >= INACTIVITY_LIMIT_MS) {
          window.localStorage.removeItem(SESSION_STORAGE_KEY);
          window.sessionStorage.removeItem(COACH_TAB_STORAGE_KEY);
          setLoginError(
            t(
              "Tu sesión se cerró automáticamente por seguridad tras 10 minutos de inactividad.",
              "Your session was automatically closed after 10 minutes of inactivity for security."
            )
          );
          return;
        }

        if (parsed.session.type === "coach") {
          const savedUsername = parsed.session.user.username.toLowerCase();
          const validCoach = loadedState.systemUsers.find(
            (u) => u.username.toLowerCase() === savedUsername
          );
          if (validCoach) {
            const restored: SessionMode = { type: "coach", user: validCoach };
            persistSession(restored);
            setSession(restored);
            return;
          }
        } else if (parsed.session.type === "athlete") {
          const savedAthleteId = parsed.session.athleteId;
          const validAthlete = loadedState.athletes.find(
            (a) => a.athleteId === savedAthleteId
          );
          if (validAthlete) {
            const restored: SessionMode = {
              type: "athlete",
              athleteId: validAthlete.athleteId,
            };
            persistSession(restored);
            setSession(restored);
            return;
          }
        }

        window.localStorage.removeItem(SESSION_STORAGE_KEY);
      } catch {
        window.localStorage.removeItem(SESSION_STORAGE_KEY);
      }
    });
    return () => cancelAnimationFrame(raf);
  }, [persistSession, t]);

  // Cierre automático de sesión por inactividad (> 10 minutos)
  useEffect(() => {
    if (session.type === "none") return;

    lastActivityRef.current = Date.now();
    let lastSynced = Date.now();

    const recordActivity = () => {
      const now = Date.now();
      lastActivityRef.current = now;
      if (now - lastSynced >= 5000) {
        lastSynced = now;
        try {
          const payload: StoredSessionPayload = { session, lastActivity: now };
          window.localStorage.setItem(
            SESSION_STORAGE_KEY,
            JSON.stringify(payload)
          );
        } catch {
          // ignore storage errors
        }
      }
    };

    const events: Array<keyof WindowEventMap> = [
      "mousemove",
      "mousedown",
      "keydown",
      "touchstart",
      "scroll",
      "click",
    ];
    events.forEach((ev) =>
      window.addEventListener(ev, recordActivity, { passive: true })
    );

    const intervalId = window.setInterval(() => {
      if (Date.now() - lastActivityRef.current >= INACTIVITY_LIMIT_MS) {
        handleLogout(
          t(
            "Tu sesión se cerró automáticamente por seguridad tras 10 minutos de inactividad.",
            "Your session was automatically closed after 10 minutes of inactivity for security."
          )
        );
      }
    }, 15000);

    return () => {
      events.forEach((ev) => window.removeEventListener(ev, recordActivity));
      window.clearInterval(intervalId);
    };
  }, [session, handleLogout, t]);

  function handleLogin(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setLoginError(null);

    const cleanUser = username.trim().toLowerCase();
    const cleanPass = password.trim();
    if (!cleanUser || !cleanPass) {
      setLoginError(
        t(
          "Ingresa tu usuario y contraseña.",
          "Enter your username and password."
        )
      );
      return;
    }

    const freshState = loadSynergiaState();
    setState(freshState);

    // 1. Detectar automáticamente si corresponde a Entrenador / Administrador
    const authenticatedSystemUser = authenticateSystemUser(
      freshState,
      cleanUser,
      cleanPass
    );
    if (authenticatedSystemUser) {
      const nextSession: SessionMode = {
        type: "coach",
        user: authenticatedSystemUser,
      };
      persistSession(nextSession);
      setSession(nextSession);
      return;
    }

    // 2. Detectar automáticamente si corresponde a un Atleta formalizado
    const foundAthlete = freshState.athletes.find(
      (a) =>
        a.username.trim().toLowerCase() === cleanUser &&
        a.password.trim() === cleanPass
    );
    if (foundAthlete) {
      const nextSession: SessionMode = {
        type: "athlete",
        athleteId: foundAthlete.athleteId,
      };
      persistSession(nextSession);
      setSession(nextSession);
      return;
    }

    setLoginError(
      t(
        "Usuario o contraseña incorrectos. Verifica tus credenciales de acceso.",
        "Invalid username or password. Please verify your access credentials."
      )
    );
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
            onLogout={() => handleLogout()}
            currentUser={session.user}
          />
        ) : session.type === "athlete" && activeAthlete ? (
          <AthletePortal
            athlete={activeAthlete}
            state={state}
            onStateChange={setState}
            onUpdateAthlete={handleUpdateAthlete}
            onLogout={() => handleLogout()}
          />
        ) : (
          <div
            className={`flex items-center justify-center px-4 sm:px-6 lg:px-8 ${
              isMobile ? "py-10" : "py-16"
            }`}
          >
            <div className="w-full max-w-md rounded-3xl border border-white/10 bg-[#0D1322] p-6 sm:p-8 shadow-2xl">
              <div className="text-center">
                <h1 className="sr-only">SYNERGIA ALL STARS</h1>
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src="/synergia-logo.svg"
                  alt="SYNERGIA ALL STARS"
                  className="mx-auto h-16 sm:h-20 w-auto object-contain"
                />
                <p className="mt-2.5 text-sm text-slate-400">
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

              <form onSubmit={handleLogin} className="mt-6 space-y-5">
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
                    placeholder={t("Ingresa tu usuario", "Enter your username")}
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
                    placeholder="••••••••"
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
