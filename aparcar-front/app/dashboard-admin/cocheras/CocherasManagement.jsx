"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { toast } from "sonner";

import api from "@/app/api";
import LogoutButton from "@/components/LogoutButton";

const cocheraSchema = z.object({
  numero: z.string().min(1, "El número es obligatorio"),
  sector: z.string().min(1, "El sector es obligatorio"),
  tipo: z.enum(["AUTO", "MOTO", "ACCESIBLE", "CARGA"], {
    message: "Selecciona un tipo de cochera",
  }),
  estado: z.enum(["HABILITADA", "DESHABILITADA"], {
    message: "Selecciona un estado",
  }),
});

const inputClasses =
  "block w-full rounded-xl border-0 py-3 px-4 text-ink bg-surface ring-1 ring-inset ring-ink/20 placeholder:text-ink/40 focus:z-10 focus:ring-2 focus:ring-inset focus:ring-accent sm:text-sm sm:leading-6 transition-all";

const labelClasses = "block text-sm font-medium text-ink/70 mb-1";

const TIPO_LABELS = {
  AUTO: "Auto",
  MOTO: "Moto",
  ACCESIBLE: "Accesible",
  CARGA: "Carga",
};

export default function CocherasManagement() {
  const [cocheras, setCocheras] = useState([]);
  const [loadingCocheras, setLoadingCocheras] = useState(true);
  const [editingCochera, setEditingCochera] = useState(null);

  const [filtroSector, setFiltroSector] = useState("");
  const [filtroTipo, setFiltroTipo] = useState("TODOS");
  const [filtroEstado, setFiltroEstado] = useState("TODOS");
  const [filtroFecha, setFiltroFecha] = useState("");

  // Sectores reales para el dropdown del filtro. Se piden aparte, sin
  // filtros, para que la lista no se achique a medida que el usuario filtra
  // por otra cosa (si la sacara de `cocheras` ya filtradas, un sector se
  // podria "perder" del dropdown apenas dejara de tener resultados visibles).
  const [sectoresDisponibles, setSectoresDisponibles] = useState([]);

  const {
    register: registerCreate,
    handleSubmit: handleCreateSubmit,
    reset: resetCreate,
    formState: { errors: createErrors, isSubmitting: isCreating },
  } = useForm({
    resolver: zodResolver(cocheraSchema),
    defaultValues: { numero: "", sector: "", tipo: "AUTO", estado: "HABILITADA" },
  });

  const {
    register: registerEdit,
    handleSubmit: handleEditSubmit,
    reset: resetEdit,
    formState: { errors: editErrors, isSubmitting: isEditing },
  } = useForm({
    resolver: zodResolver(cocheraSchema),
    defaultValues: { numero: "", sector: "", tipo: "AUTO", estado: "HABILITADA" },
  });

  const cargarSectores = async () => {
    try {
      const response = await api.get("/api/v1/cocheras");
      const distintos = Array.from(new Set(response.data.map((c) => c.sector))).sort();
      setSectoresDisponibles(distintos);
    } catch {
      // No es critico: si falla, el dropdown de sector queda vacio pero el
      // resto de la pantalla sigue funcionando.
    }
  };

  const loadCocheras = async () => {
    try {
      setLoadingCocheras(true);

      const params = {};
      if (filtroSector.trim()) params.sector = filtroSector.trim();
      if (filtroTipo !== "TODOS") params.tipo = filtroTipo;
      if (filtroEstado !== "TODOS") params.estado = filtroEstado;
      if (filtroFecha) params.fecha = filtroFecha;

      const response = await api.get("/api/v1/cocheras", { params });

      setCocheras(response.data);
    } catch (error) {
      toast.error(
        error.response?.data?.message || "No se pudieron cargar las cocheras."
      );
    } finally {
      setLoadingCocheras(false);
    }
  };

  useEffect(() => {
    cargarSectores();
  }, []);

  // Debounce de 300ms: cubre tanto el tipeo en el filtro de sector como los
  // demas filtros, para no disparar un pedido por cada tecla.
  useEffect(() => {
    const timer = setTimeout(() => {
      loadCocheras();
    }, 300);
    return () => clearTimeout(timer);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [filtroSector, filtroTipo, filtroEstado, filtroFecha]);

  const refrescarTodo = async () => {
    await Promise.all([loadCocheras(), cargarSectores()]);
  };

  const onCreateCochera = async (data) => {
    try {
      await api.post("/api/v1/cocheras", data);

      toast.success("Cochera creada correctamente");

      resetCreate();

      await refrescarTodo();
    } catch (error) {
      toast.error(
        error.response?.data?.message || "No se pudo crear la cochera."
      );
    }
  };

  const startEditing = (cochera) => {
    setEditingCochera(cochera);

    resetEdit({
      numero: cochera.numero,
      sector: cochera.sector,
      tipo: cochera.tipo,
      estado: cochera.estado,
    });
  };

  const cancelEditing = () => {
    setEditingCochera(null);

    resetEdit({ numero: "", sector: "", tipo: "AUTO", estado: "HABILITADA" });
  };

  const onEditCochera = async (data) => {
    if (!editingCochera) {
      return;
    }

    if (
      editingCochera.estado === "HABILITADA" &&
      data.estado === "DESHABILITADA"
    ) {
      const confirmed = window.confirm(
        "Esta cochera tiene reservas confirmadas a futuro, se van a cancelar automáticamente al deshabilitarla. ¿Confirmás?"
      );

      if (!confirmed) {
        return;
      }
    }

    try {
      await api.put(`/api/v1/cocheras/${editingCochera.id}`, data);

      toast.success("Cochera actualizada correctamente");

      cancelEditing();

      await refrescarTodo();
    } catch (error) {
      toast.error(
        error.response?.data?.message || "No se pudo actualizar la cochera."
      );
    }
  };

  const deleteCochera = async (cochera) => {
    const confirmed = window.confirm(
      `¿Seguro que querés eliminar la cochera ${cochera.numero}?`
    );

    if (!confirmed) {
      return;
    }

    try {
      await api.delete(`/api/v1/cocheras/${cochera.id}`);

      toast.success("Cochera eliminada correctamente");

      if (editingCochera?.id === cochera.id) {
        cancelEditing();
      }

      await refrescarTodo();
    } catch (error) {
      toast.error(
        error.response?.data?.message || "No se pudo eliminar la cochera."
      );
    }
  };

  return (
    <div className="min-h-screen bg-bg px-4 py-12 sm:px-6 lg:px-8">
      <div className="mx-auto max-w-7xl">
        <div className="mb-8 flex flex-wrap items-center justify-between gap-3">
          <Link
            href="/dashboard-admin"
            className="rounded-xl bg-surface px-4 py-2 text-sm font-semibold text-ink ring-1 ring-inset ring-ink/20 transition-colors hover:bg-ink/5"
          >
            ← Volver al panel
          </Link>
          <LogoutButton />
        </div>

        <div className="mb-8">
          <h1 className="text-3xl font-extrabold tracking-tight text-ink">
            Gestión de cocheras
          </h1>

          <p className="mt-2 text-sm text-ink/60">
            Administrá las cocheras del predio: número, sector, tipo y estado.
          </p>
        </div>

        <div className="grid grid-cols-1 gap-8 lg:grid-cols-3">
          <div className="lg:col-span-1">
            <div className="rounded-2xl bg-surface p-6 shadow-xl shadow-ink/10 ring-1 ring-ink/15">
              <h2 className="text-xl font-bold text-ink">Nueva cochera</h2>

              <p className="mt-1 mb-6 text-sm text-ink/60">
                Cargá una cochera nueva en el predio.
              </p>

              <form className="space-y-4" onSubmit={handleCreateSubmit(onCreateCochera)}>
                <div>
                  <label htmlFor="numero" className={labelClasses}>
                    Número
                  </label>

                  <input
                    id="numero"
                    {...registerCreate("numero")}
                    className={inputClasses}
                    placeholder="A-01"
                  />

                  {createErrors.numero && (
                    <p className="mt-1 text-sm text-red-500">
                      {createErrors.numero.message}
                    </p>
                  )}
                </div>

                <div>
                  <label htmlFor="sector" className={labelClasses}>
                    Sector
                  </label>

                  <input
                    id="sector"
                    {...registerCreate("sector")}
                    className={inputClasses}
                    placeholder="Planta Baja"
                  />

                  {createErrors.sector && (
                    <p className="mt-1 text-sm text-red-500">
                      {createErrors.sector.message}
                    </p>
                  )}
                </div>

                <div>
                  <label htmlFor="tipo" className={labelClasses}>
                    Tipo
                  </label>

                  <select id="tipo" {...registerCreate("tipo")} className={inputClasses}>
                    <option value="AUTO">Auto</option>
                    <option value="MOTO">Moto</option>
                    <option value="ACCESIBLE">Accesible</option>
                    <option value="CARGA">Carga</option>
                  </select>

                  {createErrors.tipo && (
                    <p className="mt-1 text-sm text-red-500">
                      {createErrors.tipo.message}
                    </p>
                  )}
                </div>

                <div>
                  <label htmlFor="estado" className={labelClasses}>
                    Estado
                  </label>

                  <select id="estado" {...registerCreate("estado")} className={inputClasses}>
                    <option value="HABILITADA">Habilitada</option>
                    <option value="DESHABILITADA">Deshabilitada</option>
                  </select>

                  {createErrors.estado && (
                    <p className="mt-1 text-sm text-red-500">
                      {createErrors.estado.message}
                    </p>
                  )}
                </div>

                <button
                  type="submit"
                  disabled={isCreating}
                  className="flex w-full justify-center rounded-xl bg-accent px-3 py-3 text-sm font-semibold text-white transition-all hover:bg-brand disabled:cursor-not-allowed disabled:opacity-50"
                >
                  {isCreating ? "Creando..." : "Crear cochera"}
                </button>
              </form>
            </div>
          </div>

          <div className="lg:col-span-2">
            {editingCochera && (
              <div className="mb-8 rounded-2xl bg-surface p-6 shadow-xl shadow-ink/10 ring-1 ring-ink/15">
                <div className="mb-6 flex items-start justify-between gap-4">
                  <div>
                    <h2 className="text-xl font-bold text-ink">Editar cochera</h2>
                    <p className="mt-1 text-sm text-ink/60">{editingCochera.numero}</p>
                  </div>

                  <button
                    type="button"
                    onClick={cancelEditing}
                    className="rounded-lg px-3 py-2 text-sm font-medium text-ink/60 transition-colors hover:bg-ink/5 hover:text-ink"
                  >
                    Cancelar
                  </button>
                </div>

                <form className="space-y-5" onSubmit={handleEditSubmit(onEditCochera)}>
                  <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                    <div>
                      <label htmlFor="edit-numero" className={labelClasses}>
                        Número
                      </label>

                      <input id="edit-numero" {...registerEdit("numero")} className={inputClasses} />

                      {editErrors.numero && (
                        <p className="mt-1 text-sm text-red-500">{editErrors.numero.message}</p>
                      )}
                    </div>

                    <div>
                      <label htmlFor="edit-sector" className={labelClasses}>
                        Sector
                      </label>

                      <input id="edit-sector" {...registerEdit("sector")} className={inputClasses} />

                      {editErrors.sector && (
                        <p className="mt-1 text-sm text-red-500">{editErrors.sector.message}</p>
                      )}
                    </div>

                    <div>
                      <label htmlFor="edit-tipo" className={labelClasses}>
                        Tipo
                      </label>

                      <select id="edit-tipo" {...registerEdit("tipo")} className={inputClasses}>
                        <option value="AUTO">Auto</option>
                        <option value="MOTO">Moto</option>
                        <option value="ACCESIBLE">Accesible</option>
                        <option value="CARGA">Carga</option>
                      </select>
                    </div>

                    <div>
                      <label htmlFor="edit-estado" className={labelClasses}>
                        Estado
                      </label>

                      <select id="edit-estado" {...registerEdit("estado")} className={inputClasses}>
                        <option value="HABILITADA">Habilitada</option>
                        <option value="DESHABILITADA">Deshabilitada</option>
                      </select>
                    </div>
                  </div>

                  <button
                    type="submit"
                    disabled={isEditing}
                    className="rounded-xl bg-accent px-5 py-3 text-sm font-semibold text-white transition-all hover:bg-brand disabled:cursor-not-allowed disabled:opacity-50"
                  >
                    {isEditing ? "Guardando..." : "Guardar cambios"}
                  </button>
                </form>
              </div>
            )}

            <div className="overflow-hidden rounded-2xl bg-surface shadow-xl shadow-ink/10 ring-1 ring-ink/15">
              <div className="border-b border-ink/10 px-6 py-5">
                <h2 className="text-xl font-bold text-ink">Cocheras</h2>
                <p className="mt-1 text-sm text-ink/60">Cocheras registradas en el predio.</p>

                <div className="mt-4 grid grid-cols-1 gap-3 sm:grid-cols-4">
                  <select
                    value={filtroSector || "TODOS"}
                    onChange={(e) => setFiltroSector(e.target.value === "TODOS" ? "" : e.target.value)}
                    className={inputClasses}
                  >
                    <option value="TODOS">Todos los sectores</option>
                    {sectoresDisponibles.map((sector) => (
                      <option key={sector} value={sector}>
                        {sector}
                      </option>
                    ))}
                  </select>

                  <select
                    value={filtroTipo}
                    onChange={(e) => setFiltroTipo(e.target.value)}
                    className={inputClasses}
                  >
                    <option value="TODOS">Todos los tipos</option>
                    <option value="AUTO">Auto</option>
                    <option value="MOTO">Moto</option>
                    <option value="ACCESIBLE">Accesible</option>
                    <option value="CARGA">Carga</option>
                  </select>

                  <select
                    value={filtroEstado}
                    onChange={(e) => setFiltroEstado(e.target.value)}
                    className={inputClasses}
                  >
                    <option value="TODOS">Todos los estados</option>
                    <option value="HABILITADA">Habilitada</option>
                    <option value="DESHABILITADA">Deshabilitada</option>
                  </select>

                  <div>
                    <input
                      type="date"
                      aria-label="Filtrar por fecha"
                      value={filtroFecha}
                      onChange={(e) => setFiltroFecha(e.target.value)}
                      className={inputClasses}
                    />
                    {filtroFecha && (
                      <button
                        type="button"
                        onClick={() => setFiltroFecha("")}
                        className="mt-1 text-xs font-medium text-accent hover:text-brand"
                      >
                        Quitar filtro de fecha
                      </button>
                    )}
                  </div>
                </div>
              </div>

              {loadingCocheras ? (
                <div className="p-8 text-center text-sm text-ink/60">
                  Cargando cocheras...
                </div>
              ) : cocheras.length === 0 ? (
                <div className="p-8 text-center text-sm text-ink/60">
                  No hay cocheras que coincidan con los filtros.
                </div>
              ) : (
                <div className="overflow-x-auto">
                  <table className="min-w-full divide-y divide-ink/10">
                    <thead className="bg-surface">
                      <tr>
                        <th className="px-6 py-3 text-left text-xs font-semibold uppercase tracking-wider text-ink/50">
                          Número
                        </th>
                        <th className="px-6 py-3 text-left text-xs font-semibold uppercase tracking-wider text-ink/50">
                          Sector
                        </th>
                        <th className="px-6 py-3 text-left text-xs font-semibold uppercase tracking-wider text-ink/50">
                          Tipo
                        </th>
                        <th className="px-6 py-3 text-left text-xs font-semibold uppercase tracking-wider text-ink/50">
                          Estado
                        </th>
                        <th className="px-6 py-3 text-left text-xs font-semibold uppercase tracking-wider text-ink/50">
                          {filtroFecha ? `Disponibilidad (${filtroFecha})` : "Disponibilidad"}
                        </th>
                        <th className="px-6 py-3 text-right text-xs font-semibold uppercase tracking-wider text-ink/50">
                          Acciones
                        </th>
                      </tr>
                    </thead>

                    <tbody className="divide-y divide-ink/10">
                      {cocheras.map((cochera) => (
                        <tr key={cochera.id} className="transition-colors hover:bg-accent/5">
                          <td className="whitespace-nowrap px-6 py-4 font-medium text-ink">
                            {cochera.numero}
                          </td>

                          <td className="whitespace-nowrap px-6 py-4 text-sm text-ink/70">
                            {cochera.sector}
                          </td>

                          <td className="whitespace-nowrap px-6 py-4">
                            <span className="rounded-full bg-accent/10 px-2.5 py-1 text-xs font-medium text-accent ring-1 ring-inset ring-accent/20">
                              {TIPO_LABELS[cochera.tipo]}
                            </span>
                          </td>

                          <td className="whitespace-nowrap px-6 py-4">
                            {cochera.estado === "HABILITADA" ? (
                              <span className="rounded-full bg-accent/10 px-2.5 py-1 text-xs font-medium text-accent ring-1 ring-inset ring-accent/20">
                                Habilitada
                              </span>
                            ) : (
                              <span className="rounded-full bg-ink/5 px-2.5 py-1 text-xs font-medium text-ink/50 ring-1 ring-inset ring-ink/10">
                                Deshabilitada
                              </span>
                            )}
                          </td>

                          <td className="whitespace-nowrap px-6 py-4">
                            {cochera.disponibleEnFecha === true && (
                              <span className="rounded-full bg-accent/10 px-2.5 py-1 text-xs font-medium text-accent ring-1 ring-inset ring-accent/20">
                                Libre
                              </span>
                            )}
                            {cochera.disponibleEnFecha === false && (
                              <span className="rounded-full bg-red-50 px-2.5 py-1 text-xs font-medium text-red-600 ring-1 ring-inset ring-red-200">
                                Ocupada
                              </span>
                            )}
                            {(cochera.disponibleEnFecha === null || cochera.disponibleEnFecha === undefined) && (
                              <span className="text-xs text-ink/40">—</span>
                            )}
                          </td>

                          <td className="px-6 py-4">
                            <div className="flex justify-end gap-2">
                              <button
                                type="button"
                                onClick={() => startEditing(cochera)}
                                className="rounded-lg bg-ink/5 px-3 py-2 text-xs font-semibold text-ink ring-1 ring-inset ring-ink/15 transition-colors hover:bg-ink/10"
                              >
                                Editar
                              </button>

                              <button
                                type="button"
                                onClick={() => deleteCochera(cochera)}
                                className="rounded-lg bg-red-50 px-3 py-2 text-xs font-semibold text-red-600 ring-1 ring-inset ring-red-200 transition-colors hover:bg-red-100"
                              >
                                Eliminar
                              </button>
                            </div>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}