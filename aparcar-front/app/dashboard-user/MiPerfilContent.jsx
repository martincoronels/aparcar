"use client";

import { useEffect, useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { toast } from "sonner";
import api from "@/app/api";

const PATENTE_REGEX = /^([A-Za-z]{3}[0-9]{3}|[A-Za-z]{2}[0-9]{3}[A-Za-z]{2})$/;

const perfilSchema = z.object({
  nombre: z.string().min(1, "El nombre es obligatorio"),
  documento: z.string().min(1, "El documento es obligatorio"),
  telefono: z.string().optional(),
  email: z.string().email("Ingresa un correo válido").or(z.literal("")).optional(),
});

const vehiculoSchema = z.object({
  patente: z
    .string()
    .min(1, "La patente es obligatoria")
    .regex(PATENTE_REGEX, "Formato inválido (ej: ABC123 o AB123CD)"),
  tipo: z.enum(["AUTO", "MOTO", "CARGA"], {
    message: "Selecciona un tipo de vehículo",
  }),
});

const inputClasses =
  "block w-full rounded-xl border-0 py-3 px-4 text-[#002147] bg-white ring-1 ring-inset ring-[#002147]/20 placeholder:text-[#002147]/40 focus:z-10 focus:ring-2 focus:ring-inset focus:ring-[#0cb7f2] sm:text-sm sm:leading-6 transition-all";
const labelClasses = "block text-sm font-medium text-[#002147]/70 mb-1";

export default function MiPerfilContent() {
  const [visitante, setVisitante] = useState(null);
  const [vehiculos, setVehiculos] = useState([]);
  const [loading, setLoading] = useState(true);

  const perfilForm = useForm({ resolver: zodResolver(perfilSchema) });
  const vehiculoForm = useForm({
    resolver: zodResolver(vehiculoSchema),
    defaultValues: { patente: "", tipo: "AUTO" },
  });

  const cargarVehiculos = async (visitanteId) => {
    const res = await api.get("/api/v1/vehiculos", { params: { visitanteId } });
    setVehiculos(res.data);
  };

  const cargar = async () => {
    try {
      setLoading(true);
      const res = await api.get("/api/v1/visitantes/me");
      setVisitante(res.data);
      await cargarVehiculos(res.data.id);
    } catch (error) {
      if (error.response?.status === 404) {
        setVisitante(null);
      } else {
        toast.error("No se pudieron cargar tus datos.");
      }
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    cargar();
  }, []);

  const onCrearPerfil = async (data) => {
    try {
      const res = await api.post("/api/v1/visitantes/me", {
        nombre: data.nombre,
        documento: data.documento,
        telefono: data.telefono || undefined,
        email: data.email || undefined,
      });
      toast.success("Tus datos quedaron registrados");
      setVisitante(res.data);
      setVehiculos([]);
    } catch (err) {
      toast.error(err.response?.data?.message || "No se pudieron guardar tus datos.");
    }
  };

  const onAgregarVehiculo = async (data) => {
    try {
      await api.post("/api/v1/vehiculos", { ...data, visitanteId: visitante.id });
      toast.success("Vehículo agregado correctamente");
      vehiculoForm.reset({ patente: "", tipo: "AUTO" });
      await cargarVehiculos(visitante.id);
    } catch (err) {
      toast.error(err.response?.data?.message || "No se pudo agregar el vehículo.");
    }
  };

  if (loading) {
    return <div className="text-center text-sm text-[#002147]/60 p-8">Cargando tus datos...</div>;
  }

  return (
    <div className="mx-auto max-w-2xl">
      <h1 className="text-3xl font-extrabold tracking-tight text-[#002147] mb-2">Mis datos</h1>
      <p className="text-sm text-[#002147]/60 mb-8">
        {visitante
          ? "Tus datos y vehículos registrados."
          : "Cargá tus datos una sola vez para poder reservar una cochera."}
      </p>

      {!visitante ? (
        <div className="rounded-2xl bg-white p-8 shadow-xl shadow-[#002147]/10 ring-1 ring-[#002147]/15">
          <form className="space-y-4" onSubmit={perfilForm.handleSubmit(onCrearPerfil)}>
            <div>
              <label className={labelClasses} htmlFor="nombre">Nombre</label>
              <input id="nombre" {...perfilForm.register("nombre")} className={inputClasses} placeholder="Nombre completo" />
              {perfilForm.formState.errors.nombre && (
                <p className="mt-1 text-sm text-red-500">{perfilForm.formState.errors.nombre.message}</p>
              )}
            </div>
            <div>
              <label className={labelClasses} htmlFor="documento">Documento</label>
              <input id="documento" {...perfilForm.register("documento")} className={inputClasses} placeholder="DNI / documento" />
              {perfilForm.formState.errors.documento && (
                <p className="mt-1 text-sm text-red-500">{perfilForm.formState.errors.documento.message}</p>
              )}
            </div>
            <div>
              <label className={labelClasses} htmlFor="telefono">Teléfono (opcional)</label>
              <input id="telefono" {...perfilForm.register("telefono")} className={inputClasses} placeholder="Teléfono" />
            </div>
            <div>
              <label className={labelClasses} htmlFor="email">Email (opcional)</label>
              <input id="email" type="email" {...perfilForm.register("email")} className={inputClasses} placeholder="Email" />
              {perfilForm.formState.errors.email && (
                <p className="mt-1 text-sm text-red-500">{perfilForm.formState.errors.email.message}</p>
              )}
            </div>
            <button
              type="submit"
              disabled={perfilForm.formState.isSubmitting}
              className="flex w-full justify-center rounded-xl bg-[#0cb7f2] px-3 py-3 text-sm font-semibold text-white hover:bg-[#002147] transition-all disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {perfilForm.formState.isSubmitting ? "Guardando..." : "Guardar mis datos"}
            </button>
          </form>
        </div>
      ) : (
        <div className="space-y-8">
          <div className="rounded-2xl bg-white p-6 shadow-xl shadow-[#002147]/10 ring-1 ring-[#002147]/15">
            <h2 className="text-lg font-bold text-[#002147]">{visitante.nombre}</h2>
            <p className="text-sm text-[#002147]/60">
              Documento {visitante.documento}
              {visitante.telefono ? ` · ${visitante.telefono}` : ""}
              {visitante.email ? ` · ${visitante.email}` : ""}
            </p>
          </div>

          <div className="rounded-2xl bg-white p-6 shadow-xl shadow-[#002147]/10 ring-1 ring-[#002147]/15">
            <h2 className="text-lg font-bold text-[#002147] mb-4">Mis vehículos</h2>

            {vehiculos.length === 0 ? (
              <p className="text-sm text-[#002147]/60 mb-4">Todavía no cargaste ningún vehículo.</p>
            ) : (
              <ul className="mb-4 divide-y divide-[#002147]/10">
                {vehiculos.map((v) => (
                  <li key={v.id} className="py-2 flex items-center justify-between text-sm">
                    <span className="font-medium text-[#002147]">{v.patente}</span>
                    <span className="text-[#002147]/60">{v.tipo}</span>
                  </li>
                ))}
              </ul>
            )}

            <form
              className="grid grid-cols-1 sm:grid-cols-[1fr_auto_auto] gap-3 sm:items-start"
              onSubmit={vehiculoForm.handleSubmit(onAgregarVehiculo)}
            >
              <div>
                <input
                  {...vehiculoForm.register("patente")}
                  className={`${inputClasses} uppercase`}
                  placeholder="ABC123 / AB123CD"
                />
                {vehiculoForm.formState.errors.patente && (
                  <p className="mt-1 text-sm text-red-500">{vehiculoForm.formState.errors.patente.message}</p>
                )}
              </div>
              <select {...vehiculoForm.register("tipo")} className={inputClasses}>
                <option value="AUTO">Auto</option>
                <option value="MOTO">Moto</option>
                <option value="CARGA">Carga</option>
              </select>
              <button
                type="submit"
                disabled={vehiculoForm.formState.isSubmitting}
                className="rounded-xl bg-[#0cb7f2] px-4 py-3 text-sm font-semibold text-white hover:bg-[#002147] transition-all disabled:opacity-50 disabled:cursor-not-allowed"
              >
                Agregar
              </button>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
