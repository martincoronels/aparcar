"use client";

import { useEffect, useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { toast } from "sonner";
import api from "@/app/api";
import ProtectedRoute from "@/components/ProtectedRoute";

const reservaSchema = z.object({
  visitanteId: z.string().min(1, "Selecciona un visitante"),
  vehiculoId: z.string().min(1, "Selecciona un vehículo"),
  cocheraId: z.string().min(1, "Selecciona una cochera"),
  fecha: z.string().min(1, "Selecciona una fecha"),
});

const inputClasses =
  "block w-full rounded-xl border-0 py-3 px-4 text-white bg-zinc-800 ring-1 ring-inset ring-zinc-700 placeholder:text-zinc-400 focus:z-10 focus:ring-2 focus:ring-inset focus:ring-emerald-500 sm:text-sm sm:leading-6 transition-all disabled:opacity-50";
const labelClasses = "block text-sm font-medium text-zinc-300 mb-1";
const today = () => new Date().toISOString().split("T")[0];

function EstadoBadge({ estado }) {
  const isConfirmada = estado === "CONFIRMADA";
  return (
    <span
      className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium ${
        isConfirmada
          ? "bg-emerald-900/40 text-emerald-400 ring-1 ring-inset ring-emerald-500/30"
          : "bg-zinc-800 text-zinc-400 ring-1 ring-inset ring-zinc-700"
      }`}
    >
      {estado}
    </span>
  );
}

function ReservasPageContent() {
  const [visitantes, setVisitantes] = useState([]);
  const [vehiculos, setVehiculos] = useState([]);
  const [cocheras, setCocheras] = useState([]);
  const [reservas, setReservas] = useState([]);
  const [loadingReservas, setLoadingReservas] = useState(true);

  const {
    register,
    handleSubmit,
    watch,
    reset,
    setValue,
    formState: { errors, isSubmitting },
  } = useForm({
    resolver: zodResolver(reservaSchema),
    defaultValues: { fecha: today() },
  });

  const visitanteId = watch("visitanteId");
  const vehiculoId = watch("vehiculoId");
  const fecha = watch("fecha");

  const cargarReservas = async () => {
    setLoadingReservas(true);
    try {
      const res = await api.get("/api/v1/reservas");
      setReservas(res.data);
    } catch {
      toast.error("No se pudieron cargar las reservas.");
    } finally {
      setLoadingReservas(false);
    }
  };

  useEffect(() => {
    api
      .get("/api/v1/visitantes")
      .then((res) => setVisitantes(res.data))
      .catch(() => toast.error("No se pudieron cargar los visitantes."));
    cargarReservas();
  }, []);

  useEffect(() => {
    setValue("vehiculoId", "");
    setValue("cocheraId", "");
    setVehiculos([]);
    setCocheras([]);
    if (!visitanteId) return;

    api
      .get("/api/v1/vehiculos", { params: { visitanteId } })
      .then((res) => setVehiculos(res.data))
      .catch(() => toast.error("No se pudieron cargar los vehículos del visitante."));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [visitanteId]);

  useEffect(() => {
    setValue("cocheraId", "");
    setCocheras([]);
    const vehiculo = vehiculos.find((v) => v.id === vehiculoId);
    if (!fecha || !vehiculo) return;

    api
      .get("/api/v1/cocheras/disponibles", { params: { fecha, tipoVehiculo: vehiculo.tipo } })
      .then((res) => setCocheras(res.data))
      .catch(() => toast.error("No se pudieron cargar las cocheras disponibles."));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [fecha, vehiculoId, vehiculos]);

  const onSubmit = async (data) => {
    try {
      await api.post("/api/v1/reservas", data);
      toast.success("Reserva creada correctamente");
      reset({ visitanteId: "", vehiculoId: "", cocheraId: "", fecha: today() });
      setVehiculos([]);
      setCocheras([]);
      cargarReservas();
    } catch (err) {
      toast.error(err.response?.data?.message || "No se pudo crear la reserva.");
    }
  };

  return (
    <div className="min-h-screen bg-zinc-950 px-4 py-12 sm:px-6 lg:px-8">
      <div className="mx-auto max-w-3xl space-y-10">
        <div>
          <h1 className="text-3xl font-extrabold tracking-tight text-white mb-2">Nueva reserva</h1>
          <p className="text-sm text-zinc-400">
            Elegí un visitante, uno de sus vehículos y una cochera disponible para la fecha.
          </p>
        </div>

        <div className="rounded-2xl bg-zinc-900 p-8 shadow-xl shadow-black/50 ring-1 ring-zinc-800">
          <form className="space-y-6" onSubmit={handleSubmit(onSubmit)}>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className={labelClasses} htmlFor="visitanteId">Visitante</label>
                <select id="visitanteId" {...register("visitanteId")} className={inputClasses}>
                  <option value="">Seleccioná un visitante</option>
                  {visitantes.map((v) => (
                    <option key={v.id} value={v.id}>
                      {v.nombre} — {v.documento}
                    </option>
                  ))}
                </select>
                {errors.visitanteId && <p className="mt-1 text-sm text-red-500">{errors.visitanteId.message}</p>}
              </div>

              <div>
                <label className={labelClasses} htmlFor="vehiculoId">Vehículo</label>
                <select
                  id="vehiculoId"
                  {...register("vehiculoId")}
                  className={inputClasses}
                  disabled={!visitanteId}
                >
                  <option value="">
                    {visitanteId ? "Seleccioná un vehículo" : "Elegí primero un visitante"}
                  </option>
                  {vehiculos.map((v) => (
                    <option key={v.id} value={v.id}>
                      {v.patente} ({v.tipo})
                    </option>
                  ))}
                </select>
                {errors.vehiculoId && <p className="mt-1 text-sm text-red-500">{errors.vehiculoId.message}</p>}
                {visitanteId && vehiculos.length === 0 && (
                  <p className="mt-1 text-sm text-zinc-500">Este visitante no tiene vehículos cargados.</p>
                )}
              </div>

              <div>
                <label className={labelClasses} htmlFor="fecha">Fecha</label>
                <input
                  id="fecha"
                  type="date"
                  min={today()}
                  {...register("fecha")}
                  className={inputClasses}
                />
                {errors.fecha && <p className="mt-1 text-sm text-red-500">{errors.fecha.message}</p>}
              </div>

              <div>
                <label className={labelClasses} htmlFor="cocheraId">Cochera</label>
                <select
                  id="cocheraId"
                  {...register("cocheraId")}
                  className={inputClasses}
                  disabled={!vehiculoId || !fecha}
                >
                  <option value="">
                    {vehiculoId && fecha ? "Seleccioná una cochera" : "Elegí primero vehículo y fecha"}
                  </option>
                  {cocheras.map((c) => (
                    <option key={c.id} value={c.id}>
                      {c.numero} — {c.sector} ({c.tipo})
                    </option>
                  ))}
                </select>
                {errors.cocheraId && <p className="mt-1 text-sm text-red-500">{errors.cocheraId.message}</p>}
                {vehiculoId && fecha && cocheras.length === 0 && (
                  <p className="mt-1 text-sm text-zinc-500">No hay cocheras disponibles para esa fecha.</p>
                )}
              </div>
            </div>

            <div>
              <button
                type="submit"
                disabled={isSubmitting}
                className="group relative flex w-full justify-center rounded-xl bg-emerald-600 px-3 py-3 text-sm font-semibold text-white hover:bg-emerald-500 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-emerald-600 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {isSubmitting ? "Reservando..." : "Confirmar reserva"}
              </button>
            </div>
          </form>
        </div>

        <div>
          <h2 className="text-xl font-bold text-white mb-4">Reservas existentes</h2>
          <div className="rounded-2xl bg-zinc-900 shadow-xl shadow-black/50 ring-1 ring-zinc-800 overflow-hidden">
            {loadingReservas ? (
              <div className="flex items-center justify-center p-8">
                <div className="h-6 w-6 animate-spin rounded-full border-4 border-emerald-500 border-t-transparent" />
              </div>
            ) : reservas.length === 0 ? (
              <p className="p-6 text-sm text-zinc-400">Todavía no hay reservas cargadas.</p>
            ) : (
              <ul className="divide-y divide-zinc-800">
                {reservas.map((r) => (
                  <li key={r.id} className="flex flex-wrap items-center justify-between gap-2 p-4">
                    <div>
                      <p className="text-sm font-medium text-white">
                        {r.visitante?.nombre} — {r.vehiculo?.patente}
                      </p>
                      <p className="text-xs text-zinc-400">
                        Cochera {r.cochera?.numero} ({r.cochera?.sector}) · {r.fecha}
                      </p>
                    </div>
                    <EstadoBadge estado={r.estado} />
                  </li>
                ))}
              </ul>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

export default function ReservasPage() {
  return (
    <ProtectedRoute allowedRoles={[]}>
      <ReservasPageContent />
    </ProtectedRoute>
  );
}
