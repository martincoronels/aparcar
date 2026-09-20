"use client";

import { useEffect, useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { toast } from "sonner";
import api from "@/app/api";
import { formatoPatenteValido, MENSAJE_FORMATO_INVALIDO } from "@/utils/patenteValidation";

const visitanteSchema = z
  .object({
    nombre: z.string().min(1, "El nombre es obligatorio"),
    documento: z.string().min(1, "El documento es obligatorio"),
    email: z.string().min(1, "El email es obligatorio").email("Ingresa un correo válido"),
    telefono: z.string().optional(),
    patente: z.string().min(1, "La patente es obligatoria"),
    tipoVehiculo: z.enum(["AUTO", "MOTO", "CARGA"], {
      message: "Selecciona un tipo de vehículo",
    }),
    cocheraId: z.string().min(1, "Selecciona una cochera"),
  })
  .superRefine((data, ctx) => {
    if (!formatoPatenteValido(data.patente, data.tipoVehiculo)) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        path: ["patente"],
        message: MENSAJE_FORMATO_INVALIDO[data.tipoVehiculo],
      });
    }
  });

const inputClasses =
  "block w-full rounded-xl border-0 py-3 px-4 text-ink bg-surface ring-1 ring-inset ring-ink/20 placeholder:text-ink/40 focus:z-10 focus:ring-2 focus:ring-inset focus:ring-accent sm:text-sm sm:leading-6 transition-all disabled:opacity-50";
const labelClasses = "block text-sm font-medium text-ink/70 mb-1";
const hoy = () => new Date().toISOString().split("T")[0];

