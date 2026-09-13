import { requireAuth } from "@/utils/serverAuth";
import MiPerfilContent from "./MiPerfilContent";
import ReservasContent from "./ReservasContent";

export default async function DashboardUserPage() {
  // Validación de rol del lado del servidor: si no tenés el rol USER,
  // requireAuth redirige antes de que se mande HTML al navegador.
  await requireAuth(["USER"]);

  return (
    <div className="min-h-screen bg-white px-4 py-12 sm:px-6 lg:px-8">
      <div className="mx-auto max-w-3xl space-y-12">
        <MiPerfilContent />
        <ReservasContent />
      </div>
    </div>
  );
}
