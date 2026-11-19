"use client";

import { ChangeEvent, FormEvent, useState } from "react";
import { AthleteProfile } from "@/lib/synergia-store";
import { AthleteCarnet } from "@/components/AthleteCarnet";

interface AthletePortalProps {
  athlete: AthleteProfile;
  onUpdateAthlete: (updated: AthleteProfile) => void;
  onLogout: () => void;
}

const BLOOD_TYPES = ["O+", "O-", "A+", "A-", "B+", "B-", "AB+", "AB-"];

export function AthletePortal({
  athlete,
  onUpdateAthlete,
  onLogout,
}: AthletePortalProps) {
  // Cambio de clave obligatorio si tiene clave provisional
  const [newPass, setNewPass] = useState("");
  const [confirmPass, setConfirmPass] = useState("");
  const [passError, setPassError] = useState<string | null>(null);

  // Formulario de perfil y salud
  const [bloodType, setBloodType] = useState(athlete.bloodType || "O+");
  const [hasAllergies, setHasAllergies] = useState(athlete.hasAllergies);
  const [allergiesDetail, setAllergiesDetail] = useState(
    athlete.allergiesDetail
  );
  const [medications, setMedications] = useState(athlete.medications);
  const [medicalNotes, setMedicalNotes] = useState(athlete.medicalNotes);
  const [homeAddress, setHomeAddress] = useState(athlete.homeAddress);
  const [emergencyContact, setEmergencyContact] = useState(
    athlete.emergencyContact
  );
  const [emergencyPhone, setEmergencyPhone] = useState(athlete.emergencyPhone);
  const [photoDataUrl, setPhotoDataUrl] = useState(athlete.photoDataUrl);
  const [savedSuccess, setSavedSuccess] = useState(false);

  function handlePasswordChange(e: FormEvent) {
    e.preventDefault();
    setPassError(null);
    if (newPass.length < 6) {
      setPassError("La nueva clave debe tener al menos 6 caracteres.");
      return;
    }
    if (newPass === "123456") {
      setPassError("Debes elegir una clave distinta a la provisional (123456).");
      return;
    }
    if (newPass !== confirmPass) {
      setPassError("Las contraseñas no coinciden.");
      return;
    }
    onUpdateAthlete({
      ...athlete,
      password: newPass,
      mustChangePassword: false,
    });
  }

  function handlePhotoUpload(e: ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = () => {
      if (typeof reader.result === "string") {
        setPhotoDataUrl(reader.result);
      }
    };
    reader.readAsDataURL(file);
  }

  function handleSaveProfile(e: FormEvent) {
    e.preventDefault();
    onUpdateAthlete({
      ...athlete,
      bloodType,
      hasAllergies,
      allergiesDetail: hasAllergies ? allergiesDetail.trim() : "",
      medications: medications.trim(),
      medicalNotes: medicalNotes.trim(),
      homeAddress: homeAddress.trim(),
      emergencyContact: emergencyContact.trim(),
      emergencyPhone: emergencyPhone.trim(),
      photoDataUrl,
      profileCompleted: true,
    });
    setSavedSuccess(true);
  }

  if (athlete.mustChangePassword) {
    return (
      <div className="mx-auto max-w-md py-16 px-4">
        <div className="rounded-3xl border border-amber-400/30 bg-[#0D1322] p-8 shadow-2xl space-y-5">
          <div>
            <span className="text-[11px] font-bold uppercase tracking-wider text-amber-300">
              Primer Ingreso · Cambio de Clave Obligatorio
            </span>
            <h1 className="mt-1 text-2xl font-extrabold text-white">
              Hola, {athlete.fullName}
            </h1>
            <p className="mt-2 text-xs text-slate-300">
              Ingresaste con tu clave provisional (<strong>123456</strong>).
              Por seguridad, debes crear tu nueva contraseña personal para
              continuar a tu perfil.
            </p>
          </div>

          <form onSubmit={handlePasswordChange} className="space-y-4">
            <div>
              <label className="block text-xs font-semibold text-slate-200">
                Nueva contraseña *
              </label>
              <input
                type="password"
                required
                value={newPass}
                onChange={(e) => setNewPass(e.target.value)}
                placeholder="Mínimo 6 caracteres"
                className="mt-1.5 w-full rounded-xl border border-white/15 bg-[#070B14] px-4 py-3 text-sm text-white focus:border-emerald-400 focus:outline-none"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-200">
                Confirmar nueva contraseña *
              </label>
              <input
                type="password"
                required
                value={confirmPass}
                onChange={(e) => setConfirmPass(e.target.value)}
                placeholder="Repite tu nueva contraseña"
                className="mt-1.5 w-full rounded-xl border border-white/15 bg-[#070B14] px-4 py-3 text-sm text-white focus:border-emerald-400 focus:outline-none"
              />
            </div>

            {passError && (
              <div className="rounded-xl border border-rose-500/30 bg-rose-500/10 p-3 text-xs text-rose-200">
                {passError}
              </div>
            )}

            <button
              type="submit"
              className="w-full rounded-xl bg-emerald-500 py-3 text-sm font-bold text-slate-950 hover:bg-emerald-400 cursor-pointer"
            >
              Actualizar Clave e Ir a Mi Perfil
            </button>
          </form>
        </div>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-5xl px-4 py-8 sm:px-6 lg:px-8 space-y-8">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 rounded-2xl border border-white/10 bg-[#0D1322] p-5">
        <div>
          <span className="text-[11px] font-bold uppercase tracking-wider text-emerald-400">
            Perfil del Atleta · SYNERGIA ALL STARS
          </span>
          <h1 className="mt-1 text-2xl font-extrabold text-white">
            {athlete.fullName}
          </h1>
          <p className="text-xs text-slate-300 mt-1">
            ID Oficial:{" "}
            <strong className="font-mono text-amber-300">
              {athlete.athleteId}
            </strong>{" "}
            · Usuario: <strong className="font-mono">{athlete.username}</strong>
          </p>
        </div>

        <button
          type="button"
          onClick={onLogout}
          className="rounded-xl border border-white/15 px-4 py-2 text-xs font-semibold text-slate-300 hover:bg-white/5 cursor-pointer"
        >
          Cerrar Sesión
        </button>
      </div>

      {/* Formulario con datos anteriores + salud + dirección + foto carnet */}
      <form
        onSubmit={handleSaveProfile}
        className="rounded-3xl border border-white/10 bg-[#0D1322] p-6 sm:p-8 space-y-6"
      >
        <div>
          <h2 className="text-lg font-bold text-white">
            Ficha Médica, Dirección y Foto Tipo Carnet
          </h2>
          <p className="text-xs text-slate-400 mt-1">
            Completa tus datos para generar tu carnet oficial con código de
            barras.
          </p>
        </div>

        {/* Datos precargados de inscripción */}
        <div className="grid gap-4 sm:grid-cols-3 rounded-2xl border border-white/10 bg-[#070B14]/70 p-4 text-xs">
          <div>
            <span className="text-slate-400 block">ID del Atleta:</span>
            <span className="font-mono font-bold text-amber-300">
              {athlete.athleteId}
            </span>
          </div>
          <div>
            <span className="text-slate-400 block">Documento / Cédula:</span>
            <span className="font-semibold text-white">
              {athlete.documentId}
            </span>
          </div>
          <div>
            <span className="text-slate-400 block">Categoría y Posición:</span>
            <span className="font-semibold text-emerald-300">
              {athlete.category} ({athlete.position})
            </span>
          </div>
        </div>

        <div className="grid gap-5 sm:grid-cols-2">
          <div>
            <label className="block text-sm font-semibold text-slate-200">
              Tipo de sangre *
            </label>
            <select
              value={bloodType}
              onChange={(e) => setBloodType(e.target.value)}
              className="mt-1.5 w-full rounded-xl border border-white/15 bg-[#070B14] px-4 py-3 text-sm text-white focus:border-emerald-400 focus:outline-none"
            >
              {BLOOD_TYPES.map((bt) => (
                <option key={bt} value={bt}>
                  {bt}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-sm font-semibold text-slate-200">
              Foto tipo carnet *
            </label>
            <input
              type="file"
              accept="image/*"
              onChange={handlePhotoUpload}
              className="mt-1.5 w-full rounded-xl border border-white/15 bg-[#070B14] px-3 py-2.5 text-xs text-slate-300 file:mr-3 file:rounded-lg file:border-0 file:bg-emerald-500 file:px-3 file:py-1 file:text-xs file:font-bold file:text-slate-950"
            />
          </div>

          <div className="sm:col-span-2">
            <label className="flex items-center gap-2.5 text-sm font-semibold text-slate-200 cursor-pointer">
              <input
                type="checkbox"
                checked={hasAllergies}
                onChange={(e) => setHasAllergies(e.target.checked)}
                className="h-4 w-4 accent-amber-400"
              />
              ¿Sufre de alguna alergia?
            </label>
            {hasAllergies && (
              <input
                type="text"
                required
                value={allergiesDetail}
                onChange={(e) => setAllergiesDetail(e.target.value)}
                placeholder="Especifique a qué es alérgico (alimentos, medicamentos, etc.)"
                className="mt-2 w-full rounded-xl border border-white/15 bg-[#070B14] px-4 py-3 text-sm text-white focus:border-emerald-400 focus:outline-none"
              />
            )}
          </div>

          <div>
            <label className="block text-sm font-semibold text-slate-200">
              Medicamentos que toma actualmente
            </label>
            <input
              type="text"
              value={medications}
              onChange={(e) => setMedications(e.target.value)}
              placeholder="Ej. Ninguno / Inhalador..."
              className="mt-1.5 w-full rounded-xl border border-white/15 bg-[#070B14] px-4 py-3 text-sm text-white focus:border-emerald-400 focus:outline-none"
            />
          </div>

          <div>
            <label className="block text-sm font-semibold text-slate-200">
              Observaciones médicas / lesiones previas
            </label>
            <input
              type="text"
              value={medicalNotes}
              onChange={(e) => setMedicalNotes(e.target.value)}
              placeholder="Ej. Asma leve, esguince previo..."
              className="mt-1.5 w-full rounded-xl border border-white/15 bg-[#070B14] px-4 py-3 text-sm text-white focus:border-emerald-400 focus:outline-none"
            />
          </div>

          <div className="sm:col-span-2">
            <label className="block text-sm font-semibold text-slate-200">
              Dirección de vivienda del atleta *
            </label>
            <input
              type="text"
              required
              value={homeAddress}
              onChange={(e) => setHomeAddress(e.target.value)}
              placeholder="Urbanización / Calle / Edificio o Casa / Ciudad"
              className="mt-1.5 w-full rounded-xl border border-white/15 bg-[#070B14] px-4 py-3 text-sm text-white focus:border-emerald-400 focus:outline-none"
            />
          </div>

          <div>
            <label className="block text-sm font-semibold text-slate-200">
              Contacto de emergencia *
            </label>
            <input
              type="text"
              required
              value={emergencyContact}
              onChange={(e) => setEmergencyContact(e.target.value)}
              placeholder="Nombre completo"
              className="mt-1.5 w-full rounded-xl border border-white/15 bg-[#070B14] px-4 py-3 text-sm text-white focus:border-emerald-400 focus:outline-none"
            />
          </div>

          <div>
            <label className="block text-sm font-semibold text-slate-200">
              Teléfono de emergencia *
            </label>
            <input
              type="tel"
              required
              value={emergencyPhone}
              onChange={(e) => setEmergencyPhone(e.target.value)}
              placeholder="+58 412 000 0000"
              className="mt-1.5 w-full rounded-xl border border-white/15 bg-[#070B14] px-4 py-3 text-sm text-white focus:border-emerald-400 focus:outline-none"
            />
          </div>
        </div>

        {savedSuccess && (
          <div className="rounded-xl border border-emerald-500/30 bg-emerald-500/10 p-3 text-xs text-emerald-200">
            ¡Perfil guardado! Tu carnet digital ha sido actualizado abajo.
          </div>
        )}

        <button
          type="submit"
          className="rounded-xl bg-emerald-500 px-6 py-3 text-sm font-bold text-slate-950 hover:bg-emerald-400 cursor-pointer"
        >
          Guardar Perfil y Generar Carnet
        </button>
      </form>

      {/* Carnet Digital */}
      <AthleteCarnet athlete={athlete} />
    </div>
  );
}
