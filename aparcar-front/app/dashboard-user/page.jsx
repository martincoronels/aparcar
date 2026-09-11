import { requireAuth } from "@/utils/serverAuth";
import ReservasContent from "./ReservasContent";

export default async function DashboardUserPage() {
  // Validación de rol del lado del servidor: si no tenés el rol USER,
  // requireAuth redirige antes de que se mande HTML al navegador.
  await requireAuth(["USER"]);

  return <ReservasContent />;
}
