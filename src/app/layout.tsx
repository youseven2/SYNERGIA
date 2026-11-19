import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "SYNERGIA ALL STARS | Escuela Exclusiva de Porrismo",
  description:
    "SYNERGIA ALL STARS: escuela exclusiva de atletas de porrismo. Inscripción a equipos y acceso al sistema administrativo.",
};

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html lang="es" className="h-full antialiased">
      <body className="min-h-full flex flex-col bg-[#070B14] text-slate-100 font-sans selection:bg-emerald-500/30 selection:text-emerald-200">
        {children}
      </body>
    </html>
  );
}
