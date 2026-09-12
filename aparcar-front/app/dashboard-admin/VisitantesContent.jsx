"use client";

import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { toast } from "sonner";
import api from "@/app/api";

const PATENTE_REGEX = /^([A-Za-z]{3}[0-9]{3}|[A-Za-z]{2}[0-9]{3}[A-Za-z]{2})$/;

const visitanteSchema = z.object({
  nombre: z.string().min(1, "El nombre es obligatorio"),
  documento: z.string().min(1, "El documento es obligatorio"),
  telefono: z.string().optional(),
  email: z.string().email("Ingresa un correo válido").or(z.literal("")).optional(),
  patente: z
    .string()
    .min(1, "La patente es obligatoria")
    .regex(PATENTE_REGEX, "Formato inválido (ej: ABC123 o AB123CD)"),
  tipo: z.enum(["AUTO", "MOTO", "CARGA"], {
    message: "Selecciona un tipo de vehículo",
  }),
});

const inputClasses =
  "block w-full rounded-xl border-0 py-3 px-4 text-white bg-zinc-800 ring-1 ring-inset ring-zinc-700 placeholder:text-zinc-400 focus:z-10 focus:ring-2 focus:ring-inset focus:ring-emerald-500 sm:text-sm sm:leading-6 transition-all";
const labelClasses = "block text-sm font-medium text-zinc-300 mb-1";

export default function VisitantesContent() {
  const {
    register,
    handleSubmit,
    reset,
    formState: { errors, isSubmitting },
  } = useForm({
    resolver: zodResolver(visitanteSchema),
    defaultValues: { tipo: "AUTO" },
  });

  const onSubmit = async (data) => {
    try {
      const visitanteRes = await api.post("/api/v1/visitantes", {
        nombre: data.nombre,
        documento: data.documento,
        telefono: data.telefono || undefined,
        email: data.email || undefined,
      });

      await api.post("/api/v1/vehiculos", {
        patente: data.patente,
        tipo: data.tipo,
        visitanteId: visitanteRes.data.id,
      });

      toast.success("Visitante y vehículo cargados correctamente");
      reset();
    } catch (err) {
      toast.error(
        err.response?.data?.message || "Ocurrió un error al cargar el visitante."
      );
    }
  };

  return (
    <div className="mx-auto max-w-2xl">
      <h1 className="text-3xl font-extrabold tracking-tight text-white mb-2">
        Nuevo visitante
      </h1>
      <p className="text-sm text-zinc-400 mb-8">
        Cargá los datos del visitante junto con su vehículo.
      </p>

      <div className="rounded-2xl bg-zinc-900 p-8 shadow-xl shadow-black/50 ring-1 ring-zinc-800">
        <form className="space-y-6" onSubmit={handleSubmit(onSubmit)}>
            <div>
              <h2 className="text-sm font-semibold text-emerald-500 uppercase tracking-wide mb-4">
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
                  <label className={labelClasses} htmlFor="telefono">Teléfono (opcional)</label>
                  <input id="telefono" {...register("telefono")} className={inputClasses} placeholder="Teléfono" />
                </div>
                <div>
                  <label className={labelClasses} htmlFor="email">Email (opcional)</label>
                  <input id="email" type="email" {...register("email")} className={inputClasses} placeholder="Email" />
                  {errors.email && <p className="mt-1 text-sm text-red-500">{errors.email.message}</p>}
                </div>
              </div>
            </div>

            <div>
              <h2 className="text-sm font-semibold text-emerald-500 uppercase tracking-wide mb-4">
                Vehículo
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
                  <label className={labelClasses} htmlFor="tipo">Tipo de vehículo</label>
                  <select id="tipo" {...register("tipo")} className={inputClasses}>
                    <option value="AUTO">Auto</option>
                    <option value="MOTO">Moto</option>
                    <option value="CARGA">Carga</option>
                  </select>
                  {errors.tipo && <p className="mt-1 text-sm text-red-500">{errors.tipo.message}</p>}
                </div>
              </div>
            </div>

            <div>
              <button
                type="submit"
                disabled={isSubmitting}
                className="group relative flex w-full justify-center rounded-xl bg-emerald-600 px-3 py-3 text-sm font-semibold text-white hover:bg-emerald-500 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-emerald-600 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {isSubmitting ? "Guardando..." : "Guardar visitante"}
              </button>
            </div>
        </form>
      </div>
    </div>
  );
}
