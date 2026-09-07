"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { toast } from "sonner";
import api from "../api";
import { useAuthStore } from "../../store/authStore";

const loginSchema = z.object({
  email: z.string().email("Ingresa un correo válido"),
  password: z.string().min(6, "La contraseña debe tener al menos 6 caracteres"),
});

export default function LoginPage() {
  const router = useRouter();
  const setAuth = useAuthStore((state) => state.setAuth);

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm({
    resolver: zodResolver(loginSchema),
  });

  const onSubmit = async (data) => {
    try {
      // El backend valida el login con HTTP Basic Auth (no un body JSON), y
      // devuelve el JWT en el header "Authorization" de la respuesta (no en
      // el body). Por eso acá no usamos el interceptor de `api` para el
      // Authorization saliente: lo seteamos manualmente como Basic.
      const credentials = btoa(`${data.email}:${data.password}`);
      const response = await api.post(
        "/login",
        {},
        { headers: { Authorization: `Basic ${credentials}` } }
      );

      const authHeader = response.headers["authorization"];
      if (!authHeader) {
        toast.error("El servidor no devolvió un token de sesión.");
        return;
      }

      const token = authHeader.replace(/^Bearer\s+/i, "");
      setAuth(token);
      toast.success("Inicio de sesión exitoso");
      router.push("/");
    } catch (err) {
      toast.error(
        err.response?.status === 401
          ? "Email o contraseña incorrectos."
          : err.response?.data?.message || "Error al iniciar sesión."
      );
    }
  };

  return (
    <div className="flex min-h-screen items-center justify-center bg-zinc-950 px-4 py-12 sm:px-6 lg:px-8">
      <div className="w-full max-w-md space-y-8 rounded-2xl bg-zinc-900 p-8 shadow-xl shadow-black/50 ring-1 ring-zinc-800">
        <div>
          <h2 className="mt-6 text-center text-3xl font-extrabold tracking-tight text-white">
            Iniciar sesión
          </h2>
          <p className="mt-2 text-center text-sm text-zinc-400">
            AparcAR — acceso para personal interno
          </p>
        </div>

        <form className="mt-8 space-y-6" onSubmit={handleSubmit(onSubmit)}>
          <div className="space-y-4">
            <div>
              <label htmlFor="email-address" className="sr-only">
                Correo electrónico
              </label>
              <input
                id="email-address"
                type="email"
                autoComplete="email"
                {...register("email")}
                className="relative block w-full rounded-xl border-0 py-3 px-4 text-white bg-zinc-800 ring-1 ring-inset ring-zinc-700 placeholder:text-zinc-400 focus:z-10 focus:ring-2 focus:ring-inset focus:ring-emerald-500 sm:text-sm sm:leading-6 transition-all"
                placeholder="Correo electrónico"
              />
              {errors.email && <p className="mt-1 text-sm text-red-500">{errors.email.message}</p>}
            </div>
            <div>
              <label htmlFor="password" className="sr-only">
                Contraseña
              </label>
              <input
                id="password"
                type="password"
                autoComplete="current-password"
                {...register("password")}
                className="relative block w-full rounded-xl border-0 py-3 px-4 text-white bg-zinc-800 ring-1 ring-inset ring-zinc-700 placeholder:text-zinc-400 focus:z-10 focus:ring-2 focus:ring-inset focus:ring-emerald-500 sm:text-sm sm:leading-6 transition-all"
                placeholder="Contraseña"
              />
              {errors.password && <p className="mt-1 text-sm text-red-500">{errors.password.message}</p>}
            </div>
          </div>

          <div className="flex items-center justify-between">
            <div className="text-sm">
              <Link
                href="/recover-password"
                className="font-medium text-emerald-500 hover:text-emerald-400 transition-colors"
              >
                ¿Olvidaste tu contraseña?
              </Link>
            </div>
          </div>

          <div>
            <button
              type="submit"
              disabled={isSubmitting}
              className="group relative flex w-full justify-center rounded-xl bg-emerald-600 px-3 py-3 text-sm font-semibold text-white hover:bg-emerald-500 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-emerald-600 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {isSubmitting ? "Iniciando..." : "Ingresar"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
