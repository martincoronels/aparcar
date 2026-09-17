"use client";

import { useState } from "react";

import ReservasContent from "@/components/ReservasContent";
import EstadoCocherasGrid from "./EstadoCocherasGrid";
import VisitantesContent from "./VisitantesContent";

/**
 * Agrupa las tres secciones operativas del dashboard ADMIN.
 *
 * Existe como componente de cliente aparte porque `page.jsx` es un Server
 * Component (hace la validación de rol con requireAuth) y por lo tanto no puede
 * tener estado: sin este intermediario no habría dónde guardar el contador que
 * le avisa a la cuadrícula que se volvió a reservar.
 */
export default function PanelOperativo() {
  const [ocupacionKey, setOcupacionKey] = useState(0);

  return (
    <>
      <EstadoCocherasGrid refreshKey={ocupacionKey} />
      <VisitantesContent />
      <ReservasContent onReservaCreada={() => setOcupacionKey((k) => k + 1)} />
    </>
  );
}
