"use client";

import { AthleteProfile } from "@/lib/synergia-store";
import { useI18n } from "@/components/I18nContext";
import { useDevice } from "@/components/DeviceContext";

function BarcodeSvg({ value }: { value: string }) {
  // Deterministic Code128-style visual barcode bars from string characters
  const bars: number[] = [2, 1, 1, 2, 3, 1]; // start guard
  for (let i = 0; i < value.length; i++) {
    const code = value.charCodeAt(i);
    bars.push(((code >> 0) & 3) + 1);
    bars.push(((code >> 2) & 3) + 1);
    bars.push(((code >> 4) & 3) + 1);
    bars.push(((code >> 6) & 1) + 1);
  }
  bars.push(2, 1, 1, 2, 2); // stop guard

  let x = 4;
  const elements: { x: number; w: number }[] = [];
  bars.forEach((width, idx) => {
    if (idx % 2 === 0) {
      elements.push({ x, w: width * 1.4 });
    }
    x += width * 1.4;
  });

  const totalWidth = x + 4;

  return (
    <div className="inline-flex flex-col items-center rounded-lg bg-white px-3 py-2">
      <svg
        viewBox={`0 0 ${totalWidth} 38`}
        className="h-9 w-full max-w-[210px]"
        aria-label={`Código de barras ${value}`}
      >
        <rect x="0" y="0" width={totalWidth} height="38" fill="#ffffff" />
        {elements.map((bar, i) => (
          <rect
            key={i}
            x={bar.x}
            y="2"
            width={bar.w}
            height="34"
            fill="#090D16"
          />
        ))}
      </svg>
      <span className="mt-1 font-mono text-[10px] font-bold tracking-[0.18em] text-slate-900">
        {value}
      </span>
    </div>
  );
}

