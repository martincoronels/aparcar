"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useAuthStore } from "../store/authStore";

function CarIcon({ className }) {
  return (
    <svg viewBox="0 0 24 24" fill="none" className={className}>
      <path
        d="M3 16h1.5m15 0H21m-16.5 0a1.5 1.5 0 103 0m-3 0a1.5 1.5 0 013 0m10.5 0a1.5 1.5 0 103 0m-3 0a1.5 1.5 0 013 0M4.5 16V11l1.8-4.2A2 2 0 018.15 5.5h7.7a2 2 0 011.85 1.3L19.5 11v5"
        stroke="currentColor"
        strokeWidth="1.5"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}

function ShieldIcon({ className }) {
  return (
    <svg viewBox="0 0 24 24" fill="none" className={className}>
      <path
        d="M12 3l7 3v6c0 4.5-3 7.5-7 9-4-1.5-7-4.5-7-9V6l7-3z"
        stroke="currentColor"
        strokeWidth="1.5"
        strokeLinejoin="round"
      />
      <path
        d="M9 12l2 2 4-4"
        stroke="currentColor"
        strokeWidth="1.5"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}

function CalendarIcon({ className }) {
  return (
    <svg viewBox="0 0 24 24" fill="none" className={className}>
      <rect
        x="3.5"
        y="5"
        width="17"
        height="15"
        rx="2"
        stroke="currentColor"
        strokeWidth="1.5"
      />
      <path
        d="M3.5 9.5h17M8 3v4M16 3v4"
        stroke="currentColor"
        strokeWidth="1.5"
        strokeLinecap="round"
      />
    </svg>
  );
}

function UsersIcon({ className }) {
  return (
    <svg viewBox="0 0 24 24" fill="none" className={className}>
      <circle
        cx="9"
        cy="8"
        r="3"
        stroke="currentColor"
        strokeWidth="1.5"
      />
      <path
        d="M3.5 19c0-3 2.5-5 5.5-5s5.5 2 5.5 5M16 8.5a2.5 2.5 0 110 5M20.5 19c0-2.3-1.7-4.1-4-4.7"
        stroke="currentColor"
        strokeWidth="1.5"
        strokeLinecap="round"
      />
    </svg>
  );
}

const NAV_LINKS = [
  { href: "#servicio", label: "El servicio" },
  { href: "#como-funciona", label: "Cómo funciona" },
];

export default function Home() {
  const router = useRouter();
  const { isAuthenticated, isHydrated, user, checkAuth } = useAuthStore();
  const [menuOpen, setMenuOpen] = useState(false);

  useEffect(() => {
    checkAuth();
  }, [checkAuth]);

  useEffect(() => {
    if (isHydrated && isAuthenticated && user) {
      router.replace(
        user.roles?.includes("ADMIN")
          ? "/dashboard-admin"
          : "/dashboard-user"
      );
    }
  }, [isHydrated, isAuthenticated, user, router]);

  return (
    <div className="min-h-screen bg-white">
      <header className="sticky top-0 z-20 border-b border-[#002147]/10 bg-white/90 backdrop-blur">
        <div className="mx-auto flex max-w-6xl items-center justify-between px-4 py-4 sm:px-6">
          <div className="flex items-center gap-3">
            <img
              src="/Logo.jpeg"
              alt="AparcAR"
              className="h-10 w-auto object-contain"
            />
            <span className="text-lg font-extrabold tracking-tight text-[#002147]">
              AparcAR
            </span>
          </div>

          <nav className="hidden items-center gap-8 md:flex">
            {NAV_LINKS.map((link) => (
              <Link
                key={link.href}
                href={link.href}
                className="text-sm font-medium text-[#002147]/70 transition-colors hover:text-[#002147]"
              >
                {link.label}
              </Link>
            ))}

            <Link
              href="/login"
              className="rounded-xl bg-[#0cb7f2] px-5 py-2.5 text-sm font-semibold text-white transition-all hover:bg-[#002147]"
            >
              Iniciar sesión
            </Link>
          </nav>

          <button
            type="button"
            onClick={() => setMenuOpen((v) => !v)}
            aria-label="Abrir menú"
            aria-expanded={menuOpen}
            className="flex h-10 w-10 items-center justify-center rounded-lg text-[#002147] md:hidden"
          >
            <svg viewBox="0 0 24 24" fill="none" className="h-6 w-6">
              {menuOpen ? (
                <path
                  d="M6 6l12 12M18 6L6 18"
                  stroke="currentColor"
                  strokeWidth="2"
                  strokeLinecap="round"
                />
              ) : (
                <path
                  d="M4 7h16M4 12h16M4 17h16"
                  stroke="currentColor"
                  strokeWidth="2"
                  strokeLinecap="round"
                />
              )}
            </svg>
          </button>
        </div>

        {menuOpen && (
          <div className="border-t border-[#002147]/10 px-4 py-4 md:hidden">
            <div className="flex flex-col gap-4">
              {NAV_LINKS.map((link) => (
                <Link
                  key={link.href}
                  href={link.href}
                  onClick={() => setMenuOpen(false)}
                  className="text-sm font-medium text-[#002147]/70"
                >
                  {link.label}
                </Link>
              ))}

              <Link
                href="/login"
                className="rounded-xl bg-[#0cb7f2] px-5 py-3 text-center text-sm font-semibold text-white"
              >
                Iniciar sesión
              </Link>
            </div>
          </div>
        )}
      </header>

      <main>
        <section className="mx-auto max-w-6xl px-4 py-20 text-center sm:px-6 sm:py-28">
          <h1 className="mx-auto max-w-3xl text-4xl font-extrabold tracking-tight text-[#002147] sm:text-6xl">
            Nadie debería dar vueltas buscando dónde estacionar
          </h1>

          <p className="mx-auto mt-6 max-w-2xl text-lg text-[#002147]/60">
            AparcAR administra las cocheras de tu edificio, universidad,
            sanatorio o evento: cada visitante entra sabiendo que ya tiene un
            lugar asignado.
          </p>

          <div className="mt-10 flex justify-center">
            <Link
              href="/login"
              className="rounded-xl bg-[#0cb7f2] px-8 py-4 text-base font-semibold text-white transition-all hover:bg-[#002147]"
            >
              Iniciar sesión
            </Link>
          </div>
        </section>

        <section id="servicio" className="bg-[#002147]/[0.03] py-20">
          <div className="mx-auto max-w-6xl px-4 sm:px-6">
            <h2 className="text-center text-3xl font-extrabold tracking-tight text-[#002147]">
              Todo lo que necesita tu predio
            </h2>

            <div className="mt-12 grid grid-cols-1 gap-8 sm:grid-cols-2 lg:grid-cols-4">
              {[
                {
                  icon: ShieldIcon,
                  title: "Control de acceso",
                  text: "Solo entra quien tiene una reserva confirmada para ese día.",
                },
                {
                  icon: UsersIcon,
                  title: "Visitantes y vehículos",
                  text: "Cada visitante carga sus datos y sus vehículos una sola vez.",
                },
                {
                  icon: CarIcon,
                  title: "Cocheras por tipo",
                  text: "Auto, moto, accesible o carga — cada reserva usa una cochera compatible.",
                },
                {
                  icon: CalendarIcon,
                  title: "Reservas por fecha",
                  text: "Sin sobreocupación: nunca dos reservas confirmadas para el mismo lugar.",
                },
              ].map(({ icon: Icon, title, text }) => (
                <div
                  key={title}
                  className="rounded-2xl bg-white p-6 shadow-lg shadow-[#002147]/5 ring-1 ring-[#002147]/10"
                >
                  <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-[#0cb7f2]/10 text-[#0cb7f2]">
                    <Icon className="h-6 w-6" />
                  </div>

                  <h3 className="mt-4 font-bold text-[#002147]">{title}</h3>

                  <p className="mt-2 text-sm text-[#002147]/60">{text}</p>
                </div>
              ))}
            </div>
          </div>
        </section>

        <section id="como-funciona" className="py-20">
          <div className="mx-auto max-w-4xl px-4 sm:px-6">
            <h2 className="text-center text-3xl font-extrabold tracking-tight text-[#002147]">
              Cómo funciona
            </h2>

            <div className="mt-12 grid grid-cols-1 gap-8 sm:grid-cols-3">
              {[
                {
                  step: "01",
                  title: "Cargás tus datos",
                  text: "Una sola vez: tu nombre, documento y tus vehículos.",
                },
                {
                  step: "02",
                  title: "Elegís fecha y cochera",
                  text: "El sistema te muestra solo las cocheras compatibles y libres.",
                },
                {
                  step: "03",
                  title: "Ingresás con tu reserva",
                  text: "Portería valida que tenés un lugar confirmado para ese día.",
                },
              ].map(({ step, title, text }) => (
                <div key={step} className="text-center">
                  <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-[#002147] text-sm font-bold text-white">
                    {step}
                  </div>

                  <h3 className="mt-4 font-bold text-[#002147]">{title}</h3>

                  <p className="mt-2 text-sm text-[#002147]/60">{text}</p>
                </div>
              ))}
            </div>
          </div>
        </section>
      </main>

      <footer className="border-t border-[#002147]/10 py-8 text-center text-sm text-[#002147]/50">
        AparcAR — Proyecto Integral de Desarrollo, UCAio.
      </footer>
    </div>
  );
}