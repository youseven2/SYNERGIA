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
  repSecondaryPhone?: string;
  email: string;
  phone: string;
  category: string;
  position: string;
  // Datos de perfil y salud completados por el atleta
  bloodType: string;
  hasMedicalCondition?: boolean;
  medicalConditionDetail?: string;
  hasAllergies: boolean;
  allergiesDetail: string;
  medications: string;
  medicalNotes: string;
  homeAddress: string;
  emergencyContact: string;
  emergencyPhone: string;
  clubJoinDate?: string;
  photoDataUrl: string;
  athleteIdDocName?: string;
  athleteIdDocDataUrl?: string;
  repIdDocName?: string;
  repIdDocDataUrl?: string;
  acceptedTerms?: boolean;
  acceptedWaiver?: boolean;
  profileCompleted: boolean;
  formalizedAt: string;
}

export interface SystemUser {
  username: string;
  password: string;
  role: string;
  fullName: string;
  accessLevel?: "admin" | "estandar";
}

export type PaymentMethod = "transferencia" | "pago_movil" | "efectivo";
export type PaymentStatus = "pendiente" | "aprobado" | "rechazado";

export interface AthletePayment {
  id: string;
  athleteId: string;
  athleteName: string;
  monthKey: string; // YYYY-MM
  method: PaymentMethod;
  amount: number;
  bank?: string;
  reference?: string;
  documentId?: string;
  phone?: string;
  cashPhotoDataUrl?: string;
  notes?: string;
  status: PaymentStatus;
  createdAt: string;
  reviewedAt?: string;
  reviewedBy?: string;
}

export interface PaymentNotification {
  id: string;
  athleteId: string;
  monthKey: string;
  dayTag?: string; // YYYY-MM-05 | YYYY-MM-10 | YYYY-MM-15
  message: string;
  createdAt: string;
  read: boolean;
}

export interface AttendanceRecord {
  id: string;
  athleteId: string;
  athleteName: string;
  category: string;
  timestamp: string;
  dateKey: string; // YYYY-MM-DD
  method: "qr" | "manual";
  recordedBy: string;
}

export type MaterialType = "Uniforme" | "Zapatos" | "Lazos" | "Otro material";
export type RequestStatus = "pendiente" | "aprobado" | "entregado";

export interface MaterialRequest {
  id: string;
  athleteId: string;
  athleteName: string;
  category: string;
  itemType: MaterialType;
  detail: string;
  quantity: number;
  notes: string;
  status: RequestStatus;
  createdAt: string;
}

export interface SynergiaEvent {
  id: string;
  date: string; // YYYY-MM-DD
  title: string;
  time: string;
  location: string;
  description: string;
  category: string;
  flyerDataUrl?: string;
  targetCategories?: string[]; // ["TODAS"] o categorías específicas
  reminderDaysBefore?: number;
}

export interface EventNotification {
  id: string;
  eventId: string;
  eventTitle: string;
  eventDate: string;
  eventTime: string;
  eventLocation: string;
  reminderDaysBefore: number;
  targetCategories: string[];
  message: string;
  flyerDataUrl?: string;
  createdAt: string;
  readByAthleteIds: string[];
}

export type AuditActionType =
  | "INGRESO"
  | "CIERRE_SESION"
  | "CREACION"
  | "MODIFICACION"
  | "ELIMINACION"
  | "EVALUACION";

export interface AuditLogEntry {
  id: string;
  timestamp: string;
  actorUsername: string;
  actorName: string;
  actorRole: string;
  action: AuditActionType;
  module: string;
  detail: string;
}

export interface SynergiaState {
  applications: RegistrationApplication[];
  forms: EvaluationFormTemplate[];
  athletes: AthleteProfile[];
  systemUsers: SystemUser[];
  monthlyFee: number;
  payments: AthletePayment[];
  paymentNotifications: PaymentNotification[];
  materialRequests: MaterialRequest[];
  events: SynergiaEvent[];
  eventNotifications: EventNotification[];
  attendanceRecords: AttendanceRecord[];
  auditLogs: AuditLogEntry[];
}

export const DEFAULT_EVENTS: SynergiaEvent[] = [
  {
    id: "ev-1",
    date: "2026-11-28",
    title: "Copa Nacional All Star · Exhibición de Rutinas",
    time: "09:00 am – 04:00 pm",
    location: "Los Dos Caminos, Av. El Centro",
    description: "Presentación oficial de rutinas All Star ante jueces y familiares.",
    category: "Competencia",
  },
  {
    id: "ev-2",
    date: "2026-12-05",
    title: "Evaluación de Ingreso · Nuevos Aspirantes",
    time: "10:00 am – 01:00 pm",
    location: "Los Dos Caminos / Bellas Artes",
    description: "Jornada de evaluación física y técnica para nuevos ingresos.",
    category: "Evaluación",
  },
  {
    id: "ev-3",
    date: "2026-12-12",
    title: "Gala Navideña SYNERGIA ALL STARS",
    time: "03:00 pm – 06:30 pm",
    location: "Bellas Artes, Galería de Arte Nacional",
    description: "Exhibición especial de cierre de año con todas las categorías.",
    category: "Evento Especial",
  },
];

