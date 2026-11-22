export interface AnalyticsState {
  totalVisits: number;
  totalDurationSeconds: number;
  sectionViews: Record<string, number>;
  visitsByCountry: Record<string, number>;
  lastUpdatedAt: string;
}

const ANALYTICS_KEY = "synergia_analytics_v1";

const DEFAULT_ANALYTICS: AnalyticsState = {
  totalVisits: 0,
  totalDurationSeconds: 0,
  sectionViews: {
    "Inicio": 0,
    "Galería": 0,
    "Equipos Cheer": 0,
    "Eventos": 0,
    "Conócenos": 0,
    "Inscripción": 0,
    "Sistema": 0,
  },
  visitsByCountry: {},
  lastUpdatedAt: "",
};

export function detectVisitorCountry(): string {
  if (typeof window === "undefined") return "Desconocido";
  try {
    const tz = Intl.DateTimeFormat().resolvedOptions().timeZone || "";
    const tzMap: Record<string, string> = {
      "America/Caracas": "Venezuela",
      "America/Bogota": "Colombia",
      "America/Lima": "Perú",
      "America/Santiago": "Chile",
      "America/Argentina/Buenos_Aires": "Argentina",
      "America/Mexico_City": "México",
      "America/Panama": "Panamá",
      "America/Santo_Domingo": "República Dominicana",
      "America/New_York": "Estados Unidos",
      "America/Chicago": "Estados Unidos",
      "America/Los_Angeles": "Estados Unidos",
      "Europe/Madrid": "España",
    };
    if (tzMap[tz]) return tzMap[tz];
    if (tz.startsWith("America/")) return tz.replace("America/", "").replace(/_/g, " ");
    if (tz.startsWith("Europe/")) return tz.replace("Europe/", "").replace(/_/g, " ");

    const lang = (navigator.language || "").toUpperCase();
    if (lang.includes("-VE")) return "Venezuela";
    if (lang.includes("-CO")) return "Colombia";
    if (lang.includes("-US")) return "Estados Unidos";
    if (lang.includes("-ES")) return "España";
    if (lang.includes("-MX")) return "México";
    return "Internacional";
  } catch {
    return "Internacional";
  }
}

export function loadAnalyticsState(): AnalyticsState {
  if (typeof window === "undefined") return DEFAULT_ANALYTICS;
  try {
    const raw = window.localStorage.getItem(ANALYTICS_KEY);
    if (!raw) {
      window.localStorage.setItem(ANALYTICS_KEY, JSON.stringify(DEFAULT_ANALYTICS));
      return DEFAULT_ANALYTICS;
    }
    const parsed = JSON.parse(raw) as Partial<AnalyticsState>;
    return {
      totalVisits: typeof parsed.totalVisits === "number" ? parsed.totalVisits : 0,
      totalDurationSeconds:
        typeof parsed.totalDurationSeconds === "number"
          ? parsed.totalDurationSeconds
          : 0,
      sectionViews: {
        ...DEFAULT_ANALYTICS.sectionViews,
        ...(parsed.sectionViews ?? {}),
      },
      visitsByCountry: parsed.visitsByCountry ?? {},
      lastUpdatedAt: parsed.lastUpdatedAt ?? "",
    };
  } catch {
    return DEFAULT_ANALYTICS;
  }
}

export function saveAnalyticsState(state: AnalyticsState): void {
  if (typeof window === "undefined") return;
  window.localStorage.setItem(ANALYTICS_KEY, JSON.stringify(state));
}

export function recordVisit(): void {
  const current = loadAnalyticsState();
  const country = detectVisitorCountry();
  const next: AnalyticsState = {
    ...current,
    totalVisits: current.totalVisits + 1,
    visitsByCountry: {
      ...current.visitsByCountry,
      [country]: (current.visitsByCountry[country] ?? 0) + 1,
    },
    lastUpdatedAt: new Date().toISOString(),
  };
  saveAnalyticsState(next);
}

export function recordDurationSeconds(seconds: number): void {
  if (seconds <= 0) return;
  const current = loadAnalyticsState();
  saveAnalyticsState({
    ...current,
    totalDurationSeconds: current.totalDurationSeconds + seconds,
    lastUpdatedAt: new Date().toISOString(),
  });
}

export function recordSectionView(sectionName: string): void {
  const current = loadAnalyticsState();
  saveAnalyticsState({
    ...current,
    sectionViews: {
      ...current.sectionViews,
      [sectionName]: (current.sectionViews[sectionName] ?? 0) + 1,
    },
    lastUpdatedAt: new Date().toISOString(),
  });
}

export function resetAnalyticsState(): AnalyticsState {
  const fresh: AnalyticsState = {
    ...DEFAULT_ANALYTICS,
    lastUpdatedAt: new Date().toISOString(),
  };
  saveAnalyticsState(fresh);
  return fresh;
}

export function formatDuration(totalSec: number): string {
  const secs = Math.max(0, Math.round(totalSec));
  const mins = Math.floor(secs / 60);
  const rem = secs % 60;
  if (mins === 0) return `${rem}s`;
  const hrs = Math.floor(mins / 60);
  const remMins = mins % 60;
  if (hrs === 0) return `${mins}m ${rem}s`;
  return `${hrs}h ${remMins}m ${rem}s`;
}
