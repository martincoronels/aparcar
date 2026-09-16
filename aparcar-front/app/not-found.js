import Link from "next/link";

export default function NotFound() {
  return (
    <div className="flex min-h-screen flex-col items-center justify-center bg-white px-4 text-center">
      <h1 className="text-4xl font-extrabold tracking-tight text-[#002147]">Página no encontrada</h1>
      <p className="mt-4 text-[#002147]/60">La ruta a la que intentaste acceder no existe.</p>
      <Link
        href="/"
        className="mt-8 rounded-xl bg-[#0cb7f2] px-6 py-3 text-sm font-semibold text-white hover:bg-[#002147] transition-all"
      >
        Ir al inicio
      </Link>
    </div>
  );
}