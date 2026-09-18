"use client";

import { useEffect, useMemo, useState } from "react";
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
  "block w-full rounded-xl border-0 py-3 px-4 text-[#002147] bg-white ring-1 ring-inset ring-[#002147]/20 placeholder:text-[#002147]/40 focus:z-10 focus:ring-2 focus:ring-inset focus:ring-[#0cb7f2] sm:text-sm sm:leading-6 transition-all";

const labelClasses = "block text-sm font-medium text-[#002147]/70 mb-1";

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
    <div className="min-h-screen bg-white px-4 py-12 sm:px-6 lg:px-8">
      <div className="mx-auto max-w-7xl">
        <div className="mb-8 flex flex-wrap items-center justify-between gap-3">
          <Link
            href="/dashboard-admin"
            className="rounded-xl bg-white px-4 py-2 text-sm font-semibold text-[#002147] ring-1 ring-inset ring-[#002147]/20 transition-colors hover:bg-[#002147]/5"
          >
            ← Volver al panel
          </Link>
          <LogoutButton />
        </div>

        <div className="mb-8">
          <h1 className="text-3xl font-extrabold tracking-tight text-[#002147]">
            Gestión de cocheras
          </h1>

          <p className="mt-2 text-sm text-[#002147]/60">
            Administrá las cocheras del predio: número, sector, tipo y estado.
          </p>
        </div>

        <div className="grid grid-cols-1 gap-8 lg:grid-cols-3">
          <div className="lg:col-span-1">
            <div className="rounded-2xl bg-white p-6 shadow-xl shadow-[#002147]/10 ring-1 ring-[#002147]/15">
              <h2 className="text-xl font-bold text-[#002147]">Nueva cochera</h2>

              <p className="mt-1 mb-6 text-sm text-[#002147]/60">
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
                  className="flex w-full justify-center rounded-xl bg-[#0cb7f2] px-3 py-3 text-sm font-semibold text-white transition-all hover:bg-[#002147] disabled:cursor-not-allowed disabled:opacity-50"
                >
                  {isCreating ? "Creando..." : "Crear cochera"}
                </button>
              </form>
            </div>
          </div>

          <div className="lg:col-span-2">
            {editingCochera && (
              <div className="mb-8 rounded-2xl bg-white p-6 shadow-xl shadow-[#002147]/10 ring-1 ring-[#002147]/15">
                <div className="mb-6 flex items-start justify-between gap-4">
                  <div>
                    <h2 className="text-xl font-bold text-[#002147]">Editar cochera</h2>
                    <p className="mt-1 text-sm text-[#002147]/60">{editingCochera.numero}</p>
                  </div>

                  <button
                    type="button"
                    onClick={cancelEditing}
                    className="rounded-lg px-3 py-2 text-sm font-medium text-[#002147]/60 transition-colors hover:bg-[#002147]/5 hover:text-[#002147]"
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
                    className="rounded-xl bg-[#0cb7f2] px-5 py-3 text-sm font-semibold text-white transition-all hover:bg-[#002147] disabled:cursor-not-allowed disabled:opacity-50"
                  >
                    {isEditing ? "Guardando..." : "Guardar cambios"}
                  </button>
                </form>
              </div>
            )}

            <div className="overflow-hidden rounded-2xl bg-white shadow-xl shadow-[#002147]/10 ring-1 ring-[#002147]/15">
              <div className="border-b border-[#002147]/10 px-6 py-5">
                <h2 className="text-xl font-bold text-[#002147]">Cocheras</h2>
                <p className="mt-1 text-sm text-[#002147]/60">Cocheras registradas en el predio.</p>

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
                <div className="p-8 text-center text-sm text-[#002147]/60">
                  Cargando cocheras...
                </div>
              ) : cocherasFiltradas.length === 0 ? (
                <div className="p-8 text-center text-sm text-[#002147]/60">
                  No hay cocheras que coincidan con los filtros.
                </div>
              ) : (
                <div className="overflow-x-auto">
                  <table className="min-w-full divide-y divide-[#002147]/10">
                    <thead className="bg-white">
                      <tr>
                        <th className="px-6 py-3 text-left text-xs font-semibold uppercase tracking-wider text-[#002147]/50">
                          Número
                        </th>
                        <th className="px-6 py-3 text-left text-xs font-semibold uppercase tracking-wider text-[#002147]/50">
                          Sector
                        </th>
                        <th className="px-6 py-3 text-left text-xs font-semibold uppercase tracking-wider text-[#002147]/50">
                          Tipo
                        </th>
                        <th className="px-6 py-3 text-left text-xs font-semibold uppercase tracking-wider text-[#002147]/50">
                          Estado
                        </th>
                        <th className="px-6 py-3 text-right text-xs font-semibold uppercase tracking-wider text-[#002147]/50">
                          Acciones
                        </th>
                      </tr>
                    </thead>

                    <tbody className="divide-y divide-[#002147]/10">
                      {cocherasFiltradas.map((cochera) => (
                        <tr key={cochera.id} className="transition-colors hover:bg-[#0cb7f2]/5">
                          <td className="whitespace-nowrap px-6 py-4 font-medium text-[#002147]">
                            {cochera.numero}
                          </td>

                          <td className="whitespace-nowrap px-6 py-4 text-sm text-[#002147]/70">
                            {cochera.sector}
                          </td>

                          <td className="whitespace-nowrap px-6 py-4">
                            <span className="rounded-full bg-[#0cb7f2]/10 px-2.5 py-1 text-xs font-medium text-[#0cb7f2] ring-1 ring-inset ring-[#0cb7f2]/20">
                              {TIPO_LABELS[cochera.tipo]}
                            </span>
                          </td>

                          <td className="whitespace-nowrap px-6 py-4">
                            {cochera.estado === "HABILITADA" ? (
                              <span className="rounded-full bg-[#0cb7f2]/10 px-2.5 py-1 text-xs font-medium text-[#0cb7f2] ring-1 ring-inset ring-[#0cb7f2]/20">
                                Habilitada
                              </span>
                            ) : (
                              <span className="rounded-full bg-[#002147]/5 px-2.5 py-1 text-xs font-medium text-[#002147]/50 ring-1 ring-inset ring-[#002147]/10">
                                Deshabilitada
                              </span>
                            )}
                          </td>

                          <td className="px-6 py-4">
                            <div className="flex justify-end gap-2">
                              <button
                                type="button"
                                onClick={() => startEditing(cochera)}
                                className="rounded-lg bg-[#002147]/5 px-3 py-2 text-xs font-semibold text-[#002147] ring-1 ring-inset ring-[#002147]/15 transition-colors hover:bg-[#002147]/10"
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