export function AthleteCarnet({ athlete }: { athlete: AthleteProfile }) {
  const { t } = useI18n();
  const { isMobile } = useDevice();

  return (
    <div className="space-y-4">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <h3 className="text-base font-bold text-white">
          {t(
            "Carnet Oficial de Atleta (Anverso y Reverso)",
            "Official Athlete ID Card (Front & Back)"
          )}
        </h3>
        <button
          type="button"
          onClick={() => window.print()}
          className="w-full sm:w-auto rounded-xl border border-emerald-500/40 bg-emerald-500/15 px-4 py-2 text-xs font-bold text-emerald-300 hover:bg-emerald-500/25 transition-colors cursor-pointer print:hidden"
        >
          {t("Imprimir / Descargar Carnet", "Print / Download ID Card")}
        </button>
      </div>

      <div className={`grid gap-5 sm:gap-6 ${isMobile ? "grid-cols-1" : "md:grid-cols-2"}`}>
        {/* ANVERSO (FRENTE) */}
        <div className="responsive-report-card relative overflow-hidden rounded-2xl border border-emerald-400/40 bg-gradient-to-br from-[#0B1528] via-[#09101E] to-[#060A13] p-4 sm:p-5 shadow-2xl">
          <div className="flex items-center justify-between border-b border-white/10 pb-3">
            <div className="flex items-center gap-2.5">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src="/synergia-logo.svg"
                alt="SYNERGIA ALL STARS"
                className="h-8 w-auto object-contain"
              />
              <p className="text-[9px] uppercase tracking-[0.18em] text-emerald-400">
                Escuela Exclusiva de Porrismo
              </p>
            </div>
            <span className="rounded-md bg-amber-400/20 px-2 py-0.5 text-[10px] font-bold text-amber-300 border border-amber-400/30">
              ATLETA OFICIAL
            </span>
          </div>

          <div className="mt-4 flex items-center gap-4">
            {/* Foto tipo carnet */}
            <div className="h-28 w-24 shrink-0 overflow-hidden rounded-xl border-2 border-emerald-400/50 bg-slate-900 flex items-center justify-center">
              {athlete.photoDataUrl ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img
                  src={athlete.photoDataUrl}
                  alt={athlete.fullName}
                  className="h-full w-full object-cover"
                />
              ) : (
                <span className="px-2 text-center text-[10px] text-slate-500">
                  Sin foto carnet
                </span>
              )}
            </div>

            <div className="min-w-0 flex-1 space-y-1.5 text-xs">
              <div>
                <p className="text-[10px] uppercase text-slate-400">Nombre</p>
                <p className="truncate text-sm font-extrabold text-white">
                  {athlete.fullName}
                </p>
              </div>
              <div className="grid grid-cols-2 gap-2">
                <div>
                  <p className="text-[10px] uppercase text-slate-400">ID</p>
                  <p className="font-mono font-bold text-amber-300">
                    {athlete.athleteId}
                  </p>
                </div>
                <div>
                  <p className="text-[10px] uppercase text-slate-400">Sangre</p>
                  <p className="font-bold text-rose-300">
                    {athlete.bloodType || "Pendiente"}
                  </p>
                </div>
              </div>
              <div>
                <p className="text-[10px] uppercase text-slate-400">
                  Categoría & Posición
                </p>
                <p className="truncate font-semibold text-emerald-300">
                  {athlete.category}
                </p>
                <p className="truncate text-[11px] text-slate-300">
                  {athlete.position}
                </p>
              </div>
            </div>
          </div>

          <div className="mt-4 flex items-center justify-between border-t border-white/10 pt-3">
            <BarcodeSvg value={athlete.athleteId} />
            <div className="text-right text-[10px] text-slate-400">
              <p>Doc: {athlete.documentId}</p>
              <p>Edad: {athlete.age} años</p>
            </div>
          </div>
        </div>

        {/* REVERSO */}
        <div className="relative flex flex-col justify-between overflow-hidden rounded-2xl border border-white/15 bg-gradient-to-br from-[#0A1120] to-[#060911] p-5 shadow-2xl">
          <div className="space-y-2.5 text-xs">
            <div className="flex items-center justify-between border-b border-white/10 pb-2">
              <span className="font-bold uppercase tracking-wider text-emerald-400 text-[11px]">
                Información Médica y Emergencia
              </span>
              <span className="font-mono text-[10px] text-slate-400">
                {athlete.athleteId}
              </span>
            </div>

            <div className="grid grid-cols-2 gap-2">
              <div>
                <span className="text-[10px] text-slate-400 block">
                  Alergias:
                </span>
                <span className="text-slate-200 font-medium">
                  {athlete.hasAllergies
                    ? athlete.allergiesDetail || "Sí (ver ficha)"
                    : "Ninguna reportada"}
                </span>
              </div>
              <div>
                <span className="text-[10px] text-slate-400 block">
                  Medicamentos:
                </span>
                <span className="text-slate-200 font-medium">
                  {athlete.medications || "Ninguno"}
                </span>
              </div>
            </div>

            <div>
              <span className="text-[10px] text-slate-400 block">
                Dirección de vivienda:
              </span>
              <span className="text-slate-200">
                {athlete.homeAddress || "Por completar en perfil"}
              </span>
            </div>

            <div>
              <span className="text-[10px] text-slate-400 block">
                Contacto de emergencia:
              </span>
              <span className="text-slate-200 font-medium">
                {athlete.emergencyContact || athlete.repName || "No registrado"}{" "}
                · {athlete.emergencyPhone || athlete.phone}
              </span>
            </div>
          </div>

          {/* Firma del Representante Legal de la Academia */}
          <div className="mt-5 border-t border-white/10 pt-3 flex items-end justify-between gap-4">
            <p className="text-[9px] leading-snug text-slate-400 max-w-[55%]">
              Este carnet es personal e intransferible y acredita al atleta
              como miembro activo de SYNERGIA ALL STARS.
            </p>

            <div className="text-center">
              <svg
                viewBox="0 0 160 40"
                className="mx-auto h-8 w-28 text-emerald-300"
                fill="none"
              >
                <path
                  d="M12 28 C25 8, 42 32, 58 14 C70 2, 76 34, 92 18 C104 6, 118 26, 146 12"
                  stroke="currentColor"
                  strokeWidth="2"
                  strokeLinecap="round"
                />
              </svg>
              <div className="border-t border-slate-500 pt-1">
                <p className="text-[9px] font-bold uppercase tracking-wider text-white">
                  Representante Legal
                </p>
                <p className="text-[8px] text-emerald-400">
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
