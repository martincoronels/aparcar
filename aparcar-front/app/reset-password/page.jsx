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
    <div className="w-full max-w-md space-y-8 rounded-2xl bg-zinc-900 p-8 shadow-xl shadow-black/50 ring-1 ring-zinc-800">
      <div>
        <h2 className="mt-6 text-center text-3xl font-extrabold tracking-tight text-white">
          Restablecer contraseña
        </h2>
        <p className="mt-2 text-center text-sm text-zinc-400">
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
            className="relative block w-full rounded-xl border-0 py-3 px-4 text-white bg-zinc-800 ring-1 ring-inset ring-zinc-700 placeholder:text-zinc-400 focus:z-10 focus:ring-2 focus:ring-inset focus:ring-emerald-500 sm:text-sm sm:leading-6 transition-all"
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
            className="relative block w-full rounded-xl border-0 py-3 px-4 text-white bg-zinc-800 ring-1 ring-inset ring-zinc-700 placeholder:text-zinc-400 focus:z-10 focus:ring-2 focus:ring-inset focus:ring-emerald-500 sm:text-sm sm:leading-6 transition-all"
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
            className="relative block w-full rounded-xl border-0 py-3 px-4 text-white bg-zinc-800 ring-1 ring-inset ring-zinc-700 placeholder:text-zinc-400 focus:z-10 focus:ring-2 focus:ring-inset focus:ring-emerald-500 sm:text-sm sm:leading-6 transition-all"
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
            className="relative block w-full rounded-xl border-0 py-3 px-4 text-white bg-zinc-800 ring-1 ring-inset ring-zinc-700 placeholder:text-zinc-400 focus:z-10 focus:ring-2 focus:ring-inset focus:ring-emerald-500 sm:text-sm sm:leading-6 transition-all"
            placeholder="Confirmar nueva contraseña"
          />
          {errors.confirmPassword && <p className="mt-1 text-sm text-red-500">{errors.confirmPassword.message}</p>}
        </div>

        <div>
          <button
            type="submit"
            disabled={isSubmitting}
            className="group relative flex w-full justify-center rounded-xl bg-emerald-600 px-3 py-3 text-sm font-semibold text-white hover:bg-emerald-500 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-emerald-600 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {isSubmitting ? "Actualizando..." : "Restablecer contraseña"}
          </button>
        </div>
      </form>

      <div className="text-center text-sm">
        <Link href="/login" className="font-medium text-emerald-500 hover:text-emerald-400 transition-colors">
          Volver al inicio de sesión
        </Link>
      </div>
    </div>
  );
}

export default function ResetPasswordPage() {
  return (
    <div className="flex min-h-screen items-center justify-center bg-zinc-950 px-4 py-12 sm:px-6 lg:px-8">
      <Suspense fallback={
        <div className="h-8 w-8 animate-spin rounded-full border-4 border-emerald-500 border-t-transparent" />
      }>
        <ResetPasswordForm />
      </Suspense>
    </div>
  );
}
