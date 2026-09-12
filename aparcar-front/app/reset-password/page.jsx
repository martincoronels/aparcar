"use client";

import { Suspense } from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { toast } from "sonner";
import api from "../api";

const resetSchema = z
  .object({
    email: z.string().email("Ingresa un correo válido"),
    otp: z.string().min(1, "Ingresá el código que recibiste por correo"),
    newPassword: z.string().min(8, "La contraseña debe tener al menos 8 caracteres"),
    confirmPassword: z.string(),
  })
  .refine((data) => data.newPassword === data.confirmPassword, {
    message: "Las contraseñas no coinciden",
    path: ["confirmPassword"],
  });

function ResetPasswordForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const emailFromQuery = searchParams.get("email") || "";

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm({
    resolver: zodResolver(resetSchema),
    defaultValues: { email: emailFromQuery },
  });

  const onSubmit = async (data) => {
    try {
      // El backend espera el campo "new_password" en snake_case.
      await api.post("/reset-password", {
        email: data.email,
        otp: data.otp,
        new_password: data.newPassword,
      });
      toast.success("Contraseña actualizada. Ya podés iniciar sesión.");
      router.push("/login");
    } catch (err) {
      toast.error(
        err.response?.data?.message || "El código es inválido o expiró. Solicitá uno nuevo."
      );
    }
  };

  return (
    <div className="w-full max-w-md space-y-8 rounded-2xl bg-white p-8 shadow-xl shadow-[#002147]/10 ring-1 ring-[#002147]/15">
      <div>
        <h2 className="mt-6 text-center text-3xl font-extrabold tracking-tight text-[#002147]">
          Restablecer contraseña
        </h2>
        <p className="mt-2 text-center text-sm text-[#002147]/60">
          Ingresá el código que recibiste por correo y tu nueva contraseña
        </p>
      </div>

      <form className="mt-8 space-y-4" onSubmit={handleSubmit(onSubmit)}>
        <div>
          <label htmlFor="email" className="sr-only">Correo electrónico</label>
          <input
            id="email"
            type="email"
            autoComplete="email"
            {...register("email")}
            className="relative block w-full rounded-xl border-0 py-3 px-4 text-[#002147] bg-white ring-1 ring-inset ring-[#002147]/20 placeholder:text-[#002147]/40 focus:z-10 focus:ring-2 focus:ring-inset focus:ring-[#0cb7f2] sm:text-sm sm:leading-6 transition-all"
            placeholder="Correo electrónico"
          />
          {errors.email && <p className="mt-1 text-sm text-red-500">{errors.email.message}</p>}
        </div>

        <div>
          <label htmlFor="otp" className="sr-only">Código</label>
          <input
            id="otp"
            type="text"
            inputMode="numeric"
            {...register("otp")}
            className="relative block w-full rounded-xl border-0 py-3 px-4 text-[#002147] bg-white ring-1 ring-inset ring-[#002147]/20 placeholder:text-[#002147]/40 focus:z-10 focus:ring-2 focus:ring-inset focus:ring-[#0cb7f2] sm:text-sm sm:leading-6 transition-all"
            placeholder="Código recibido por correo"
          />
          {errors.otp && <p className="mt-1 text-sm text-red-500">{errors.otp.message}</p>}
        </div>

        <div>
          <label htmlFor="newPassword" className="sr-only">Nueva contraseña</label>
          <input
            id="newPassword"
            type="password"
            autoComplete="new-password"
            {...register("newPassword")}
            className="relative block w-full rounded-xl border-0 py-3 px-4 text-[#002147] bg-white ring-1 ring-inset ring-[#002147]/20 placeholder:text-[#002147]/40 focus:z-10 focus:ring-2 focus:ring-inset focus:ring-[#0cb7f2] sm:text-sm sm:leading-6 transition-all"
            placeholder="Nueva contraseña"
          />
          {errors.newPassword && <p className="mt-1 text-sm text-red-500">{errors.newPassword.message}</p>}
        </div>

        <div>
          <label htmlFor="confirmPassword" className="sr-only">Confirmar contraseña</label>
          <input
            id="confirmPassword"
            type="password"
            autoComplete="new-password"
            {...register("confirmPassword")}
            className="relative block w-full rounded-xl border-0 py-3 px-4 text-[#002147] bg-white ring-1 ring-inset ring-[#002147]/20 placeholder:text-[#002147]/40 focus:z-10 focus:ring-2 focus:ring-inset focus:ring-[#0cb7f2] sm:text-sm sm:leading-6 transition-all"
            placeholder="Confirmar nueva contraseña"
          />
          {errors.confirmPassword && <p className="mt-1 text-sm text-red-500">{errors.confirmPassword.message}</p>}
        </div>

        <div>
          <button
            type="submit"
            disabled={isSubmitting}
            className="group relative flex w-full justify-center rounded-xl bg-[#0cb7f2] px-3 py-3 text-sm font-semibold text-white hover:bg-[#002147] focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#0cb7f2] transition-all disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {isSubmitting ? "Actualizando..." : "Restablecer contraseña"}
          </button>
        </div>
      </form>

      <div className="text-center text-sm">
        <Link href="/login" className="font-medium text-[#0cb7f2] hover:text-[#002147] transition-colors">
          Volver al inicio de sesión
        </Link>
      </div>
    </div>
  );
}

export default function ResetPasswordPage() {
  return (
    <div className="flex min-h-screen items-center justify-center bg-white px-4 py-12 sm:px-6 lg:px-8">
      <Suspense fallback={
        <div className="h-8 w-8 animate-spin rounded-full border-4 border-[#0cb7f2] border-t-transparent" />
      }>
        <ResetPasswordForm />
      </Suspense>
    </div>
  );
}
