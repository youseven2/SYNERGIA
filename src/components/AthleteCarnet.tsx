"use client";

import { useEffect, useState } from "react";
import QRCode from "qrcode";
import { AthleteProfile } from "@/lib/synergia-store";
import { useI18n } from "@/components/I18nContext";
import { useDevice } from "@/components/DeviceContext";

export function AthleteCarnet({ athlete }: { athlete: AthleteProfile }) {
  const { t } = useI18n();
  const { isMobile } = useDevice();
  const [qrUrl, setQrUrl] = useState<string>("");

  useEffect(() => {
    let active = true;
    QRCode.toDataURL(`SYNERGIA:${athlete.athleteId}`, {
      width: 180,
      margin: 1,
      color: { dark: "#070B14", light: "#FFFFFF" },
    })
      .then((url) => {
        if (active) setQrUrl(url);
      })
      .catch(() => {});
    return () => {
      active = false;
    };
  }, [athlete.athleteId]);

  return (
    <div className="space-y-4">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h3 className="text-base font-bold text-white">
            {t(
              "Carnet Oficial Estándar de Atleta (Anverso y Reverso)",
              "Standard Official Athlete ID Card (Front & Back)"
            )}
          </h3>
          <p className="text-[11px] text-slate-400">
            {t(
              "Formato estándar CR80 (85.6 × 53.98 mm) con código QR de asistencia.",
              "Standard CR80 format (85.6 × 53.98 mm) with attendance QR code."
            )}
          </p>
        </div>
        <button
          type="button"
          onClick={() => window.print()}
          className="w-full sm:w-auto rounded-xl border border-emerald-500/40 bg-emerald-500/15 px-4 py-2 text-xs font-bold text-emerald-300 hover:bg-emerald-500/25 transition-colors cursor-pointer print:hidden"
        >
          {t("Imprimir / Descargar Carnet", "Print / Download ID Card")}
        </button>
      </div>

      <div
        className={`grid gap-5 sm:gap-6 items-start ${
          isMobile ? "grid-cols-1" : "md:grid-cols-2"
        }`}
      >
        {/* ANVERSO (FRENTE) - Formato Estándar CR80 */}
        <div className="mx-auto w-full max-w-[420px] sm:aspect-[1.586/1] print:w-[85.6mm] print:h-[53.98mm] flex flex-col justify-between overflow-hidden rounded-2xl border border-emerald-400/45 bg-gradient-to-br from-[#0B1528] via-[#09101E] to-[#060A13] p-4 shadow-2xl">
          <div className="flex items-center justify-between border-b border-white/10 pb-2">
            <div className="flex items-center gap-2">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src="/synergia-logo.svg"
                alt="SYNERGIA ALL STARS"
                className="h-7 w-auto object-contain"
              />
              <p className="text-[8px] uppercase tracking-[0.16em] text-emerald-400">
                Escuela de Porrismo
              </p>
            </div>
            <span className="rounded-md bg-[#7E3D97]/40 px-2 py-0.5 text-[9px] font-bold text-purple-200 border border-[#9D5BB8]/40">
              ATLETA OFICIAL
            </span>
          </div>

          <div className="my-2 flex items-center gap-3">
            {/* Foto tipo carnet */}
            <div className="h-24 w-20 shrink-0 overflow-hidden rounded-xl border-2 border-emerald-400/50 bg-white flex items-center justify-center">
              {athlete.photoDataUrl ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img
                  src={athlete.photoDataUrl}
                  alt={athlete.fullName}
                  className="h-full w-full object-cover"
                />
              ) : (
                <span className="px-1.5 text-center text-[9px] text-slate-500">
                  Sin foto carnet
                </span>
              )}
            </div>

            <div className="min-w-0 flex-1 space-y-1 text-[11px]">
              <div>
                <p className="text-[9px] uppercase text-slate-400">Nombre</p>
                <p className="truncate text-xs font-extrabold text-white">
                  {athlete.fullName}
                </p>
              </div>
              <div className="grid grid-cols-2 gap-1.5">
                <div>
                  <p className="text-[9px] uppercase text-slate-400">ID</p>
                  <p className="truncate font-mono text-[10px] font-bold text-amber-300">
                    {athlete.athleteId}
                  </p>
                </div>
                <div>
                  <p className="text-[9px] uppercase text-slate-400">Sangre</p>
                  <p className="font-bold text-rose-300">
                    {athlete.bloodType || "N/A"}
                  </p>
                </div>
              </div>
              <div>
                <p className="text-[9px] uppercase text-slate-400">
                  Categoría & Posición
                </p>
                <p className="truncate text-[10px] font-semibold text-emerald-300">
                  {athlete.category}
                </p>
                <p className="truncate text-[10px] text-slate-300">
                  {athlete.position}
                </p>
              </div>
            </div>
          </div>

          {/* Código QR en lugar de código de barras */}
          <div className="flex items-center justify-between border-t border-white/10 pt-2">
            <div className="flex items-center gap-2.5">
              {qrUrl && (
                <div className="rounded-md bg-white p-1 shrink-0">
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img
                    src={qrUrl}
                    alt={`QR ${athlete.athleteId}`}
                    className="h-12 w-12"
                  />
                </div>
              )}
              <div>
                <p className="font-mono text-[10px] font-bold tracking-wider text-white">
                  {athlete.athleteId}
                </p>
                <p className="text-[8px] text-emerald-300">
                  {t("QR Control de Asistencia", "Attendance Control QR")}
                </p>
              </div>
            </div>
            <div className="text-right text-[9px] text-slate-400">
              <p>Doc: {athlete.documentId || "N/A"}</p>
              <p>Edad: {athlete.age} años</p>
            </div>
          </div>
        </div>

        {/* REVERSO - Formato Estándar CR80 */}
        <div className="mx-auto w-full max-w-[420px] sm:aspect-[1.586/1] print:w-[85.6mm] print:h-[53.98mm] flex flex-col justify-between overflow-hidden rounded-2xl border border-white/15 bg-gradient-to-br from-[#0A1120] to-[#060911] p-4 shadow-2xl">
          <div className="space-y-1.5 text-[11px]">
            <div className="flex items-center justify-between border-b border-white/10 pb-1.5">
              <span className="font-bold uppercase tracking-wider text-emerald-400 text-[10px]">
                Información Médica y Emergencia
              </span>
              <span className="font-mono text-[9px] text-slate-400">
                {athlete.athleteId}
              </span>
            </div>

            <div className="grid grid-cols-2 gap-2">
              <div>
                <span className="text-[9px] text-slate-400 block">
                  Alergias:
                </span>
                <span className="text-slate-200 font-medium line-clamp-2">
                  {athlete.hasAllergies
                    ? athlete.allergiesDetail || "Sí (ver ficha)"
                    : "Ninguna reportada"}
                </span>
              </div>
              <div>
                <span className="text-[9px] text-slate-400 block">
                  Condición / Med.:
                </span>
                <span className="text-slate-200 font-medium line-clamp-2">
                  {athlete.hasMedicalCondition
                    ? athlete.medicalConditionDetail || "Ver ficha"
                    : athlete.medications || "Ninguno"}
                </span>
              </div>
            </div>

            <div>
              <span className="text-[9px] text-slate-400 block">
                Dirección de vivienda:
              </span>
              <span className="text-slate-200 line-clamp-1">
                {athlete.homeAddress || "Por completar en perfil"}
              </span>
            </div>

            <div>
              <span className="text-[9px] text-slate-400 block">
                Contacto de emergencia:
              </span>
              <span className="text-slate-200 font-medium line-clamp-1">
                {athlete.emergencyContact || athlete.repName || "No registrado"}{" "}
                · {athlete.emergencyPhone || athlete.repPhone || athlete.phone}
              </span>
            </div>
          </div>

          <div className="mt-2 border-t border-white/10 pt-2 flex items-end justify-between gap-3">
            <p className="text-[8.5px] leading-snug text-slate-400 max-w-[56%]">
              Este carnet es personal e intransferible y acredita al atleta
              como miembro activo de SYNERGIA ALL STARS.
            </p>

            <div className="text-center shrink-0">
              <svg
                viewBox="0 0 160 40"
                className="mx-auto h-7 w-24 text-emerald-300"
                fill="none"
              >
                <path
                  d="M12 28 C25 8, 42 32, 58 14 C70 2, 76 34, 92 18 C104 6, 118 26, 146 12"
                  stroke="currentColor"
                  strokeWidth="2"
                  strokeLinecap="round"
                />
              </svg>
              <div className="border-t border-slate-500 pt-0.5">
                <p className="text-[8.5px] font-bold uppercase tracking-wider text-white">
                  Representante Legal
                </p>
                <p className="text-[7.5px] text-emerald-400">
                  Academia SYNERGIA ALL STARS
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
