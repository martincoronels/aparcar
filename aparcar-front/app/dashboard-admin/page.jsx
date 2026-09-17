import Link from "next/link";
import { requireAuth } from "@/utils/serverAuth";
import LogoutButton from "@/components/LogoutButton";
import PanelOperativo from "./PanelOperativo";

export default async function DashboardAdminPage() {
  // Validación de rol del lado del servidor: si no tenés el rol ADMIN,
  // requireAuth redirige antes de que se mande HTML al navegador.
  await requireAuth(["ADMIN"]);

  return (
    <div className="min-h-screen bg-white px-4 py-12 sm:px-6 lg:px-8">
      <div className="mx-auto max-w-5xl space-y-12">
        <div className="flex flex-wrap justify-end gap-3">
          <Link
            href="/dashboard-admin/cocheras"
            className="rounded-xl bg-white px-4 py-2 text-sm font-semibold text-[#002147] ring-1 ring-inset ring-[#002147]/20 transition-colors hover:bg-[#002147]/5"
          >
            Gestionar cocheras
          </Link>
          <Link
            href="/dashboard-admin/usuarios"
            className="rounded-xl bg-[#0cb7f2] px-4 py-2 text-sm font-semibold text-white transition-colors hover:bg-[#002147]"
          >
            Gestionar usuarios
          </Link>
          <LogoutButton />
        </div>

        <PanelOperativo />
      </div>
    </div>
  );
}
