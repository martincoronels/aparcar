"use client";

import { useEffect, useState } from "react";
import { toast } from "sonner";
import api from "@/app/api";

function CarIcon({ className }) {
  return (
    <svg viewBox="0 0 24 24" fill="none" className={className}>
      <path
        d="M3 16h1.5m15 0H21m-16.5 0a1.5 1.5 0 103 0m-3 0a1.5 1.5 0 013 0m10.5 0a1.5 1.5 0 103 0m-3 0a1.5 1.5 0 013 0M4.5 16V11l1.8-4.2A2 2 0 018.15 5.5h7.7a2 2 0 011.85 1.3L19.5 11v5"
        stroke="currentColor"
        strokeWidth="1.5"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}

function MotoIcon({ className }) {
  return (
    <svg viewBox="0 0 24 24" fill="none" className={className}>
      <circle cx="5.5" cy="17" r="2.5" stroke="currentColor" strokeWidth="1.5" />
      <circle cx="18.5" cy="17" r="2.5" stroke="currentColor" strokeWidth="1.5" />
      <path
        d="M8 17h7l3-5h-3l-2-3H9l-1.5 3H5l1 2M13 9l2-2h3"
        stroke="currentColor"
        strokeWidth="1.5"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}

function TrailerIcon({ className }) {
  return (
    <svg viewBox="0 0 24 24" fill="none" className={className}>
      <rect x="3" y="7" width="13" height="8" rx="1" stroke="currentColor" strokeWidth="1.5" />
      <path d="M16 10h3.5L21 12.5V15h-5v-5z" stroke="currentColor" strokeWidth="1.5" strokeLinejoin="round" />
      <circle cx="7.5" cy="17" r="1.7" stroke="currentColor" strokeWidth="1.5" />
      <circle cx="17.5" cy="17" r="1.7" stroke="currentColor" strokeWidth="1.5" />
    </svg>
  );
}

function AccessibleIcon({ className }) {
  return (
    <svg viewBox="0 0 24 24" fill="none" className={className}>
      <circle cx="12" cy="5" r="1.6" fill="currentColor" />
      <path
        d="M11 8v4l-3 5m3-5h5m-5 0l1.5 3.5M14 12l2 6"
        stroke="currentColor"
        strokeWidth="1.5"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <path d="M9 17a4 4 0 108 0" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
    </svg>
  );
}

// Orden de columnas: motos a la izquierda, autos al medio, remolques a la
// derecha; accesibles se agrega al final si el predio tiene alguna.
const COLUMN_ORDER = [
  { tipo: "MOTO", label: "Motos", Icon: MotoIcon },
  { tipo: "AUTO", label: "Autos", Icon: CarIcon },
  { tipo: "CARGA", label: "Remolques", Icon: TrailerIcon },
  { tipo: "ACCESIBLE", label: "Accesibles", Icon: AccessibleIcon },
];

export default function EstadoCocherasGrid() {
  const [cocheras, setCocheras] = useState([]);
  const [ocupadasIds, setOcupadasIds] = useState(new Set());
  const [loading, setLoading] = useState(true);

  const cargar = async () => {
    try {
      setLoading(true);

      const hoy = new Date().toISOString().slice(0, 10);
      const [todasRes, disponiblesRes] = await Promise.all([
        api.get("/api/v1/cocheras"),
        api.get("/api/v1/cocheras/disponibles", { params: { fecha: hoy } }),
      ]);

      const disponiblesIds = new Set(disponiblesRes.data.map((c) => c.id));
      const ocupadas = new Set(
        todasRes.data
          .filter((c) => c.estado === "HABILITADA" && !disponiblesIds.has(c.id))
          .map((c) => c.id)
      );

      setCocheras(todasRes.data);
      setOcupadasIds(ocupadas);
    } catch (error) {
      toast.error(
        error.response?.data?.message || "No se pudo cargar el estado de las cocheras."
      );
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    cargar();
  }, []);

  const columnas = COLUMN_ORDER
    .map((columna) => ({ ...columna, cocheras: cocheras.filter((c) => c.tipo === columna.tipo) }))
    .filter((columna) => columna.cocheras.length > 0);

  return (
    <div className="rounded-2xl bg-white p-6 shadow-xl shadow-[#002147]/10 ring-1 ring-[#002147]/15">
      <div className="mb-6 flex flex-wrap items-center justify-between gap-4">
        <div>
          <h2 className="text-xl font-bold text-[#002147]">Estado de las cocheras</h2>
          <p className="mt-1 text-sm text-[#002147]/60">Ocupación de hoy, agrupada por tipo.</p>
        </div>

        <div className="flex items-center gap-4 text-xs text-[#002147]/60">
          <span className="flex items-center gap-1.5">
            <span className="h-3 w-3 rounded-sm border border-[#002147]/30 bg-white" /> Libre
          </span>
          <span className="flex items-center gap-1.5">
            <span className="h-3 w-3 rounded-sm bg-[#0cb7f2]" /> Ocupada
          </span>
          <span className="flex items-center gap-1.5">
            <span className="h-3 w-3 rounded-sm bg-[#002147]/20" /> Deshabilitada
          </span>
        </div>
      </div>

      {loading ? (
        <div className="p-8 text-center text-sm text-[#002147]/60">Cargando cocheras...</div>
      ) : columnas.length === 0 ? (
        <div className="p-8 text-center text-sm text-[#002147]/60">Todavía no hay cocheras cargadas.</div>
      ) : (
        <div className="grid grid-cols-1 gap-6 sm:grid-cols-3">
          {columnas.map(({ tipo, label, Icon, cocheras: cocherasTipo }) => {
            const ocupadasCount = cocherasTipo.filter((c) => ocupadasIds.has(c.id)).length;

            return (
              <div key={tipo} className="rounded-xl bg-[#002147]/5 p-4 ring-1 ring-[#002147]/10">
                <div className="mb-3 flex items-center justify-between">
                  <h3 className="text-sm font-semibold text-[#002147]">{label}</h3>
                  <span className="text-xs text-[#002147]/50">
                    {ocupadasCount}/{cocherasTipo.length} ocupadas
                  </span>
                </div>

                <div className="flex flex-wrap justify-center gap-2">
                  {cocherasTipo.map((cochera) => {
                    const deshabilitada = cochera.estado !== "HABILITADA";
                    const ocupada = ocupadasIds.has(cochera.id);

                    return (
                      <div
                        key={cochera.id}
                        title={`${cochera.numero} — ${
                          deshabilitada ? "Deshabilitada" : ocupada ? "Ocupada" : "Libre"
                        }`}
                        className={
                          "flex h-12 w-12 items-center justify-center rounded-md border transition-colors " +
                          (deshabilitada
                            ? "border-[#002147]/15 bg-[#002147]/10"
                            : ocupada
                            ? "border-[#0cb7f2] bg-[#0cb7f2]"
                            : "border-[#002147]/25 bg-white")
                        }
                      >
                        <Icon
                          className={
                            "h-6 w-6 " +
                            (deshabilitada
                              ? "text-[#002147]/30"
                              : ocupada
                              ? "text-white"
                              : "text-[#002147]/50")
                          }
                        />
                      </div>
                    );
                  })}
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
