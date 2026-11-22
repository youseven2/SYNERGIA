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
      width: 180,
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
              "Diseño blanco estándar (5,5 × 8,5 cm) de alta legibilidad con código QR.",
              "High-contrast white standard design (5.5 × 8.5 cm) with QR code."
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

      {/* Contenedor exclusivo de impresión del Carnet (5.5 cm x 8.5 cm) */}
      <div
        id="carnet-printable"
        className="flex flex-col sm:flex-row flex-wrap items-center justify-center gap-6 py-2"
      >
        {/* ANVERSO VERTICAL (FRENTE) - Diseño Blanco */}
        <div className="relative flex w-[285px] h-[440px] print:w-[55mm] print:h-[85mm] print:min-w-[55mm] print:max-w-[55mm] print:min-h-[85mm] print:max-h-[85mm] flex-col justify-between overflow-hidden rounded-[20px] print:rounded-[8px] border-2 border-[#00B7A4] bg-white text-slate-900 shadow-2xl">
          {/* Franja superior turquesa + morado */}
          <div>
            <div className="flex h-2.5 print:h-1.5 w-full">
              <div className="w-3/5 bg-[#00B7A4]" />
              <div className="w-2/5 bg-[#7E3D97]" />
            </div>

            <div className="flex flex-col items-center px-3 pt-2.5 pb-2 print:px-2 print:pt-1.5 print:pb-1 text-center border-b border-slate-200 bg-slate-50">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src="/synergia-logo.svg"
                alt="SYNERGIA ALL STARS"
                className="h-9 print:h-6 w-auto object-contain"
              />
              <span className="mt-1 rounded-full bg-[#7E3D97] px-3 py-0.5 text-[10px] print:text-[7px] font-extrabold uppercase tracking-[0.16em] text-white">
                ATLETA OFICIAL
              </span>
            </div>
          </div>

          {/* Foto y Datos Centrales con letras más grandes */}
          <div className="flex flex-col items-center px-3.5 py-2 print:px-2 print:py-1 text-center space-y-2 print:space-y-1">
            <div className="h-24 w-20 print:h-16 print:w-14 overflow-hidden rounded-xl border-2 border-[#00B7A4] bg-slate-100 shadow-sm flex items-center justify-center">
              {athlete.photoDataUrl ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img
                  src={athlete.photoDataUrl}
                  alt={athlete.fullName}
                  className="h-full w-full object-cover"
                />
              ) : (
                <span className="px-2 text-center text-[9px] font-semibold text-slate-500">
                  Sin foto
                </span>
              )}
            </div>

            <div className="w-full space-y-0.5">
              <p className="truncate text-base print:text-[11px] font-black tracking-tight text-slate-950">
                {athlete.fullName}
              </p>
              <p className="font-mono text-xs print:text-[9px] font-extrabold text-[#7E3D97]">
                {athlete.athleteId}
              </p>
              <p className="truncate text-xs print:text-[8.5px] font-bold text-[#008C7E]">
                {athlete.category}
              </p>
              <p className="truncate text-[11px] print:text-[8px] font-semibold text-slate-700">
                {athlete.position}
              </p>
            </div>

            <div className="grid w-full grid-cols-3 gap-1 rounded-lg border border-slate-200 bg-slate-50 px-2 py-1 print:px-1 print:py-0.5 text-[10px] print:text-[7.5px]">
              <div>
                <span className="block text-slate-500 font-semibold">Doc.</span>
                <span className="font-extrabold text-slate-900 truncate block">
                  {athlete.documentId || "N/A"}
                </span>
              </div>
              <div>
                <span className="block text-slate-500 font-semibold">Edad</span>
                <span className="font-extrabold text-slate-900">{athlete.age} años</span>
              </div>
              <div>
                <span className="block text-slate-500 font-semibold">Sangre</span>
                <span className="font-extrabold text-rose-600">
                  {athlete.bloodType || "N/A"}
                </span>
              </div>
            </div>
          </div>

          {/* Código QR en la base */}
          <div className="flex flex-col items-center justify-center border-t border-slate-200 bg-slate-50 px-3 py-2 print:py-1">
            {qrSvg && (
              <div
                className="h-16 w-16 print:h-12 print:w-12 rounded-lg border border-slate-300 bg-white p-1 flex items-center justify-center [&>svg]:h-full [&>svg]:w-full"
                dangerouslySetInnerHTML={{ __html: qrSvg }}
              />
            )}
            <p className="mt-1 text-[9px] print:text-[6.5px] font-extrabold uppercase tracking-wider text-slate-800">
              {t("QR Control de Asistencia", "Attendance Control QR")}
            </p>
          </div>
        </div>

        {/* REVERSO VERTICAL - Diseño Blanco */}
        <div className="relative flex w-[285px] h-[440px] print:w-[55mm] print:h-[85mm] print:min-w-[55mm] print:max-w-[55mm] print:min-h-[85mm] print:max-h-[85mm] flex-col justify-between overflow-hidden rounded-[20px] print:rounded-[8px] border-2 border-[#7E3D97] bg-white text-slate-900 shadow-2xl">
          <div>
            <div className="flex h-2.5 print:h-1.5 w-full">
              <div className="w-2/5 bg-[#7E3D97]" />
              <div className="w-3/5 bg-[#00B7A4]" />
            </div>

            <div className="flex items-center justify-between border-b border-slate-200 bg-slate-50 px-4 py-2.5 print:px-2.5 print:py-1.5">
              <span className="text-[11px] print:text-[8px] font-extrabold uppercase tracking-wider text-[#7E3D97]">
                Ficha Médica y Emergencia
              </span>
              <span className="font-mono text-[10px] print:text-[7.5px] font-bold text-slate-600">
                {athlete.athleteId}
              </span>
            </div>

            <div className="space-y-2 print:space-y-1.5 px-3.5 py-2.5 print:px-2.5 print:py-1.5 text-[11px] print:text-[8px]">
              <div className="rounded-lg border border-slate-200 bg-slate-50 p-2 print:p-1.5">
                <span className="block text-[9.5px] print:text-[6.8px] font-bold uppercase text-slate-500">
                  Alergias a medicamentos:
                </span>
                <span className="font-bold text-slate-900 line-clamp-2">
                  {athlete.hasAllergies
                    ? athlete.allergiesDetail || "Sí (ver ficha)"
                    : "Ninguna reportada"}
                </span>
              </div>

              <div className="rounded-lg border border-slate-200 bg-slate-50 p-2 print:p-1.5">
                <span className="block text-[9.5px] print:text-[6.8px] font-bold uppercase text-slate-500">
                  Condición médica / Medicación:
                </span>
                <span className="font-bold text-slate-900 line-clamp-2">
                  {athlete.hasMedicalCondition
                    ? athlete.medicalConditionDetail || "Ver ficha"
                    : athlete.medications || "Ninguna"}
                </span>
              </div>

              <div className="rounded-lg border border-slate-200 bg-slate-50 p-2 print:p-1.5">
                <span className="block text-[9.5px] print:text-[6.8px] font-bold uppercase text-slate-500">
                  Dirección:
                </span>
                <span className="font-semibold text-slate-800 line-clamp-2">
                  {athlete.homeAddress || "Por completar en perfil"}
                </span>
              </div>

              <div className="rounded-lg border border-slate-200 bg-slate-50 p-2 print:p-1.5">
                <span className="block text-[9.5px] print:text-[6.8px] font-bold uppercase text-slate-500">
                  Contacto de emergencia:
                </span>
                <span className="font-extrabold text-slate-950 block truncate">
                  {athlete.emergencyContact || athlete.repName || "No registrado"}
                </span>
                <span className="font-mono text-[11px] print:text-[8px] font-bold text-[#008C7E]">
                  {athlete.emergencyPhone || athlete.repPhone || athlete.phone}
                </span>
              </div>
            </div>
          </div>

          <div className="border-t border-slate-200 bg-slate-50 px-3.5 py-2.5 print:px-2.5 print:py-1.5 text-center space-y-1.5 print:space-y-1">
            <p className="text-[9px] print:text-[6.5px] leading-snug font-medium text-slate-600">
              Este carnet es personal e intransferible y acredita al atleta como
              miembro activo de SYNERGIA ALL STARS.
            </p>
            <div className="mx-auto w-36 print:w-24 pt-0.5">
              <svg
                viewBox="0 0 160 36"
                className="mx-auto h-5 print:h-3.5 w-20 text-[#008C7E]"
                fill="none"
              >
                <path
                  d="M12 24 C25 6, 42 28, 58 12 C70 2, 76 30, 92 16 C104 6, 118 22, 146 10"
                  stroke="currentColor"
                  strokeWidth="2"
                  strokeLinecap="round"
                />
              </svg>
              <div className="border-t border-slate-400 pt-0.5">
                <p className="text-[9px] print:text-[6.5px] font-extrabold uppercase tracking-wider text-slate-900">
                  Representante Legal
                </p>
                <p className="text-[8px] print:text-[6px] font-bold text-[#7E3D97]">
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
