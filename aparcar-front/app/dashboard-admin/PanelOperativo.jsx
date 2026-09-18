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
 * coordina el refresco entre secciones hermanas.
 *
 * El alta de un visitante ahora también crea una reserva, así que tiene que
 * refrescar tanto la cuadrícula de ocupación como el listado de reservas.
 */
export default function PanelOperativo() {
  const [ocupacionKey, setOcupacionKey] = useState(0);
  const [reservasKey, setReservasKey] = useState(0);

  const refrescarTodo = () => {
    setOcupacionKey((k) => k + 1);
    setReservasKey((k) => k + 1);
  };

  return (
    <>
      <EstadoCocherasGrid refreshKey={ocupacionKey} />
      <VisitantesContent onAltaCreada={refrescarTodo} />
      <ReservasContent
        modo="admin"
        refreshKey={reservasKey}
        onReservaCreada={() => setOcupacionKey((k) => k + 1)}
      />
    </>
  );
}
