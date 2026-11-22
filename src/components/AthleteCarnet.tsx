"use client";

import { useEffect, useState } from "react";
import QRCode from "qrcode";
import { AthleteProfile } from "@/lib/synergia-store";
import { useI18n } from "@/components/I18nContext";

export function AthleteCarnet({ athlete }: { athlete: AthleteProfile }) {
  const { t } = useI18n();
  const [qrSvg, setQrSvg] = useState<string>("");

  useEffect(() => {
    let active = true;
    QRCode.toString(`SYNERGIA:${athlete.athleteId}`, {
      type: "svg",
      margin: 1,
      width: 140,
      color: { dark: "#070B14", light: "#FFFFFF" },
    })
      .then((svg) => {
        if (active) setQrSvg(svg);
      })
      .catch(() => {});
    return () => {
      active = false;
    };
  }, [athlete.athleteId]);

  function handlePrintCarnet() {
    document.body.classList.add("printing-carnet");
    const cleanup = () => {
      document.body.classList.remove("printing-carnet");
      window.removeEventListener("afterprint", cleanup);
    };
    window.addEventListener("afterprint", cleanup);
    window.print();
    setTimeout(cleanup, 1500);
  }

  return (
    <div className="space-y-4">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between print:hidden">
        <div>
          <h3 className="text-base font-bold text-white">
            {t(
              "Carnet Oficial Vertical de Atleta (Anverso y Reverso)",
              "Official Vertical Athlete ID Card (Front & Back)"
            )}
          </h3>
          <p className="text-[11px] text-slate-400">
            {t(
              "Formato vertical estándar CR80 (54 × 86 mm) con código QR de asistencia.",
              "Standard vertical CR80 format (54 × 86 mm) with attendance QR code."
            )}
          </p>
        </div>
        <button
          type="button"
          onClick={handlePrintCarnet}
          className="w-full sm:w-auto rounded-xl border border-[#4CE4D4]/45 bg-[#00B7A4]/15 px-4 py-2 text-xs font-bold text-[#4CE4D4] hover:bg-[#00B7A4]/25 transition-colors cursor-pointer"
        >
          {t("Imprimir / Descargar Carnet", "Print / Download ID Card")}
        </button>
      </div>

      {/* Contenedor exclusivo de impresión del Carnet */}
      <div
        id="carnet-printable"
        className="flex flex-col sm:flex-row flex-wrap items-center justify-center gap-6 py-2"
      >
        {/* ANVERSO VERTICAL (FRENTE) */}
        <div className="relative flex w-[275px] min-h-[455px] print:w-[54mm] print:min-h-[86mm] flex-col justify-between overflow-hidden rounded-[22px] border border-[#00B7A4]/50 bg-gradient-to-b from-[#0C172C] via-[#080F1E] to-[#050811] shadow-2xl">
          {/* Franja superior morado + turquesa */}
          <div>
            <div className="flex h-2 w-full">
              <div className="w-3/5 bg-[#00B7A4]" />
              <div className="w-2/5 bg-[#7E3D97]" />
            </div>

            <div className="flex flex-col items-center px-4 pt-3 pb-2 text-center border-b border-white/10">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src="/synergia-logo.svg"
                alt="SYNERGIA ALL STARS"
                className="h-9 w-auto object-contain"
              />
              <span className="mt-1.5 rounded-full border border-[#9D5BB8]/50 bg-[#7E3D97]/30 px-3 py-0.5 text-[9px] font-extrabold uppercase tracking-[0.18em] text-purple-100">
                ATLETA OFICIAL
              </span>
            </div>
          </div>

          {/* Foto y Datos Centrales */}
          <div className="flex flex-col items-center px-4 py-3 text-center space-y-2.5">
            <div className="h-28 w-24 overflow-hidden rounded-2xl border-2 border-[#00B7A4] bg-white shadow-lg flex items-center justify-center">
              {athlete.photoDataUrl ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img
                  src={athlete.photoDataUrl}
                  alt={athlete.fullName}
                  className="h-full w-full object-cover"
                />
              ) : (
                <span className="px-2 text-center text-[9px] text-slate-500">
                  Sin foto carnet
                </span>
              )}
            </div>

            <div className="w-full space-y-1">
              <p className="truncate text-sm font-black tracking-tight text-white">
                {athlete.fullName}
              </p>
              <p className="font-mono text-[11px] font-bold text-amber-300">
                {athlete.athleteId}
              </p>
              <p className="truncate text-[10px] font-semibold text-[#4CE4D4]">
                {athlete.category}
              </p>
              <p className="truncate text-[10px] text-slate-300">
                {athlete.position}
              </p>
            </div>

            <div className="grid w-full grid-cols-3 gap-1 rounded-xl border border-white/10 bg-white/[0.04] px-2 py-1.5 text-[9px]">
              <div>
                <span className="block text-slate-400">Doc.</span>
                <span className="font-bold text-white truncate block">
                  {athlete.documentId || "N/A"}
                </span>
              </div>
              <div>
                <span className="block text-slate-400">Edad</span>
                <span className="font-bold text-white">{athlete.age} a</span>
              </div>
              <div>
                <span className="block text-slate-400">Sangre</span>
                <span className="font-bold text-rose-300">
                  {athlete.bloodType || "N/A"}
                </span>
              </div>
            </div>
          </div>

          {/* Código QR dedicado en la base (sin sobremontar) */}
          <div className="flex flex-col items-center justify-center border-t border-white/10 bg-[#070B14]/80 px-4 py-3">
            {qrSvg && (
              <div
                className="h-20 w-20 rounded-xl bg-white p-1.5 shadow-md flex items-center justify-center [&>svg]:h-full [&>svg]:w-full"
                dangerouslySetInnerHTML={{ __html: qrSvg }}
              />
            )}
            <p className="mt-1.5 text-[8.5px] font-bold uppercase tracking-wider text-emerald-300">
              {t("QR Control de Asistencia", "Attendance Control QR")}
            </p>
          </div>
        </div>

        {/* REVERSO VERTICAL */}
        <div className="relative flex w-[275px] min-h-[455px] print:w-[54mm] print:min-h-[86mm] flex-col justify-between overflow-hidden rounded-[22px] border border-white/15 bg-gradient-to-b from-[#0A1120] to-[#050811] shadow-2xl">
          <div>
            <div className="flex h-2 w-full">
              <div className="w-2/5 bg-[#7E3D97]" />
              <div className="w-3/5 bg-[#00B7A4]" />
            </div>

            <div className="flex items-center justify-between border-b border-white/10 px-4 py-3">
              <span className="text-[10px] font-extrabold uppercase tracking-wider text-[#4CE4D4]">
                Ficha Médica y Emergencia
              </span>
              <span className="font-mono text-[9px] text-slate-400">
                {athlete.athleteId}
              </span>
            </div>

            <div className="space-y-3 px-4 py-3.5 text-[10.5px]">
              <div className="rounded-xl border border-white/10 bg-white/[0.03] p-2.5">
                <span className="block text-[9px] uppercase text-slate-400">
                  Alergias a medicamentos:
                </span>
                <span className="font-semibold text-white">
                  {athlete.hasAllergies
                    ? athlete.allergiesDetail || "Sí (ver ficha)"
                    : "Ninguna reportada"}
                </span>
              </div>

              <div className="rounded-xl border border-white/10 bg-white/[0.03] p-2.5">
                <span className="block text-[9px] uppercase text-slate-400">
                  Condición médica / Medicación:
                </span>
                <span className="font-semibold text-white">
                  {athlete.hasMedicalCondition
                    ? athlete.medicalConditionDetail || "Ver ficha"
                    : athlete.medications || "Ninguna"}
                </span>
              </div>

              <div className="rounded-xl border border-white/10 bg-white/[0.03] p-2.5">
                <span className="block text-[9px] uppercase text-slate-400">
                  Dirección:
                </span>
                <span className="text-slate-200 line-clamp-2">
                  {athlete.homeAddress || "Por completar en perfil"}
                </span>
              </div>

              <div className="rounded-xl border border-white/10 bg-white/[0.03] p-2.5">
                <span className="block text-[9px] uppercase text-slate-400">
                  Contacto de emergencia:
                </span>
                <span className="font-semibold text-amber-200 block">
                  {athlete.emergencyContact || athlete.repName || "No registrado"}
                </span>
                <span className="font-mono text-[10px] text-slate-200">
                  {athlete.emergencyPhone || athlete.repPhone || athlete.phone}
                </span>
              </div>
            </div>
          </div>

          <div className="border-t border-white/10 bg-[#070B14]/80 px-4 py-3 text-center space-y-2">
            <p className="text-[8.5px] leading-snug text-slate-400">
              Este carnet es personal e intransferible y acredita al atleta como
              miembro activo de SYNERGIA ALL STARS.
            </p>
            <div className="mx-auto w-36 pt-1">
              <svg
                viewBox="0 0 160 36"
                className="mx-auto h-6 w-24 text-[#4CE4D4]"
                fill="none"
              >
                <path
                  d="M12 24 C25 6, 42 28, 58 12 C70 2, 76 30, 92 16 C104 6, 118 22, 146 10"
                  stroke="currentColor"
                  strokeWidth="2"
                  strokeLinecap="round"
                />
              </svg>
              <div className="border-t border-slate-500 pt-1">
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