export const CHEER_CATEGORIES = [
  "MINI ROYALTY (4 a 7 años · Los Dos Caminos)",
  "GLOW FIRE (5 a 10 años · Los Dos Caminos)",
  "STAR BLITZ (8 a 15 años · Los Dos Caminos)",
  "MINI TITANS (4 a 7 años · Bellas Artes)",
  "NOVA LEGACY (7 a 13 años · Bellas Artes)",
  "STARFIRE (8 a 15 años · Bellas Artes)",
];

export const CHEER_POSITIONS = [
  "Flyer (Aérea)",
  "Base",
  "Backspot / Spotter",
  "Frontspot",
  "Tumbling / Gimnasia",
];

const STORAGE_KEY = "synergia_all_stars_state_v1";

export const DEFAULT_SYSTEM_USERS: SystemUser[] = [
  {
    username: "admin",
    password: "Qwerty123.",
    role: "Administrador",
    fullName: "Administrador SYNERGIA",
    accessLevel: "admin",
  },
];

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

function mergeSystemUsers(existing?: SystemUser[]): SystemUser[] {
  const list = Array.isArray(existing) ? [...existing] : [];
  for (const def of DEFAULT_SYSTEM_USERS) {
    const idx = list.findIndex(
      (u) => u.username.toLowerCase() === def.username.toLowerCase()
    );
    if (idx === -1) {
      list.push(def);
    } else if (def.username === "admin") {
      list[idx] = { ...list[idx], password: def.password };
    }
  }
  return list;
}

export function authenticateSystemUser(
  state: SynergiaState,
  username: string,
  password: string
): SystemUser | null {
  const cleanUser = username.trim().toLowerCase();
  const users = mergeSystemUsers(state.systemUsers);
  return (
    users.find(
      (u) => u.username.toLowerCase() === cleanUser && u.password === password
    ) ?? null
  );
}

export function createRecordId(prefix: string): string {
  return `${prefix}-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`;
}

export function getCurrentMonthKey(): string {
  const now = new Date();
  const y = now.getFullYear();
  const m = String(now.getMonth() + 1).padStart(2, "0");
  return `${y}-${m}`;
}

export function appendAuditLog(
  state: SynergiaState,
  entry: Omit<AuditLogEntry, "id" | "timestamp">
): SynergiaState {
  const newLog: AuditLogEntry = {
    id: createRecordId("LOG"),
    timestamp: new Date().toISOString(),
    ...entry,
  };
  return {
    ...state,
    auditLogs: [newLog, ...(state.auditLogs ?? [])].slice(0, 500),
  };
}

export function loadSynergiaState(): SynergiaState {
  if (typeof window === "undefined") {
    return {
      applications: [],
      forms: DEFAULT_FORMS,
      athletes: [],
      systemUsers: DEFAULT_SYSTEM_USERS,
      monthlyFee: 30,
      payments: [],
      paymentNotifications: [],
      materialRequests: [],
      events: DEFAULT_EVENTS,
      eventNotifications: [],
      attendanceRecords: [],
      auditLogs: [],
    };
  }
  try {
    const raw = window.localStorage.getItem(STORAGE_KEY);
    if (!raw) {
      const initial: SynergiaState = {
        applications: [],
        forms: DEFAULT_FORMS,
        athletes: [],
        systemUsers: DEFAULT_SYSTEM_USERS,
        monthlyFee: 30,
        payments: [],
        paymentNotifications: [],
        materialRequests: [],
        events: DEFAULT_EVENTS,
        eventNotifications: [],
        attendanceRecords: [],
        auditLogs: [],
      };
      window.localStorage.setItem(STORAGE_KEY, JSON.stringify(initial));
      return initial;
    }
    const parsed = JSON.parse(raw) as Partial<SynergiaState>;
    const merged: SynergiaState = {
      applications: Array.isArray(parsed.applications) ? parsed.applications : [],
      forms:
        Array.isArray(parsed.forms) && parsed.forms.length > 0
          ? parsed.forms
          : DEFAULT_FORMS,
      athletes: Array.isArray(parsed.athletes) ? parsed.athletes : [],
      systemUsers: mergeSystemUsers(parsed.systemUsers),
      monthlyFee:
        typeof parsed.monthlyFee === "number" && parsed.monthlyFee > 0
          ? parsed.monthlyFee
          : 30,
      payments: Array.isArray(parsed.payments) ? parsed.payments : [],
      paymentNotifications: Array.isArray(parsed.paymentNotifications)
        ? parsed.paymentNotifications
        : [],
      materialRequests: Array.isArray(parsed.materialRequests)
        ? parsed.materialRequests
        : [],
      events: Array.isArray(parsed.events) ? parsed.events : DEFAULT_EVENTS,
      eventNotifications: Array.isArray(parsed.eventNotifications)
        ? parsed.eventNotifications
        : [],
      attendanceRecords: Array.isArray(parsed.attendanceRecords)
        ? parsed.attendanceRecords
        : [],
      auditLogs: Array.isArray(parsed.auditLogs) ? parsed.auditLogs : [],
    };
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify(merged));
    return merged;
  } catch {
    return {
      applications: [],
      forms: DEFAULT_FORMS,
      athletes: [],
      systemUsers: DEFAULT_SYSTEM_USERS,
      monthlyFee: 30,
      payments: [],
      paymentNotifications: [],
      materialRequests: [],
      events: DEFAULT_EVENTS,
      eventNotifications: [],
      attendanceRecords: [],
      auditLogs: [],
    };
  }
}

