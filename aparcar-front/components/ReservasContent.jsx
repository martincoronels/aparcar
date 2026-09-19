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

// Lo usan los dos dashboards, pero no hacen lo mismo:
//
// - modo "admin": busca la patente en el catálogo completo y reserva a nombre
//   de cualquier visitante ya registrado. Ve todas las reservas del sistema.
// - modo "user": elige entre sus propias patentes y reserva a su nombre. Ve
//   solo sus reservas.
//
// La separación es real, no cosmética: el backend ignora el visitanteId que
// mande un USER y usa su cuenta, y filtra el listado por dueño. Lo de acá es
// para que la pantalla no ofrezca lo que el backend después va a rechazar.
//
// `onOcupacionCambiada` es opcional: el dashboard-admin lo usa para refrescar
// la cuadrícula de ocupación, que vive en un componente hermano. Se dispara
// tanto al crear una reserva como al cancelarla, porque las dos cosas cambian
// qué cocheras están libres.
export default function ReservasContent({ modo = "user", onOcupacionCambiada, refreshKey = 0 }) {
  const esAdmin = modo === "admin";

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

  const vehiculoEncontrado = useMemo(() => {
    const normalizada = patente?.trim().toUpperCase();
    if (!normalizada) return null;
    return vehiculos.find((v) => v.patente === normalizada) || null;
  }, [patente, vehiculos]);

  // Solo el admin necesita saber de quién es el vehículo: el visitante reserva
  // para sí mismo y el backend resuelve a nombre de quién va.
  const visitanteEncontrado = useMemo(() => {
    if (!esAdmin || !vehiculoEncontrado) return null;
    return visitantes.find((v) => v.id === vehiculoEncontrado.visitanteId) || null;
  }, [esAdmin, vehiculoEncontrado, visitantes]);

  const cargarReservas = async () => {
    setLoadingReservas(true);
    try {
      // El backend ya devuelve todas las reservas si sos ADMIN, y solo las
      // propias si sos visitante. Acá no hay nada que filtrar.
      const res = await api.get("/api/v1/reservas");
      setReservas(res.data);
    } catch {
      toast.error("No se pudieron cargar las reservas.");
    } finally {
      setLoadingReservas(false);
    }
  };

  // GET /api/v1/vehiculos devuelve el catálogo completo para el ADMIN y solo
  // los propios para un visitante, así que la misma llamada sirve en los dos
  // modos. Se re-llama al enfocar el campo de patente (además de al montar)
  // porque el vehículo puede haberse cargado recién arriba en esta página.
  const cargarCatalogos = () => {
    api
      .get("/api/v1/vehiculos")
      .then((res) => setVehiculos(res.data))
      .catch(() => toast.error("No se pudieron cargar los vehículos."));

    if (!esAdmin) return;

    api
      .get("/api/v1/visitantes")
      .then((res) => setVisitantes(res.data))
      .catch(() => toast.error("No se pudieron cargar los visitantes."));
  };

  useEffect(() => {
    cargarCatalogos();
    cargarReservas();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [refreshKey]);

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
    if (!vehiculoEncontrado) {
      toast.error("No se encontró ningún vehículo con esa patente.");
      return;
    }

    if (esAdmin && !visitanteEncontrado) {
      toast.error("No se encontró el visitante dueño de ese vehículo.");
      return;
    }

    try {
      await api.post("/api/v1/reservas", {
        // Solo el admin puede reservar en nombre de otro; para un visitante el
        // backend ignora este campo y usa su propia cuenta.
        visitanteId: esAdmin ? visitanteEncontrado.id : undefined,
        vehiculoId: vehiculoEncontrado.id,
        cocheraId: data.cocheraId,
        fecha: data.fecha,
      });
      toast.success("Reserva creada correctamente");
      reset({ patente: "", cocheraId: "", fecha: today() });
      setCocheras([]);
      cargarReservas();
      onOcupacionCambiada?.();
    } catch (err) {
      toast.error(err.response?.data?.message || "No se pudo crear la reserva.");
    }
  };

  const cancelarReserva = async (reserva) => {
    const confirmado = window.confirm(
      `¿Seguro que querés cancelar la reserva de la cochera ${reserva.cochera?.numero} del ${reserva.fecha}?`
    );
    if (!confirmado) {
      return;
    }

    try {
      await api.post(`/api/v1/reservas/${reserva.id}/cancelar`);
      toast.success("Reserva cancelada correctamente");
      cargarReservas();
      onOcupacionCambiada?.();
    } catch (err) {
      toast.error(err.response?.data?.message || "No se pudo cancelar la reserva.");
    }
  };

  const sinVehiculos = !esAdmin && vehiculos.length === 0;

  return (
    <div className="mx-auto max-w-3xl space-y-10">
      <div>
        <h1 className="text-3xl font-extrabold tracking-tight text-[#002147] mb-2">Nueva reserva</h1>
        <p className="text-sm text-[#002147]/60">
          {esAdmin
            ? "Ingresá la patente del vehículo y elegí una cochera disponible para la fecha."
            : "Elegí uno de tus vehículos y una cochera disponible para la fecha."}
        </p>
      </div>

      <div className="rounded-2xl bg-white p-8 shadow-xl shadow-[#002147]/10 ring-1 ring-[#002147]/15">
        {sinVehiculos ? (
          <p className="text-sm text-[#002147]/60">
            Cargá al menos un vehículo en &quot;Mis datos&quot; para poder reservar.
          </p>
        ) : (
        <form className="space-y-6" onSubmit={handleSubmit(onSubmit)}>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className={labelClasses} htmlFor="reserva-patente">Patente</label>
              {esAdmin ? (
                <>
                  <input
                    id="reserva-patente"
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
                </>
              ) : (
                <select
                  id="reserva-patente"
                  {...register("patente")}
                  onFocus={cargarCatalogos}
                  className={inputClasses}
                >
                  <option value="">Seleccioná un vehículo</option>
                  {vehiculos.map((v) => (
                    <option key={v.id} value={v.patente}>
                      {v.patente} — {v.tipo}
                    </option>
                  ))}
                </select>
              )}
              {errors.patente && <p className="mt-1 text-sm text-red-500">{errors.patente.message}</p>}

              {esAdmin && patente && !vehiculoEncontrado && (
                <p className="mt-1 text-sm text-[#002147]/50">
                  No hay ningún vehículo registrado con esa patente.
                </p>
              )}
              {esAdmin && vehiculoEncontrado && visitanteEncontrado && (
                <p className="mt-1 text-sm text-[#0cb7f2]">
                  {visitanteEncontrado.nombre} — {vehiculoEncontrado.tipo}
                </p>
              )}
            </div>

            <div>
              <label className={labelClasses} htmlFor="reserva-fecha">Fecha</label>
              <input
                id="reserva-fecha"
                type="date"
                min={today()}
                {...register("fecha")}
                className={inputClasses}
              />
              {errors.fecha && <p className="mt-1 text-sm text-red-500">{errors.fecha.message}</p>}
            </div>

            <div className="sm:col-span-2">
              <label className={labelClasses} htmlFor="reserva-cocheraId">Cochera</label>
              <select
                id="reserva-cocheraId"
                {...register("cocheraId")}
                className={inputClasses}
                disabled={!vehiculoEncontrado || !fecha}
              >
                <option value="">
                  {vehiculoEncontrado && fecha
                    ? "Seleccioná una cochera"
                    : esAdmin
                    ? "Ingresá primero una patente válida y una fecha"
                    : "Elegí primero un vehículo y una fecha"}
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
        )}
      </div>

      <div>
        <h2 className="text-xl font-bold text-[#002147] mb-4">
          {esAdmin ? "Todas las reservas" : "Mis reservas"}
        </h2>
        <div className="rounded-2xl bg-white shadow-xl shadow-[#002147]/10 ring-1 ring-[#002147]/15 overflow-hidden">
          {loadingReservas ? (
            <div className="flex items-center justify-center p-8">
              <div className="h-6 w-6 animate-spin rounded-full border-4 border-[#0cb7f2] border-t-transparent" />
            </div>
          ) : reservas.length === 0 ? (
            <p className="p-6 text-sm text-[#002147]/60">
              {esAdmin ? "Todavía no hay reservas cargadas." : "Todavía no tenés reservas."}
            </p>
          ) : (
            <ul className="divide-y divide-[#002147]/10">
              {reservas.map((r) => (
                <li key={r.id} className="flex flex-wrap items-center justify-between gap-2 p-4">
                  <div>
                    <p className="text-sm font-medium text-[#002147]">
                      {esAdmin ? `${r.visitante?.nombre} — ${r.vehiculo?.patente}` : r.vehiculo?.patente}
                    </p>
                    <p className="text-xs text-[#002147]/60">
                      Cochera {r.cochera?.numero} ({r.cochera?.sector}) · {r.fecha}
                    </p>
                  </div>
                  <div className="flex items-center gap-3">
                    <EstadoBadge estado={r.estado} />
                    {r.estado === "CONFIRMADA" && (
                      <button
                        type="button"
                        onClick={() => cancelarReserva(r)}
                        className="rounded-lg border border-red-200 px-2.5 py-1 text-xs font-semibold text-red-600 hover:bg-red-50 transition-colors"
                      >
                        Cancelar
                      </button>
                    )}
                  </div>
                </li>
              ))}
            </ul>
          )}
        </div>
      </div>
    </div>
  );
}
