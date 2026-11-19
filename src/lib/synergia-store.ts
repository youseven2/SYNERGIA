export type ApplicationStatus =
  | "nuevo"
  | "cita_asignada"
  | "evaluado"
  | "formalizado";

export interface EvaluationActivity {
  id: string;
  description: string;
  weight: number;
}

export interface EvaluationFormTemplate {
  id: string;
  name: string;
  category: string;
  isDefault?: boolean;
  activities: EvaluationActivity[];
}

export interface ActivityScore {
  activityId: string;
  description: string;
  weight: number;
  checked: boolean;
  score: number;
}

export interface AthleteEvaluation {
  formId: string;
  formName: string;
  category: string;
  evaluatedAt: string;
  items: ActivityScore[];
  totalScore: number;
  maxScore: number;
  coachNotes: string;
}

export interface RegistrationApplication {
  id: string;
  trackingCode: string;
  createdAt: string;
  birthDate: string;
  age: number;
  isMinor: boolean;
  isUnderNine: boolean;
  repName?: string;
  repDocumentId?: string;
  repRelationship?: string;
  repPhone?: string;
  repEmail?: string;
  fullName: string;
  documentId: string;
  email: string;
  phone: string;
  notes: string;
  status: ApplicationStatus;
  appointmentDate?: string;
  appointmentTime?: string;
  assignedFormId?: string;
  assignedCategory?: string;
  assignedPosition?: string;
  evaluation?: AthleteEvaluation;
}

export interface AthleteProfile {
  athleteId: string; // Cedula + correlativo, ej. V-28450123-001
  correlativeNumber: number;
  applicationId: string;
  username: string; // Inicial del nombre + apellido
  password: string; // Clave provisional "123456"
  mustChangePassword: boolean;
  fullName: string;
  documentId: string;
  birthDate: string;
  age: number;
  isMinor: boolean;
  repName?: string;
  repDocumentId?: string;
  repPhone?: string;
  email: string;
  phone: string;
  category: string;
  position: string;
  // Datos de perfil y salud completados por el atleta
  bloodType: string;
  hasAllergies: boolean;
  allergiesDetail: string;
  medications: string;
  medicalNotes: string;
  homeAddress: string;
  emergencyContact: string;
  emergencyPhone: string;
  photoDataUrl: string;
  profileCompleted: boolean;
  formalizedAt: string;
}

export interface SynergiaState {
  applications: RegistrationApplication[];
  forms: EvaluationFormTemplate[];
  athletes: AthleteProfile[];
}

export const CHEER_CATEGORIES = [
  "Tiny & Mini All Stars (Nivel 1)",
  "Youth Cheer (Nivel 1 – 2)",
  "Junior All Stars (Nivel 2 – 3)",
  "Senior All Girl (Nivel 3 – 4)",
  "Senior & Open Coed (Nivel 3 – 5)",
  "Academia de Tumbling & Stunts",
];

export const CHEER_POSITIONS = [
  "Flyer (Aérea)",
  "Base",
  "Backspot / Spotter",
  "Frontspot",
  "Tumbling / Gimnasia",
];

const STORAGE_KEY = "synergia_all_stars_state_v1";

const DEFAULT_FORMS: EvaluationFormTemplate[] = [
  {
    id: "form-default-nivel-1",
    name: "Evaluación General Nivel 1 (Iniciación)",
    category: "Tiny & Mini All Stars (Nivel 1)",
    isDefault: true,
    activities: [
      { id: "act-1", description: "Coordinación rítmica y conteo musical", weight: 25 },
      { id: "act-2", description: "Flexibilidad básica (Split y puente)", weight: 25 },
      { id: "act-3", description: "Saltos básicos (T-Jump / Toe Touch)", weight: 25 },
      { id: "act-4", description: "Actitud, postura y trabajo en equipo", weight: 25 },
    ],
  },
  {
    id: "form-default-competitivo",
    name: "Evaluación Competitiva (Niveles 2 – 5)",
    category: "Junior All Stars (Nivel 2 – 3)",
    isDefault: true,
    activities: [
      { id: "act-c1", description: "Técnica de Stunts (Base / Flyer / Backspot)", weight: 30 },
      { id: "act-c2", description: "Tumbling en piso (Rondada / Flic-flac)", weight: 30 },
      { id: "act-c3", description: "Altura y técnica de saltos (Toe Touch / Pike)", weight: 20 },
      { id: "act-c4", description: "Resistencia física y proyección escénica", weight: 20 },
    ],
  },
];

export function calculateAge(birthDateStr: string): number | null {
  if (!birthDateStr) return null;
  const birth = new Date(`${birthDateStr}T00:00:00`);
  if (Number.isNaN(birth.getTime())) return null;

  const today = new Date();
  let age = today.getFullYear() - birth.getFullYear();
  const monthDiff = today.getMonth() - birth.getMonth();
  if (
    monthDiff < 0 ||
    (monthDiff === 0 && today.getDate() < birth.getDate())
  ) {
    age--;
  }
  return age >= 0 ? age : null;
}

function normalizeText(str: string): string {
  return str
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .replace(/[^a-z0-9]/g, "");
}

export function generateAthleteUsername(
  fullName: string,
  existingAthletes: AthleteProfile[]
): string {
  const parts = fullName.trim().split(/\s+/).filter(Boolean);
  const firstInitial = parts[0] ? normalizeText(parts[0]).slice(0, 1) : "a";
  const lastName =
    parts.length > 1 ? normalizeText(parts[parts.length - 1]) : "atleta";
  const base = `${firstInitial}${lastName}`;

  let candidate = base;
  let counter = 2;
  while (existingAthletes.some((a) => a.username === candidate)) {
    candidate = `${base}${counter}`;
    counter++;
  }
  return candidate;
}

export function generateAthleteId(
  documentId: string,
  existingAthletes: AthleteProfile[]
): { athleteId: string; correlativeNumber: number } {
  const correlativeNumber = existingAthletes.length + 1;
  const cleanDoc = documentId.trim().toUpperCase().replace(/\s+/g, "");
  const padded = String(correlativeNumber).padStart(3, "0");
  return {
    athleteId: `${cleanDoc}-${padded}`,
    correlativeNumber,
  };
}

export function loadSynergiaState(): SynergiaState {
  if (typeof window === "undefined") {
    return { applications: [], forms: DEFAULT_FORMS, athletes: [] };
  }
  try {
    const raw = window.localStorage.getItem(STORAGE_KEY);
    if (!raw) {
      const initial: SynergiaState = {
        applications: [],
        forms: DEFAULT_FORMS,
        athletes: [],
      };
      window.localStorage.setItem(STORAGE_KEY, JSON.stringify(initial));
      return initial;
    }
    const parsed = JSON.parse(raw) as Partial<SynergiaState>;
    return {
      applications: Array.isArray(parsed.applications) ? parsed.applications : [],
      forms:
        Array.isArray(parsed.forms) && parsed.forms.length > 0
          ? parsed.forms
          : DEFAULT_FORMS,
      athletes: Array.isArray(parsed.athletes) ? parsed.athletes : [],
    };
  } catch {
    return { applications: [], forms: DEFAULT_FORMS, athletes: [] };
  }
}

export function saveSynergiaState(state: SynergiaState): void {
  if (typeof window === "undefined") return;
  window.localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
}