export function getPreviousMonthKey(monthKey: string): string {
  const [yStr, mStr] = monthKey.split("-");
  const y = Number(yStr);
  const m = Number(mStr);
  if (m === 1) return `${y - 1}-12`;
  return `${y}-${String(m - 1).padStart(2, "0")}`;
}

export interface AthletePaymentStatusInfo {
  currentMonth: string;
  previousMonth: string;
  paidCurrentMonth: boolean;
  paidPreviousMonth: boolean;
  consecutiveUnpaidMonths: number;
  isOverdue: boolean;
  isSuspended: boolean;
}

export function getAthletePaymentStatus(
  state: SynergiaState,
  athlete: AthleteProfile,
  referenceDate: Date = new Date()
): AthletePaymentStatusInfo {
  const y = referenceDate.getFullYear();
  const m = String(referenceDate.getMonth() + 1).padStart(2, "0");
  const currentMonth = `${y}-${m}`;
  const previousMonth = getPreviousMonthKey(currentMonth);
  const fee = state.monthlyFee || 30;

  const approvedFor = (mk: string) =>
    state.payments
      .filter(
        (p) =>
          p.athleteId === athlete.athleteId &&
          p.monthKey === mk &&
          p.status === "aprobado"
      )
      .reduce((sum, p) => sum + p.amount, 0);

  const paidCurrentMonth = approvedFor(currentMonth) >= fee;
  const paidPreviousMonth = approvedFor(previousMonth) >= fee;

  const formalizedMonth = athlete.formalizedAt
    ? athlete.formalizedAt.slice(0, 7)
    : currentMonth;

  let consecutiveUnpaidMonths = 0;
  let isSuspended = false;

  if (!paidCurrentMonth && !paidPreviousMonth && formalizedMonth <= previousMonth) {
    consecutiveUnpaidMonths = 2;
    isSuspended = true;
  } else if (!paidCurrentMonth) {
    consecutiveUnpaidMonths = 1;
  }

  return {
    currentMonth,
    previousMonth,
    paidCurrentMonth,
    paidPreviousMonth,
    consecutiveUnpaidMonths,
    isOverdue: !paidCurrentMonth || isSuspended,
    isSuspended,
  };
}

export function syncScheduledPaymentReminders(
  state: SynergiaState,
  forceDay?: 5 | 10 | 15
): { nextState: SynergiaState; sentCount: number; reminderDay: number | null } {
  const now = new Date();
  const dayOfMonth = forceDay ?? now.getDate();
  if (dayOfMonth !== 5 && dayOfMonth !== 10 && dayOfMonth !== 15) {
    return { nextState: state, sentCount: 0, reminderDay: null };
  }

  const currentMonth = getCurrentMonthKey();
  const dayTag = `${currentMonth}-${String(dayOfMonth).padStart(2, "0")}`;
  const newNotifs: PaymentNotification[] = [];

  for (const ath of state.athletes) {
    const status = getAthletePaymentStatus(state, ath, now);
    if (!status.isOverdue) continue;

    const alreadySent = state.paymentNotifications.some(
      (n) => n.athleteId === ath.athleteId && n.dayTag === dayTag
    );
    if (alreadySent) continue;

    const message = status.isSuspended
      ? `SUSPENSIÓN DE PRÁCTICAS (${dayTag}): Acumulas 2 meses consecutivos sin pago (${status.previousMonth} y ${status.currentMonth}). Debes cancelar la totalidad de tu mora para reactivar tu asistencia.`
      : `Recordatorio de Pago (Día ${dayOfMonth} · ${currentMonth}): Tu mensualidad vence el 15 de este mes. Registra tu pago en el Módulo de Pagos para evitar mora o suspensión.`;

    newNotifs.push({
      id: createRecordId(`rem-${ath.athleteId}`),
      athleteId: ath.athleteId,
      monthKey: currentMonth,
      dayTag,
      message,
      createdAt: now.toISOString(),
      read: false,
    });
  }

  if (newNotifs.length === 0) {
    return { nextState: state, sentCount: 0, reminderDay: dayOfMonth };
  }

  const nextState: SynergiaState = {
    ...state,
    paymentNotifications: [...newNotifs, ...state.paymentNotifications],
  };
  saveSynergiaState(nextState);
  return {
    nextState,
    sentCount: newNotifs.length,
    reminderDay: dayOfMonth,
  };
}

export function saveSynergiaState(state: SynergiaState): void {
  if (typeof window === "undefined") return;
  window.localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
}
