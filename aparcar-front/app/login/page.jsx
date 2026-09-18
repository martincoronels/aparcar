"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { toast } from "sonner";
import { jwtDecode } from "jwt-decode";
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
        {
          headers: { Authorization: `Basic ${credentials}` },
          validateStatus: (status) => status === 401 || (status >= 200 && status < 300),
        }
      );

      if (response.status === 401) {
        toast.error("Credenciales incorrectas. Verificá tu email y contraseña.");
        return;
      }

      const authHeader = response.headers["authorization"];
      if (!authHeader) {
        toast.error("El servidor no devolvió un token de sesión.");
        return;
      }

      const token = authHeader.replace(/^Bearer\s+/i, "");
      setAuth(token);
      toast.success("Inicio de sesión exitoso");

      // La verificación de a dónde mandar a cada rol pasa acá, justo al
      // aceptar el login — no como un redirect automático en otra página.
      const roles = jwtDecode(token).authorities
        ?.split(",")
        .map((r) => r.trim())
        .filter(Boolean) || [];
      router.push(roles.includes("ADMIN") ? "/dashboard-admin" : "/dashboard-user");
    } catch (err) {
      toast.error(
        err.response?.status === 401
          ? "Email o contraseña incorrectos."
          : err.response?.data?.message || "Error al iniciar sesión."
      );
    }
  };

  return (
    <div className="flex min-h-screen items-center justify-center bg-white px-4 py-12 sm:px-6 lg:px-8">
      <div className="w-full max-w-md space-y-8 rounded-2xl bg-white p-8 shadow-xl shadow-[#002147]/10 ring-1 ring-[#002147]/15">
        <div>
          <img
            src="/Logo.jpeg"
            alt="AparcAR"
            className="mx-auto h-40 w-auto object-contain"
          />
          <h2 className="mt-6 text-center text-3xl font-extrabold tracking-tight text-[#002147]">
            Iniciar sesión
          </h2>
          <p className="mt-2 text-center text-sm text-[#002147]/60">
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
                className="relative block w-full rounded-xl border-0 py-3 px-4 text-[#002147] bg-white ring-1 ring-inset ring-[#002147]/20 placeholder:text-[#002147]/40 focus:z-10 focus:ring-2 focus:ring-inset focus:ring-[#0cb7f2] sm:text-sm sm:leading-6 transition-all"
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
                className="relative block w-full rounded-xl border-0 py-3 px-4 text-[#002147] bg-white ring-1 ring-inset ring-[#002147]/20 placeholder:text-[#002147]/40 focus:z-10 focus:ring-2 focus:ring-inset focus:ring-[#0cb7f2] sm:text-sm sm:leading-6 transition-all"
                placeholder="Contraseña"
              />
              {errors.password && <p className="mt-1 text-sm text-red-500">{errors.password.message}</p>}
            </div>
          </div>

          <div className="flex items-center justify-between">
            <div className="text-sm">
              <Link
                href="/recover-password"
                className="font-medium text-[#0cb7f2] hover:text-[#002147] transition-colors"
              >
                ¿Olvidaste tu contraseña?
              </Link>
            </div>
          </div>

          <div>
            <button
              type="submit"
              disabled={isSubmitting}
              className="group relative flex w-full justify-center rounded-xl bg-[#0cb7f2] px-3 py-3 text-sm font-semibold text-white hover:bg-[#002147] focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#0cb7f2] transition-all disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {isSubmitting ? "Iniciando..." : "Ingresar"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
