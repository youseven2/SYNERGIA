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
              "Formato vertical estándar (5,5 × 8,5 cm) con código QR de asistencia.",
              "Standard vertical format (5.5 × 8.5 cm) with attendance QR code."
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
        {/* ANVERSO VERTICAL (FRENTE) - 5.5 cm x 8.5 cm */}
        <div className="relative flex w-[275px] h-[425px] print:w-[55mm] print:h-[85mm] print:min-w-[55mm] print:max-w-[55mm] print:min-h-[85mm] print:max-h-[85mm] flex-col justify-between overflow-hidden rounded-[22px] print:rounded-[10px] border border-[#00B7A4]/50 bg-gradient-to-b from-[#0C172C] via-[#080F1E] to-[#050811] shadow-2xl">
          {/* Franja superior morado + turquesa */}
          <div>
            <div className="flex h-2 print:h-1.5 w-full">
              <div className="w-3/5 bg-[#00B7A4]" />
              <div className="w-2/5 bg-[#7E3D97]" />
            </div>

            <div className="flex flex-col items-center px-4 pt-2.5 pb-1.5 print:px-2 print:pt-1.5 print:pb-1 text-center border-b border-white/10">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src="/synergia-logo.svg"
                alt="SYNERGIA ALL STARS"
                className="h-8 print:h-6 w-auto object-contain"
              />
              <span className="mt-1 rounded-full border border-[#9D5BB8]/50 bg-[#7E3D97]/30 px-2.5 py-0.5 text-[8.5px] print:text-[6.5px] font-extrabold uppercase tracking-[0.16em] text-purple-100">
                ATLETA OFICIAL
              </span>
            </div>
          </div>

          {/* Foto y Datos Centrales */}
          <div className="flex flex-col items-center px-3.5 py-2 print:px-2 print:py-1 text-center space-y-2 print:space-y-1">
            <div className="h-24 w-20 print:h-16 print:w-14 overflow-hidden rounded-xl border-2 border-[#00B7A4] bg-white shadow-lg flex items-center justify-center">
              {athlete.photoDataUrl ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img
                  src={athlete.photoDataUrl}
                  alt={athlete.fullName}
                  className="h-full w-full object-cover"
                />
              ) : (
                <span className="px-2 text-center text-[8px] text-slate-500">
                  Sin foto
                </span>
              )}
            </div>

            <div className="w-full space-y-0.5">
              <p className="truncate text-sm print:text-[10px] font-black tracking-tight text-white">
                {athlete.fullName}
              </p>
              <p className="font-mono text-[10.5px] print:text-[8px] font-bold text-amber-300">
                {athlete.athleteId}
              </p>
              <p className="truncate text-[10px] print:text-[7.5px] font-semibold text-[#4CE4D4]">
                {athlete.category}
              </p>
              <p className="truncate text-[9.5px] print:text-[7px] text-slate-300">
                {athlete.position}
              </p>
            </div>

            <div className="grid w-full grid-cols-3 gap-1 rounded-lg border border-white/10 bg-white/[0.04] px-2 py-1 print:px-1 print:py-0.5 text-[8.5px] print:text-[6.5px]">
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

          {/* Código QR dedicado en la base */}
          <div className="flex flex-col items-center justify-center border-t border-white/10 bg-[#070B14]/80 px-3 py-2 print:py-1.5">
            {qrSvg && (
              <div
                className="h-16 w-16 print:h-12 print:w-12 rounded-lg bg-white p-1 shadow-md flex items-center justify-center [&>svg]:h-full [&>svg]:w-full"
                dangerouslySetInnerHTML={{ __html: qrSvg }}
              />
            )}
            <p className="mt-1 text-[8px] print:text-[6px] font-bold uppercase tracking-wider text-emerald-300">
              {t("QR Control de Asistencia", "Attendance Control QR")}
            </p>
          </div>
        </div>

        {/* REVERSO VERTICAL - 5.5 cm x 8.5 cm */}
        <div className="relative flex w-[275px] h-[425px] print:w-[55mm] print:h-[85mm] print:min-w-[55mm] print:max-w-[55mm] print:min-h-[85mm] print:max-h-[85mm] flex-col justify-between overflow-hidden rounded-[22px] print:rounded-[10px] border border-white/15 bg-gradient-to-b from-[#0A1120] to-[#050811] shadow-2xl">
          <div>
            <div className="flex h-2 print:h-1.5 w-full">
              <div className="w-2/5 bg-[#7E3D97]" />
              <div className="w-3/5 bg-[#00B7A4]" />
            </div>

            <div className="flex items-center justify-between border-b border-white/10 px-4 py-2.5 print:px-2.5 print:py-1.5">
              <span className="text-[9.5px] print:text-[7px] font-extrabold uppercase tracking-wider text-[#4CE4D4]">
                Ficha Médica y Emergencia
              </span>
              <span className="font-mono text-[8.5px] print:text-[6.5px] text-slate-400">
                {athlete.athleteId}
              </span>
            </div>

            <div className="space-y-2 print:space-y-1.5 px-3.5 py-2.5 print:px-2.5 print:py-1.5 text-[10px] print:text-[7.2px]">
              <div className="rounded-lg border border-white/10 bg-white/[0.03] p-2 print:p-1.5">
                <span className="block text-[8.5px] print:text-[6px] uppercase text-slate-400">
                  Alergias a medicamentos:
                </span>
                <span className="font-semibold text-white line-clamp-2">
                  {athlete.hasAllergies
                    ? athlete.allergiesDetail || "Sí (ver ficha)"
                    : "Ninguna reportada"}
                </span>
              </div>

              <div className="rounded-lg border border-white/10 bg-white/[0.03] p-2 print:p-1.5">
                <span className="block text-[8.5px] print:text-[6px] uppercase text-slate-400">
                  Condición médica / Medicación:
                </span>
                <span className="font-semibold text-white line-clamp-2">
                  {athlete.hasMedicalCondition
                    ? athlete.medicalConditionDetail || "Ver ficha"
                    : athlete.medications || "Ninguna"}
                </span>
              </div>

              <div className="rounded-lg border border-white/10 bg-white/[0.03] p-2 print:p-1.5">
                <span className="block text-[8.5px] print:text-[6px] uppercase text-slate-400">
                  Dirección:
                </span>
                <span className="text-slate-200 line-clamp-2">
                  {athlete.homeAddress || "Por completar en perfil"}
                </span>
              </div>

              <div className="rounded-lg border border-white/10 bg-white/[0.03] p-2 print:p-1.5">
                <span className="block text-[8.5px] print:text-[6px] uppercase text-slate-400">
                  Contacto de emergencia:
                </span>
                <span className="font-semibold text-amber-200 block truncate">
                  {athlete.emergencyContact || athlete.repName || "No registrado"}
                </span>
                <span className="font-mono text-[9.5px] print:text-[7px] text-slate-200">
                  {athlete.emergencyPhone || athlete.repPhone || athlete.phone}
                </span>
              </div>
            </div>
          </div>

          <div className="border-t border-white/10 bg-[#070B14]/80 px-3.5 py-2.5 print:px-2.5 print:py-1.5 text-center space-y-1.5 print:space-y-1">
            <p className="text-[8px] print:text-[6px] leading-snug text-slate-400">
              Este carnet es personal e intransferible y acredita al atleta como
              miembro activo de SYNERGIA ALL STARS.
            </p>
            <div className="mx-auto w-32 print:w-24 pt-0.5">
              <svg
                viewBox="0 0 160 36"
                className="mx-auto h-5 print:h-3.5 w-20 text-[#4CE4D4]"
                fill="none"
              >
                <path
                  d="M12 24 C25 6, 42 28, 58 12 C70 2, 76 30, 92 16 C104 6, 118 22, 146 10"
                  stroke="currentColor"
                  strokeWidth="2"
                  strokeLinecap="round"
                />
              </svg>
              <div className="border-t border-slate-500 pt-0.5">
                <p className="text-[8px] print:text-[6px] font-bold uppercase tracking-wider text-white">
                  Representante Legal
                </p>
                <p className="text-[7px] print:text-[5.5px] text-emerald-400">
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
