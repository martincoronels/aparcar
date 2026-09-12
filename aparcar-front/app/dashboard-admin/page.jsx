import { requireAuth } from "@/utils/serverAuth";
import EstadoCocherasGrid from "./EstadoCocherasGrid";
import VisitantesContent from "./VisitantesContent";

export default async function DashboardAdminPage() {
  // Validación de rol del lado del servidor: si no tenés el rol ADMIN,
  // requireAuth redirige antes de que se mande HTML al navegador.
  await requireAuth(["ADMIN"]);

  return (
    <div className="min-h-screen bg-white px-4 py-12 sm:px-6 lg:px-8">
      <div className="mx-auto max-w-5xl space-y-12">
        <EstadoCocherasGrid />
        <VisitantesContent />
      </div>
    </div>
  );
}