// Da de alta un visitante y lo deja estacionado en el momento: crea la cuenta,
// su vehículo y la reserva de hoy en una sola llamada. El backend lo resuelve
// en una transacción, así que o entra todo o no entra nada — antes esto eran
// dos llamadas sueltas y si la segunda fallaba quedaba un visitante huérfano.
//
// `onAltaCreada` es opcional: el panel lo usa para refrescar la ocupación y el
// listado de reservas, que viven en componentes hermanos.
export default function VisitantesContent({ onAltaCreada }) {
  const [cocheras, setCocheras] = useState([]);

  const {
    register,
    handleSubmit,
    watch,
    reset,
    setValue,
    formState: { errors, isSubmitting },
  } = useForm({
    resolver: zodResolver(visitanteSchema),
    defaultValues: { tipoVehiculo: "AUTO", cocheraId: "" },
  });

  const tipoVehiculo = watch("tipoVehiculo");

  // Las cocheras compatibles dependen del tipo de vehículo, así que la lista se
  // rearma cada vez que el admin cambia el tipo. Siempre para hoy: el alta
  // reserva en el momento, no a futuro.
  useEffect(() => {
    setValue("cocheraId", "");
    setCocheras([]);
    if (!tipoVehiculo) return;

    api
      .get("/api/v1/cocheras/disponibles", { params: { fecha: hoy(), tipoVehiculo } })
      .then((res) => setCocheras(res.data))
      .catch(() => toast.error("No se pudieron cargar las cocheras disponibles."));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [tipoVehiculo]);

  const onSubmit = async (data) => {
    try {
      await api.post("/api/v1/visitantes/alta", {
        nombre: data.nombre,
        documento: data.documento,
        email: data.email,
        telefono: data.telefono || undefined,
        patente: data.patente,
        tipoVehiculo: data.tipoVehiculo,
        cocheraId: data.cocheraId,
      });

      toast.success(
        `Visitante dado de alta y cochera reservada. Su contraseña inicial es su documento (${data.documento}).`
      );
      reset({ tipoVehiculo: "AUTO", cocheraId: "" });
      onAltaCreada?.();
    } catch (err) {
      toast.error(
        err.response?.data?.message || "Ocurrió un error al dar de alta al visitante."
      );
    }
  };

  return (
    <div className="mx-auto max-w-2xl">
      <h1 className="text-3xl font-extrabold tracking-tight text-ink mb-2">
        Nuevo visitante
      </h1>
      <p className="text-sm text-ink/60 mb-8">
        Cargá sus datos y su vehículo, y elegí la cochera que ocupa hoy. Queda con
        cuenta creada y su documento como contraseña inicial.
      </p>

      <div className="rounded-2xl bg-surface p-8 shadow-xl shadow-ink/10 ring-1 ring-ink/15">
        <form className="space-y-6" onSubmit={handleSubmit(onSubmit)}>
            <div>
              <h2 className="text-sm font-semibold text-accent uppercase tracking-wide mb-4">
                Datos del visitante
              </h2>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className={labelClasses} htmlFor="nombre">Nombre</label>
                  <input id="nombre" {...register("nombre")} className={inputClasses} placeholder="Nombre completo" />
                  {errors.nombre && <p className="mt-1 text-sm text-red-500">{errors.nombre.message}</p>}
                </div>
                <div>
                  <label className={labelClasses} htmlFor="documento">Documento</label>
                  <input id="documento" {...register("documento")} className={inputClasses} placeholder="DNI / documento" />
                  {errors.documento && <p className="mt-1 text-sm text-red-500">{errors.documento.message}</p>}
                </div>
                <div>
                  <label className={labelClasses} htmlFor="email">Email</label>
                  <input id="email" type="email" {...register("email")} className={inputClasses} placeholder="Con esto inicia sesión" />
                  {errors.email && <p className="mt-1 text-sm text-red-500">{errors.email.message}</p>}
                </div>
                <div>
                  <label className={labelClasses} htmlFor="telefono">Teléfono (opcional)</label>
                  <input id="telefono" {...register("telefono")} className={inputClasses} placeholder="Teléfono" />
                </div>
              </div>
            </div>

            <div>
              <h2 className="text-sm font-semibold text-accent uppercase tracking-wide mb-4">
                Vehículo y cochera
              </h2>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className={labelClasses} htmlFor="patente">Patente</label>
                  <input
                    id="patente"
                    {...register("patente")}
                    className={`${inputClasses} uppercase`}
                    placeholder="ABC123 / AB123CD"
                  />
                  {errors.patente && <p className="mt-1 text-sm text-red-500">{errors.patente.message}</p>}
                </div>
                <div>
                  <label className={labelClasses} htmlFor="tipoVehiculo">Tipo de vehículo</label>
                  <select id="tipoVehiculo" {...register("tipoVehiculo")} className={inputClasses}>
                    <option value="AUTO">Auto</option>
                    <option value="MOTO">Moto</option>
                    <option value="CARGA">Carga</option>
                  </select>
                  {errors.tipoVehiculo && <p className="mt-1 text-sm text-red-500">{errors.tipoVehiculo.message}</p>}
                </div>
                <div className="sm:col-span-2">
                  <label className={labelClasses} htmlFor="alta-cocheraId">Cochera (hoy)</label>
                  <select id="alta-cocheraId" {...register("cocheraId")} className={inputClasses}>
                    <option value="">Seleccioná una cochera</option>
                    {cocheras.map((c) => (
                      <option key={c.id} value={c.id}>
                        {c.numero} — {c.sector} ({c.tipo})
                      </option>
                    ))}
                  </select>
                  {errors.cocheraId && <p className="mt-1 text-sm text-red-500">{errors.cocheraId.message}</p>}
                  {cocheras.length === 0 && (
                    <p className="mt-1 text-sm text-ink/50">
                      No hay cocheras disponibles hoy para ese tipo de vehículo.
                    </p>
                  )}
                </div>
              </div>
            </div>

            <div>
              <button
                type="submit"
                disabled={isSubmitting}
                className="group relative flex w-full justify-center rounded-xl bg-accent px-3 py-3 text-sm font-semibold text-white hover:bg-brand focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-accent transition-all disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {isSubmitting ? "Guardando..." : "Dar de alta y reservar"}
              </button>
            </div>
        </form>
      </div>
    </div>
  );
}