"use client";

import { useEffect, useMemo, useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { toast } from "sonner";
import api from "@/app/api";

const reservaSchema = z.object({
  patente: z.string().min(1, "Ingresá una patente"),
  cocheraId: z.string().min(1, "Selecciona una cochera"),
  fecha: z.string().min(1, "Selecciona una fecha"),
});

const inputClasses =
  "block w-full rounded-xl border-0 py-3 px-4 text-[#002147] bg-white ring-1 ring-inset ring-[#002147]/20 placeholder:text-[#002147]/40 focus:z-10 focus:ring-2 focus:ring-inset focus:ring-[#0cb7f2] sm:text-sm sm:leading-6 transition-all disabled:opacity-50";
const labelClasses = "block text-sm font-medium text-[#002147]/70 mb-1";
const today = () => new Date().toISOString().split("T")[0];

function EstadoBadge({ estado }) {
  const isConfirmada = estado === "CONFIRMADA";
  return (
    <span
      className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium ${
        isConfirmada
          ? "bg-[#0cb7f2]/10 text-[#0cb7f2] ring-1 ring-inset ring-[#0cb7f2]/30"
          : "bg-[#002147]/5 text-[#002147]/50 ring-1 ring-inset ring-[#002147]/10"
      }`}
    >
      {estado}
    </span>
  );
}

export default function ReservasContent() {
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
    defaultValues: { fecha: today(), patente: "" },
  });

  const patente = watch("patente");
  const cocheraId = watch("cocheraId");
  const fecha = watch("fecha");

  // El vehículo se busca por patente en lo que ya cargaron el admin o el
  // propio visitante — no hace falta elegir visitante y vehículo por separado.
  const vehiculoEncontrado = useMemo(() => {
    const normalizada = patente?.trim().toUpperCase();
    if (!normalizada) return null;
    return vehiculos.find((v) => v.patente === normalizada) || null;
  }, [patente, vehiculos]);

  const visitanteEncontrado = useMemo(() => {
    if (!vehiculoEncontrado) return null;
    return visitantes.find((v) => v.id === vehiculoEncontrado.visitanteId) || null;
  }, [vehiculoEncontrado, visitantes]);

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

  // Se re-llama al enfocar el campo de patente (además de al montar), porque
  // el vehículo puede haberse cargado recién en "Mis datos", arriba de esta
  // misma página, y esta lista ya se había pedido antes de que existiera.
  const cargarCatalogos = () => {
    api
      .get("/api/v1/visitantes")
      .then((res) => setVisitantes(res.data))
      .catch(() => toast.error("No se pudieron cargar los visitantes."));
    api
      .get("/api/v1/vehiculos")
      .then((res) => setVehiculos(res.data))
      .catch(() => toast.error("No se pudieron cargar los vehículos."));
  };

  useEffect(() => {
    cargarCatalogos();
    cargarReservas();
  }, []);

  useEffect(() => {
    setValue("cocheraId", "");
    setCocheras([]);
    if (!fecha || !vehiculoEncontrado) return;

    api
      .get("/api/v1/cocheras/disponibles", { params: { fecha, tipoVehiculo: vehiculoEncontrado.tipo } })
      .then((res) => setCocheras(res.data))
      .catch(() => toast.error("No se pudieron cargar las cocheras disponibles."));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [fecha, vehiculoEncontrado]);

  const onSubmit = async (data) => {
    if (!vehiculoEncontrado || !visitanteEncontrado) {
      toast.error("No se encontró ningún vehículo con esa patente.");
      return;
    }

    try {
      await api.post("/api/v1/reservas", {
        visitanteId: visitanteEncontrado.id,
        vehiculoId: vehiculoEncontrado.id,
        cocheraId: data.cocheraId,
        fecha: data.fecha,
      });
      toast.success("Reserva creada correctamente");
      reset({ patente: "", cocheraId: "", fecha: today() });
      setCocheras([]);
      cargarReservas();
    } catch (err) {
      toast.error(err.response?.data?.message || "No se pudo crear la reserva.");
    }
  };

  return (
    <div className="mx-auto max-w-3xl space-y-10">
      <div>
        <h1 className="text-3xl font-extrabold tracking-tight text-[#002147] mb-2">Nueva reserva</h1>
        <p className="text-sm text-[#002147]/60">
          Ingresá la patente del vehículo y elegí una cochera disponible para la fecha.
        </p>
      </div>

      <div className="rounded-2xl bg-white p-8 shadow-xl shadow-[#002147]/10 ring-1 ring-[#002147]/15">
        <form className="space-y-6" onSubmit={handleSubmit(onSubmit)}>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className={labelClasses} htmlFor="patente">Patente</label>
              <input
                id="patente"
                list="patentes-registradas"
                {...register("patente")}
                onFocus={cargarCatalogos}
                className={`${inputClasses} uppercase`}
                placeholder="ABC123 / AB123CD"
              />
              <datalist id="patentes-registradas">
                {vehiculos.map((v) => (
                  <option key={v.id} value={v.patente} />
                ))}
              </datalist>
              {errors.patente && <p className="mt-1 text-sm text-red-500">{errors.patente.message}</p>}

              {patente && !vehiculoEncontrado && (
                <p className="mt-1 text-sm text-[#002147]/50">
                  No hay ningún vehículo registrado con esa patente.
                </p>
              )}
              {vehiculoEncontrado && visitanteEncontrado && (
                <p className="mt-1 text-sm text-[#0cb7f2]">
                  {visitanteEncontrado.nombre} — {vehiculoEncontrado.tipo}
                </p>
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

            <div className="sm:col-span-2">
              <label className={labelClasses} htmlFor="cocheraId">Cochera</label>
              <select
                id="cocheraId"
                {...register("cocheraId")}
                className={inputClasses}
                disabled={!vehiculoEncontrado || !fecha}
              >
                <option value="">
                  {vehiculoEncontrado && fecha ? "Seleccioná una cochera" : "Ingresá primero una patente válida y una fecha"}
                </option>
                {cocheras.map((c) => (
                  <option key={c.id} value={c.id}>
                    {c.numero} — {c.sector} ({c.tipo})
                  </option>
                ))}
              </select>
              {errors.cocheraId && <p className="mt-1 text-sm text-red-500">{errors.cocheraId.message}</p>}
              {vehiculoEncontrado && fecha && cocheras.length === 0 && (
                <p className="mt-1 text-sm text-[#002147]/50">No hay cocheras disponibles para esa fecha.</p>
              )}
            </div>
          </div>

          <div>
            <button
              type="submit"
              disabled={isSubmitting || !cocheraId}
              className="group relative flex w-full justify-center rounded-xl bg-[#0cb7f2] px-3 py-3 text-sm font-semibold text-white hover:bg-[#002147] focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#0cb7f2] transition-all disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {isSubmitting ? "Reservando..." : "Confirmar reserva"}
            </button>
          </div>
        </form>
      </div>

      <div>
        <h2 className="text-xl font-bold text-[#002147] mb-4">Reservas existentes</h2>
        <div className="rounded-2xl bg-white shadow-xl shadow-[#002147]/10 ring-1 ring-[#002147]/15 overflow-hidden">
          {loadingReservas ? (
            <div className="flex items-center justify-center p-8">
              <div className="h-6 w-6 animate-spin rounded-full border-4 border-[#0cb7f2] border-t-transparent" />
            </div>
          ) : reservas.length === 0 ? (
            <p className="p-6 text-sm text-[#002147]/60">Todavía no hay reservas cargadas.</p>
          ) : (
            <ul className="divide-y divide-[#002147]/10">
              {reservas.map((r) => (
                <li key={r.id} className="flex flex-wrap items-center justify-between gap-2 p-4">
                  <div>
                    <p className="text-sm font-medium text-[#002147]">
                      {r.visitante?.nombre} — {r.vehiculo?.patente}
                    </p>
                    <p className="text-xs text-[#002147]/60">
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
  );
}
