import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "SYNERGIA Deportes | Portal Deportivo e Inscripciones",
  description:
    "Plataforma deportiva SYNERGIA: gestión de equipos, inscripción de atletas y acceso al sistema administrativo.",
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
