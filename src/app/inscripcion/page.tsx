import { Suspense } from "react";
import { Navbar } from "@/components/Navbar";
import { Footer } from "@/components/Footer";
import { InscripcionForm } from "./InscripcionForm";

export default function InscripcionPage() {
  return (
    <div className="flex min-h-screen flex-col">
      <Navbar />

      <main className="flex-1 py-14 sm:py-20">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="mx-auto max-w-2xl text-center mb-10">
            <span className="inline-block rounded-full border border-amber-400/30 bg-amber-400/10 px-3.5 py-1 text-xs font-bold uppercase tracking-wider text-amber-300">
              Registro de Atletas
            </span>
            <h1 className="mt-4 text-3xl font-black tracking-tight text-white sm:text-4xl">
              Inscripción a Equipos
            </h1>
            <p className="mt-3 text-slate-300">
              Completa tus datos para postularte a nuestras selecciones y
              categorías deportivas.
            </p>
          </div>

          <Suspense
            fallback={
              <div className="mx-auto max-w-2xl rounded-3xl border border-white/10 bg-[#0D1322] p-10 text-center text-slate-400">
                Cargando formulario de inscripción...
              </div>
            }
          >
            <InscripcionForm />
          </Suspense>
        </div>
      </main>

      <Footer />
    </div>
  );
}
