import Link from "next/link";

export default function Home() {
  return (
    <div className="flex min-h-screen items-center justify-center bg-white px-4">
      <div className="w-full max-w-md space-y-6 rounded-2xl bg-white p-8 text-center shadow-xl shadow-[#002147]/10 ring-1 ring-[#002147]/15">
        <h1 className="text-3xl font-extrabold tracking-tight text-[#002147]">AparcAR</h1>
        <p className="text-[#002147]/60">
          Sistema de reserva de cocheras — Proyecto Integral de Desarrollo.
        </p>
        <Link
          href="/login"
          className="inline-block w-full rounded-xl bg-[#0cb7f2] px-4 py-3 text-sm font-semibold text-white hover:bg-[#002147] transition-all"
        >
          Iniciar sesión
        </Link>
      </div>
    </div>
  );
}
