"use client";

import { useEffect, useMemo, useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { toast } from "sonner";

import api from "@/app/api";

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
  "block w-full rounded-xl border-0 py-3 px-4 text-white bg-zinc-800 ring-1 ring-inset ring-zinc-700 placeholder:text-zinc-400 focus:z-10 focus:ring-2 focus:ring-inset focus:ring-emerald-500 sm:text-sm sm:leading-6 transition-all";

const labelClasses = "block text-sm font-medium text-zinc-300 mb-1";

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

  const loadCocheras = async () => {
    try {
      setLoadingCocheras(true);

      const response = await api.get("/api/v1/cocheras");

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
    loadCocheras();
  }, []);

  const onCreateCochera = async (data) => {
    try {
      await api.post("/api/v1/cocheras", data);

      toast.success("Cochera creada correctamente");

      resetCreate();

      await loadCocheras();
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

      await loadCocheras();
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

      await loadCocheras();
    } catch (error) {
      toast.error(
        error.response?.data?.message || "No se pudo eliminar la cochera."
      );
    }
  };

  const cocherasFiltradas = useMemo(() => {
    return cocheras.filter((cochera) => {
      const coincideSector =
        filtroSector.trim() === "" ||
        cochera.sector.toLowerCase().includes(filtroSector.trim().toLowerCase());

      const coincideTipo = filtroTipo === "TODOS" || cochera.tipo === filtroTipo;

      const coincideEstado =
        filtroEstado === "TODOS" || cochera.estado === filtroEstado;

      return coincideSector && coincideTipo && coincideEstado;
    });
  }, [cocheras, filtroSector, filtroTipo, filtroEstado]);

  return (
    <div className="min-h-screen bg-zinc-950 px-4 py-12 sm:px-6 lg:px-8">
      <div className="mx-auto max-w-7xl">
        <div className="mb-8">
          <h1 className="text-3xl font-extrabold tracking-tight text-white">
            Gestión de cocheras
          </h1>

          <p className="mt-2 text-sm text-zinc-400">
            Administrá las cocheras del predio: número, sector, tipo y estado.
          </p>
        </div>

        <div className="grid grid-cols-1 gap-8 lg:grid-cols-3">
          <div className="lg:col-span-1">
            <div className="rounded-2xl bg-zinc-900 p-6 shadow-xl shadow-black/50 ring-1 ring-zinc-800">
              <h2 className="text-xl font-bold text-white">Nueva cochera</h2>

              <p className="mt-1 mb-6 text-sm text-zinc-400">
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
                  className="flex w-full justify-center rounded-xl bg-emerald-600 px-3 py-3 text-sm font-semibold text-white transition-all hover:bg-emerald-500 disabled:cursor-not-allowed disabled:opacity-50"
                >
                  {isCreating ? "Creando..." : "Crear cochera"}
                </button>
              </form>
            </div>
          </div>

          <div className="lg:col-span-2">
            {editingCochera && (
              <div className="mb-8 rounded-2xl bg-zinc-900 p-6 shadow-xl shadow-black/50 ring-1 ring-zinc-800">
                <div className="mb-6 flex items-start justify-between gap-4">
                  <div>
                    <h2 className="text-xl font-bold text-white">Editar cochera</h2>
                    <p className="mt-1 text-sm text-zinc-400">{editingCochera.numero}</p>
                  </div>

                  <button
                    type="button"
                    onClick={cancelEditing}
                    className="rounded-lg px-3 py-2 text-sm font-medium text-zinc-300 transition-colors hover:bg-zinc-800 hover:text-white"
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
                    className="rounded-xl bg-emerald-600 px-5 py-3 text-sm font-semibold text-white transition-all hover:bg-emerald-500 disabled:cursor-not-allowed disabled:opacity-50"
                  >
                    {isEditing ? "Guardando..." : "Guardar cambios"}
                  </button>
                </form>
              </div>
            )}

            <div className="overflow-hidden rounded-2xl bg-zinc-900 shadow-xl shadow-black/50 ring-1 ring-zinc-800">
              <div className="border-b border-zinc-800 px-6 py-5">
                <h2 className="text-xl font-bold text-white">Cocheras</h2>
                <p className="mt-1 text-sm text-zinc-400">Cocheras registradas en el predio.</p>

                <div className="mt-4 grid grid-cols-1 gap-3 sm:grid-cols-3">
                  <input
                    value={filtroSector}
                    onChange={(e) => setFiltroSector(e.target.value)}
                    className={inputClasses}
                    placeholder="Filtrar por sector..."
                  />

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
                </div>
              </div>

              {loadingCocheras ? (
                <div className="p-8 text-center text-sm text-zinc-400">
                  Cargando cocheras...
                </div>
              ) : cocherasFiltradas.length === 0 ? (
                <div className="p-8 text-center text-sm text-zinc-400">
                  No hay cocheras que coincidan con los filtros.
                </div>
              ) : (
                <div className="overflow-x-auto">
                  <table className="min-w-full divide-y divide-zinc-800">
                    <thead className="bg-zinc-900">
                      <tr>
                        <th className="px-6 py-3 text-left text-xs font-semibold uppercase tracking-wider text-zinc-400">
                          Número
                        </th>
                        <th className="px-6 py-3 text-left text-xs font-semibold uppercase tracking-wider text-zinc-400">
                          Sector
                        </th>
                        <th className="px-6 py-3 text-left text-xs font-semibold uppercase tracking-wider text-zinc-400">
                          Tipo
                        </th>
                        <th className="px-6 py-3 text-left text-xs font-semibold uppercase tracking-wider text-zinc-400">
                          Estado
                        </th>
                        <th className="px-6 py-3 text-right text-xs font-semibold uppercase tracking-wider text-zinc-400">
                          Acciones
                        </th>
                      </tr>
                    </thead>

                    <tbody className="divide-y divide-zinc-800">
                      {cocherasFiltradas.map((cochera) => (
                        <tr key={cochera.id} className="transition-colors hover:bg-zinc-800/40">
                          <td className="whitespace-nowrap px-6 py-4 font-medium text-white">
                            {cochera.numero}
                          </td>

                          <td className="whitespace-nowrap px-6 py-4 text-sm text-zinc-300">
                            {cochera.sector}
                          </td>

                          <td className="whitespace-nowrap px-6 py-4">
                            <span className="rounded-full bg-emerald-500/10 px-2.5 py-1 text-xs font-medium text-emerald-400 ring-1 ring-inset ring-emerald-500/20">
                              {TIPO_LABELS[cochera.tipo]}
                            </span>
                          </td>

                          <td className="whitespace-nowrap px-6 py-4">
                            {cochera.estado === "HABILITADA" ? (
                              <span className="rounded-full bg-emerald-500/10 px-2.5 py-1 text-xs font-medium text-emerald-400 ring-1 ring-inset ring-emerald-500/20">
                                Habilitada
                              </span>
                            ) : (
                              <span className="rounded-full bg-zinc-800 px-2.5 py-1 text-xs font-medium text-zinc-400 ring-1 ring-inset ring-zinc-700">
                                Deshabilitada
                              </span>
                            )}
                          </td>

                          <td className="px-6 py-4">
                            <div className="flex justify-end gap-2">
                              <button
                                type="button"
                                onClick={() => startEditing(cochera)}
                                className="rounded-lg bg-zinc-800 px-3 py-2 text-xs font-semibold text-zinc-200 ring-1 ring-inset ring-zinc-700 transition-colors hover:bg-zinc-700"
                              >
                                Editar
                              </button>

                              <button
                                type="button"
                                onClick={() => deleteCochera(cochera)}
                                className="rounded-lg bg-red-950/50 px-3 py-2 text-xs font-semibold text-red-400 ring-1 ring-inset ring-red-900 transition-colors hover:bg-red-950"
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