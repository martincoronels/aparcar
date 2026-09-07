"use client";

import { useEffect } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useAuthStore } from "../store/authStore";

export default function Home() {
  const router = useRouter();
  const { isAuthenticated, isHydrated, checkAuth } = useAuthStore();

  useEffect(() => {
    checkAuth();
  }, [checkAuth]);

  useEffect(() => {
    if (isHydrated && isAuthenticated) {
      router.push("/admin");
    }
  }, [isHydrated, isAuthenticated, router]);

  return (
    <div className="flex min-h-screen items-center justify-center bg-zinc-950 px-4">
      <div className="w-full max-w-md space-y-6 rounded-2xl bg-zinc-900 p-8 text-center shadow-xl shadow-black/50 ring-1 ring-zinc-800">
        <h1 className="text-3xl font-extrabold tracking-tight text-white">AparcAR</h1>
        <p className="text-zinc-400">
          Sistema de reserva de cocheras — Proyecto Integral de Desarrollo.
        </p>
        <Link
          href="/login"
          className="inline-block w-full rounded-xl bg-emerald-600 px-4 py-3 text-sm font-semibold text-white hover:bg-emerald-500 transition-all"
        >
          Iniciar sesión
        </Link>
      </div>
    </div>
  );
}
