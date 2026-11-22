"use client";

import { useEffect, useState } from "react";
import QRCode from "qrcode";
import { AthleteProfile } from "@/lib/synergia-store";
import { useI18n } from "@/components/I18nContext";

function CarnetBackgroundPattern({ variant }: { variant: "front" | "back" }) {
  const gradId = `synergia-carnet-grad-${variant}`;
  const waveGradId = `synergia-wave-grad-${variant}`;
  return (
    <svg
      aria-hidden="true"
      viewBox="0 0 285 440"
      preserveAspectRatio="none"
      className="pointer-events-none absolute inset-0 z-0 h-full w-full"
    >
      <defs>
        <linearGradient id={gradId} x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stopColor="#7E3D97" stopOpacity="0.16" />
          <stop offset="50%" stopColor="#3F7A9D" stopOpacity="0.08" />
          <stop offset="100%" stopColor="#00B7A4" stopOpacity="0.18" />
        </linearGradient>
        <linearGradient id={waveGradId} x1="0%" y1="0%" x2="100%" y2="0%">
          <stop offset="0%" stopColor="#7E3D97" stopOpacity="0.28" />
          <stop offset="50%" stopColor="#5C6B9E" stopOpacity="0.20" />
          <stop offset="100%" stopColor="#00B7A4" stopOpacity="0.30" />
        </linearGradient>
      </defs>

      {/* Base degradado suave morado -> verde Synergia */}
      <rect width="285" height="440" fill={`url(#${gradId})`} />

      {/* Ondas fluidas superiores e inferiores */}
      <path
        d="M0 95 C 75 65, 195 130, 285 88 L 285 0 L 0 0 Z"
        fill={`url(#${waveGradId})`}
        opacity="0.45"
      />
      <path
        d="M0 112 C 90 142, 185 82, 285 118"
        fill="none"
        stroke={`url(#${waveGradId})`}
        strokeWidth="2.5"
      />
      <path
        d="M0 360 C 85 322, 195 392, 285 344 L 285 440 L 0 440 Z"
        fill={`url(#${waveGradId})`}
        opacity="0.55"
      />
      <path
        d="M0 344 C 95 310, 200 375, 285 330"
        fill="none"
        stroke={`url(#${waveGradId})`}
        strokeWidth="2"
      />

      {/* Degradación geométrica de cuadrados de pequeños a grandes */}
      <rect x="14" y="138" width="6" height="6" rx="1.5" fill="#7E3D97" opacity="0.24" />
      <rect x="26" y="150" width="9" height="9" rx="2" fill="#7E3D97" opacity="0.22" />
      <rect x="16" y="168" width="13" height="13" rx="2.5" fill="#5D649B" opacity="0.20" />
      <rect x="34" y="186" width="18" height="18" rx="3.5" fill="#00B7A4" opacity="0.18" />
      <rect x="12" y="212" width="24" height="24" rx="4.5" fill="#00B7A4" opacity="0.16" />

      <rect x="262" y="142" width="7" height="7" rx="1.5" fill="#00B7A4" opacity="0.24" />
      <rect x="247" y="156" width="11" height="11" rx="2" fill="#00B7A4" opacity="0.22" />
      <rect x="255" y="176" width="15" height="15" rx="3" fill="#5D649B" opacity="0.20" />
      <rect x="234" y="198" width="21" height="21" rx="4" fill="#7E3D97" opacity="0.17" />
      <rect x="246" y="228" width="28" height="28" rx="5" fill="#7E3D97" opacity="0.14" />

      <rect x="22" y="294" width="8" height="8" rx="1.5" fill="#7E3D97" opacity="0.22" />
      <rect x="36" y="306" width="12" height="12" rx="2.5" fill="#00B7A4" opacity="0.20" />
      <rect x="236" y="286" width="10" height="10" rx="2" fill="#00B7A4" opacity="0.22" />
      <rect x="218" y="302" width="16" height="16" rx="3" fill="#7E3D97" opacity="0.18" />
    </svg>
  );
}

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
        {/* ANVERSO VERTICAL (FRENTE) - Diseño Blanco con Fondo Degradado Synergia */}
        <div
          style={{ WebkitPrintColorAdjust: "exact", printColorAdjust: "exact" }}
          className="relative flex w-[285px] h-[440px] print:w-[55mm] print:h-[85mm] print:min-w-[55mm] print:max-w-[55mm] print:min-h-[85mm] print:max-h-[85mm] flex-col justify-between overflow-hidden rounded-[20px] print:rounded-[8px] border-2 border-[#00B7A4] bg-white text-slate-900 shadow-2xl"
        >
          <CarnetBackgroundPattern variant="front" />
          {/* Franja superior turquesa + morado */}
          <div className="relative z-10">
            <div className="flex h-2.5 print:h-1.5 w-full">
              <div className="w-3/5 bg-[#00B7A4]" />
              <div className="w-2/5 bg-[#7E3D97]" />
            </div>

            <div className="flex flex-col items-center px-3 pt-2.5 pb-2 print:px-2 print:pt-1.5 print:pb-1 text-center border-b border-slate-200/70 bg-white/75 backdrop-blur-[1px]">
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
          <div className="relative z-10 flex flex-col items-center px-3.5 py-2 print:px-2 print:py-1 text-center space-y-2 print:space-y-1">
            <div className="h-24 w-20 print:h-16 print:w-14 overflow-hidden rounded-xl border-2 border-[#00B7A4] bg-white shadow-sm flex items-center justify-center">
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

            <div className="w-full space-y-0.5 rounded-lg bg-white/70 px-1.5 py-0.5">
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

            <div className="grid w-full grid-cols-3 gap-1 rounded-lg border border-slate-200/80 bg-white/85 px-2 py-1 print:px-1 print:py-0.5 text-[10px] print:text-[7.5px]">
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
          <div className="relative z-10 flex flex-col items-center justify-center border-t border-slate-200/70 bg-white/75 px-3 py-2 print:py-1">
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

        {/* REVERSO VERTICAL - Diseño Blanco con Fondo Degradado Synergia */}
        <div
          style={{ WebkitPrintColorAdjust: "exact", printColorAdjust: "exact" }}
          className="relative flex w-[285px] h-[440px] print:w-[55mm] print:h-[85mm] print:min-w-[55mm] print:max-w-[55mm] print:min-h-[85mm] print:max-h-[85mm] flex-col justify-between overflow-hidden rounded-[20px] print:rounded-[8px] border-2 border-[#7E3D97] bg-white text-slate-900 shadow-2xl"
        >
          <CarnetBackgroundPattern variant="back" />
          <div className="relative z-10">
            <div className="flex h-2.5 print:h-1.5 w-full">
              <div className="w-2/5 bg-[#7E3D97]" />
              <div className="w-3/5 bg-[#00B7A4]" />
            </div>

            <div className="flex items-center justify-between border-b border-slate-200/70 bg-white/75 px-4 py-2.5 print:px-2.5 print:py-1.5">
              <span className="text-[11px] print:text-[8px] font-extrabold uppercase tracking-wider text-[#7E3D97]">
                Ficha Médica y Emergencia
              </span>
              <span className="font-mono text-[10px] print:text-[7.5px] font-bold text-slate-600">
                {athlete.athleteId}
              </span>
            </div>

            <div className="space-y-2 print:space-y-1.5 px-3.5 py-2.5 print:px-2.5 print:py-1.5 text-[11px] print:text-[8px]">
              <div className="rounded-lg border border-slate-200/80 bg-white/85 p-2 print:p-1.5">
                <span className="block text-[9.5px] print:text-[6.8px] font-bold uppercase text-slate-500">
                  Alergias a medicamentos:
                </span>
                <span className="font-bold text-slate-900 line-clamp-2">
                  {athlete.hasAllergies
                    ? athlete.allergiesDetail || "Sí (ver ficha)"
                    : "Ninguna reportada"}
                </span>
              </div>

              <div className="rounded-lg border border-slate-200/80 bg-white/85 p-2 print:p-1.5">
                <span className="block text-[9.5px] print:text-[6.8px] font-bold uppercase text-slate-500">
                  Condición médica / Medicación:
                </span>
                <span className="font-bold text-slate-900 line-clamp-2">
                  {athlete.hasMedicalCondition
                    ? athlete.medicalConditionDetail || "Ver ficha"
                    : athlete.medications || "Ninguna"}
                </span>
              </div>

              <div className="rounded-lg border border-slate-200/80 bg-white/85 p-2 print:p-1.5">
                <span className="block text-[9.5px] print:text-[6.8px] font-bold uppercase text-slate-500">
                  Dirección:
                </span>
                <span className="font-semibold text-slate-800 line-clamp-2">
                  {athlete.homeAddress || "Por completar en perfil"}
                </span>
              </div>

              <div className="rounded-lg border border-slate-200/80 bg-white/85 p-2 print:p-1.5">
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

          <div className="relative z-10 border-t border-slate-200/70 bg-white/75 px-3.5 py-2.5 print:px-2.5 print:py-1.5 text-center space-y-1.5 print:space-y-1">
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
