"use client";

import { useEffect, useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { toast } from "sonner";

import api from "@/app/api";

const createUserSchema = z.object({
  nombre: z
    .string()
    .min(1, "El nombre es obligatorio")
    .max(100, "El nombre no puede superar los 100 caracteres"),

  email: z
    .string()
    .email("Ingresá un correo válido"),

  password: z
    .string()
    .min(8, "La contraseña debe tener al menos 8 caracteres")
    .max(100, "La contraseña no puede superar los 100 caracteres"),

  telefono: z.string().optional(),
});

const editUserSchema = z.object({
  nombre: z
    .string()
    .min(1, "El nombre es obligatorio")
    .max(100, "El nombre no puede superar los 100 caracteres"),

  telefono: z.string().optional(),

  authorities: z
    .array(z.enum(["USER", "ADMIN"]))
    .min(1, "El usuario debe tener al menos un rol"),
});

const inputClasses =
  "block w-full rounded-xl border-0 py-3 px-4 text-white bg-zinc-800 ring-1 ring-inset ring-zinc-700 placeholder:text-zinc-400 focus:z-10 focus:ring-2 focus:ring-inset focus:ring-emerald-500 sm:text-sm sm:leading-6 transition-all";

const labelClasses =
  "block text-sm font-medium text-zinc-300 mb-1";

export default function UserManagement() {
  const [users, setUsers] = useState([]);
  const [loadingUsers, setLoadingUsers] = useState(true);
  const [editingUser, setEditingUser] = useState(null);

  const {
    register: registerCreate,
    handleSubmit: handleCreateSubmit,
    reset: resetCreate,
    formState: {
      errors: createErrors,
      isSubmitting: isCreating,
    },
  } = useForm({
    resolver: zodResolver(createUserSchema),
    defaultValues: {
      nombre: "",
      email: "",
      password: "",
      telefono: "",
    },
  });

  const {
    register: registerEdit,
    handleSubmit: handleEditSubmit,
    reset: resetEdit,
    formState: {
      errors: editErrors,
      isSubmitting: isEditing,
    },
  } = useForm({
    resolver: zodResolver(editUserSchema),
    defaultValues: {
      nombre: "",
      telefono: "",
      authorities: [],
    },
  });

  const loadUsers = async () => {
    try {
      setLoadingUsers(true);

      const response = await api.get("/api/v1/usuarios");

      setUsers(response.data);
    } catch (error) {
      toast.error(
        error.response?.data?.message ||
          "No se pudieron cargar los usuarios."
      );
    } finally {
      setLoadingUsers(false);
    }
  };

  useEffect(() => {
    loadUsers();
  }, []);

  const onCreateUser = async (data) => {
    try {
      await api.post("/register", {
        nombre: data.nombre,
        email: data.email,
        password: data.password,
        telefono: data.telefono || null,
      });

      toast.success("Usuario creado correctamente");

      resetCreate();

      await loadUsers();
    } catch (error) {
      toast.error(
        error.response?.data?.message ||
          "No se pudo crear el usuario."
      );
    }
  };

  const startEditing = (user) => {
    setEditingUser(user);

    resetEdit({
      nombre: user.nombre,
      telefono: user.telefono || "",
      authorities: user.authorities || [],
    });
  };

  const cancelEditing = () => {
    setEditingUser(null);

    resetEdit({
      nombre: "",
      telefono: "",
      authorities: [],
    });
  };

  const onEditUser = async (data) => {
    if (!editingUser) {
      return;
    }

    try {
      await api.put(`/api/v1/usuarios/${editingUser.id}`, {
        nombre: data.nombre,
        telefono: data.telefono || null,
        authorities: data.authorities,
      });

      toast.success("Usuario actualizado correctamente");

      cancelEditing();

      await loadUsers();
    } catch (error) {
      toast.error(
        error.response?.data?.message ||
          "No se pudo actualizar el usuario."
      );
    }
  };

  const activateUser = async (user) => {
    try {
      await api.post("/users/activate", {
        email: user.email,
      });

      toast.success("Usuario activado correctamente");

      await loadUsers();
    } catch (error) {
      toast.error(
        error.response?.data?.message ||
          "No se pudo activar el usuario."
      );
    }
  };

  const deleteUser = async (user) => {
    const confirmed = window.confirm(
      `¿Seguro que querés eliminar a ${user.nombre}?`
    );

    if (!confirmed) {
      return;
    }

    try {
      await api.delete("/users", {
        data: {
          email: user.email,
        },
      });

      toast.success("Usuario eliminado correctamente");

      if (editingUser?.id === user.id) {
        cancelEditing();
      }

      await loadUsers();
    } catch (error) {
      toast.error(
        error.response?.data?.message ||
          "No se pudo eliminar el usuario."
      );
    }
  };

  return (
    <div className="min-h-screen bg-zinc-950 px-4 py-12 sm:px-6 lg:px-8">
      <div className="mx-auto max-w-7xl">
        <div className="mb-8">
          <h1 className="text-3xl font-extrabold tracking-tight text-white">
            Gestión de usuarios
          </h1>

          <p className="mt-2 text-sm text-zinc-400">
            Administrá los usuarios internos que tienen acceso a AparcAR.
          </p>
        </div>

        <div className="grid grid-cols-1 gap-8 lg:grid-cols-3">
          <div className="lg:col-span-1">
            <div className="rounded-2xl bg-zinc-900 p-6 shadow-xl shadow-black/50 ring-1 ring-zinc-800">
              <h2 className="text-xl font-bold text-white">
                Nuevo usuario
              </h2>

              <p className="mt-1 mb-6 text-sm text-zinc-400">
                Creá una nueva cuenta para personal interno.
              </p>

              <form
                className="space-y-4"
                onSubmit={handleCreateSubmit(onCreateUser)}
              >
                <div>
                  <label
                    htmlFor="nombre"
                    className={labelClasses}
                  >
                    Nombre
                  </label>

                  <input
                    id="nombre"
                    {...registerCreate("nombre")}
                    className={inputClasses}
                    placeholder="Nombre completo"
                  />

                  {createErrors.nombre && (
                    <p className="mt-1 text-sm text-red-500">
                      {createErrors.nombre.message}
                    </p>
                  )}
                </div>

                <div>
                  <label
                    htmlFor="email"
                    className={labelClasses}
                  >
                    Email
                  </label>

                  <input
                    id="email"
                    type="email"
                    {...registerCreate("email")}
                    className={inputClasses}
                    placeholder="usuario@aparcar.com"
                  />

                  {createErrors.email && (
                    <p className="mt-1 text-sm text-red-500">
                      {createErrors.email.message}
                    </p>
                  )}
                </div>

                <div>
                  <label
                    htmlFor="password"
                    className={labelClasses}
                  >
                    Contraseña
                  </label>

                  <input
                    id="password"
                    type="password"
                    {...registerCreate("password")}
                    className={inputClasses}
                    placeholder="Mínimo 8 caracteres"
                  />

                  {createErrors.password && (
                    <p className="mt-1 text-sm text-red-500">
                      {createErrors.password.message}
                    </p>
                  )}
                </div>

                <div>
                  <label
                    htmlFor="telefono"
                    className={labelClasses}
                  >
                    Teléfono
                  </label>

                  <input
                    id="telefono"
                    {...registerCreate("telefono")}
                    className={inputClasses}
                    placeholder="Opcional"
                  />
                </div>

                <button
                  type="submit"
                  disabled={isCreating}
                  className="flex w-full justify-center rounded-xl bg-emerald-600 px-3 py-3 text-sm font-semibold text-white transition-all hover:bg-emerald-500 disabled:cursor-not-allowed disabled:opacity-50"
                >
                  {isCreating
                    ? "Creando..."
                    : "Crear usuario"}
                </button>
              </form>
            </div>
          </div>

          <div className="lg:col-span-2">
            {editingUser && (
              <div className="mb-8 rounded-2xl bg-zinc-900 p-6 shadow-xl shadow-black/50 ring-1 ring-zinc-800">
                <div className="mb-6 flex items-start justify-between gap-4">
                  <div>
                    <h2 className="text-xl font-bold text-white">
                      Editar usuario
                    </h2>

                    <p className="mt-1 text-sm text-zinc-400">
                      {editingUser.email}
                    </p>
                  </div>

                  <button
                    type="button"
                    onClick={cancelEditing}
                    className="rounded-lg px-3 py-2 text-sm font-medium text-zinc-300 transition-colors hover:bg-zinc-800 hover:text-white"
                  >
                    Cancelar
                  </button>
                </div>

                <form
                  className="space-y-5"
                  onSubmit={handleEditSubmit(onEditUser)}
                >
                  <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                    <div>
                      <label
                        htmlFor="edit-nombre"
                        className={labelClasses}
                      >
                        Nombre
                      </label>

                      <input
                        id="edit-nombre"
                        {...registerEdit("nombre")}
                        className={inputClasses}
                      />

                      {editErrors.nombre && (
                        <p className="mt-1 text-sm text-red-500">
                          {editErrors.nombre.message}
                        </p>
                      )}
                    </div>

                    <div>
                      <label
                        htmlFor="edit-telefono"
                        className={labelClasses}
                      >
                        Teléfono
                      </label>

                      <input
                        id="edit-telefono"
                        {...registerEdit("telefono")}
                        className={inputClasses}
                        placeholder="Opcional"
                      />
                    </div>
                  </div>

                  <div>
                    <span className={labelClasses}>
                      Roles
                    </span>

                    <div className="mt-2 flex flex-wrap gap-4">
                      <label className="flex cursor-pointer items-center gap-2 text-sm text-zinc-300">
                        <input
                          type="checkbox"
                          value="USER"
                          {...registerEdit("authorities")}
                          className="h-4 w-4 rounded border-zinc-700 bg-zinc-800 accent-emerald-600"
                        />

                        USER
                      </label>

                      <label className="flex cursor-pointer items-center gap-2 text-sm text-zinc-300">
                        <input
                          type="checkbox"
                          value="ADMIN"
                          {...registerEdit("authorities")}
                          className="h-4 w-4 rounded border-zinc-700 bg-zinc-800 accent-emerald-600"
                        />

                        ADMIN
                      </label>
                    </div>

                    {editErrors.authorities && (
                      <p className="mt-1 text-sm text-red-500">
                        {editErrors.authorities.message}
                      </p>
                    )}
                  </div>

                  <button
                    type="submit"
                    disabled={isEditing}
                    className="rounded-xl bg-emerald-600 px-5 py-3 text-sm font-semibold text-white transition-all hover:bg-emerald-500 disabled:cursor-not-allowed disabled:opacity-50"
                  >
                    {isEditing
                      ? "Guardando..."
                      : "Guardar cambios"}
                  </button>
                </form>
              </div>
            )}

            <div className="overflow-hidden rounded-2xl bg-zinc-900 shadow-xl shadow-black/50 ring-1 ring-zinc-800">
              <div className="border-b border-zinc-800 px-6 py-5">
                <h2 className="text-xl font-bold text-white">
                  Usuarios
                </h2>

                <p className="mt-1 text-sm text-zinc-400">
                  Cuentas registradas en el sistema.
                </p>
              </div>

              {loadingUsers ? (
                <div className="p-8 text-center text-sm text-zinc-400">
                  Cargando usuarios...
                </div>
              ) : users.length === 0 ? (
                <div className="p-8 text-center text-sm text-zinc-400">
                  No hay usuarios registrados.
                </div>
              ) : (
                <div className="overflow-x-auto">
                  <table className="min-w-full divide-y divide-zinc-800">
                    <thead className="bg-zinc-900">
                      <tr>
                        <th className="px-6 py-3 text-left text-xs font-semibold uppercase tracking-wider text-zinc-400">
                          Usuario
                        </th>

                        <th className="px-6 py-3 text-left text-xs font-semibold uppercase tracking-wider text-zinc-400">
                          Teléfono
                        </th>

                        <th className="px-6 py-3 text-left text-xs font-semibold uppercase tracking-wider text-zinc-400">
                          Roles
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
                      {users.map((user) => (
                        <tr
                          key={user.id}
                          className="transition-colors hover:bg-zinc-800/40"
                        >
                          <td className="whitespace-nowrap px-6 py-4">
                            <p className="font-medium text-white">
                              {user.nombre}
                            </p>

                            <p className="text-sm text-zinc-400">
                              {user.email}
                            </p>
                          </td>

                          <td className="whitespace-nowrap px-6 py-4 text-sm text-zinc-300">
                            {user.telefono || "—"}
                          </td>

                          <td className="px-6 py-4">
                            <div className="flex flex-wrap gap-2">
                              {user.authorities?.map(
                                (authority) => (
                                  <span
                                    key={authority}
                                    className="rounded-full bg-emerald-500/10 px-2.5 py-1 text-xs font-medium text-emerald-400 ring-1 ring-inset ring-emerald-500/20"
                                  >
                                    {authority}
                                  </span>
                                )
                              )}
                            </div>
                          </td>

                          <td className="whitespace-nowrap px-6 py-4">
                            {user.isActive ? (
                              <span className="rounded-full bg-emerald-500/10 px-2.5 py-1 text-xs font-medium text-emerald-400 ring-1 ring-inset ring-emerald-500/20">
                                Activo
                              </span>
                            ) : (
                              <span className="rounded-full bg-zinc-800 px-2.5 py-1 text-xs font-medium text-zinc-400 ring-1 ring-inset ring-zinc-700">
                                Inactivo
                              </span>
                            )}
                          </td>

                          <td className="px-6 py-4">
                            <div className="flex justify-end gap-2">
                              {!user.isActive && (
                                <button
                                  type="button"
                                  onClick={() =>
                                    activateUser(user)
                                  }
                                  className="rounded-lg bg-emerald-600 px-3 py-2 text-xs font-semibold text-white transition-colors hover:bg-emerald-500"
                                >
                                  Activar
                                </button>
                              )}

                              <button
                                type="button"
                                onClick={() =>
                                  startEditing(user)
                                }
                                className="rounded-lg bg-zinc-800 px-3 py-2 text-xs font-semibold text-zinc-200 ring-1 ring-inset ring-zinc-700 transition-colors hover:bg-zinc-700"
                              >
                                Editar
                              </button>

                              <button
                                type="button"
                                onClick={() =>
                                  deleteUser(user)
                                }
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