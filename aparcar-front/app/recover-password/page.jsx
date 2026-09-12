"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { toast } from "sonner";
import api from "../api";

const recoverSchema = z.object({
  email: z.string().email("Ingresa un correo válido"),
});

export default function RecoverPasswordPage() {
  const [success, setSuccess] = useState(false);
  const router = useRouter();

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm({
    resolver: zodResolver(recoverSchema),
  });

  const onSubmit = async (data) => {
    try {
      await api.post("/forgot-password", data);
      setSuccess(true);
      toast.success("Código enviado, revisá tu correo");
      // El backend manda un código OTP por email (no un link), así que
      // llevamos al usuario a la pantalla donde lo ingresa junto con la
      // nueva contraseña.
      setTimeout(() => {
        router.push(`/reset-password?email=${encodeURIComponent(data.email)}`);
      }, 1200);
    } catch (err) {
      toast.error(err.response?.data?.message || "Ocurrió un error al procesar la solicitud.");
    }
  };

  return (
    <div className="flex min-h-screen items-center justify-center bg-white px-4 py-12 sm:px-6 lg:px-8">
      <div className="w-full max-w-md space-y-8 rounded-2xl bg-white p-8 shadow-xl shadow-[#002147]/10 ring-1 ring-[#002147]/15">
        <div>
          <h2 className="mt-6 text-center text-3xl font-extrabold tracking-tight text-[#002147]">
            Recuperar contraseña
          </h2>
          <p className="mt-2 text-center text-sm text-[#002147]/60">
            Ingresa tu correo para recibir las instrucciones
          </p>
        </div>

        {success ? (
          <div className="rounded-lg bg-[#0cb7f2]/10 p-4 border border-[#0cb7f2]/50">
            <p className="text-sm text-[#0cb7f2] text-center">
              Si el correo existe, vas a recibir un código para restablecer tu contraseña. Te redirigimos...
            </p>
          </div>
        ) : (
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
            </div>

            <div>
              <button
                type="submit"
                disabled={isSubmitting}
                className="group relative flex w-full justify-center rounded-xl bg-[#0cb7f2] px-3 py-3 text-sm font-semibold text-white hover:bg-[#002147] focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#0cb7f2] transition-all disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {isSubmitting ? "Enviando..." : "Enviar enlace"}
              </button>
            </div>
          </form>
        )}

        <div className="text-center mt-4 text-sm">
          <Link
            href="/login"
            className="font-medium text-[#0cb7f2] hover:text-[#002147] transition-colors"
          >
            Volver al inicio de sesión
          </Link>
        </div>
      </div>
    </div>
  );
}
