import { requireAuth } from "@/utils/serverAuth";
import VisitantesContent from "./VisitantesContent";

export default async function DashboardAdminPage() {
  // Validación de rol del lado del servidor: si no tenés el rol ADMIN,
  // requireAuth redirige antes de que se mande HTML al navegador.
  await requireAuth(["ADMIN"]);

  return <VisitantesContent />;
}
