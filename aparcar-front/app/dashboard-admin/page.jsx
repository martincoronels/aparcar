import Link from "next/link";
import { requireAuth } from "@/utils/serverAuth";
import LogoutButton from "@/components/LogoutButton";
import PanelOperativo from "./PanelOperativo";

export default async function DashboardAdminPage() {
  await requireAuth(["ADMIN"]);

  return (
    <div className="min-h-screen bg-bg px-4 py-12 sm:px-6 lg:px-8">
      <div className="mx-auto max-w-5xl space-y-12">
        <div className="flex flex-wrap justify-end gap-3">
          <Link
            href="/dashboard-admin/cocheras"
            className="rounded-xl bg-surface px-4 py-2 text-sm font-semibold text-ink ring-1 ring-inset ring-ink/20 transition-colors hover:bg-ink/5"
          >
            Gestionar cocheras
          </Link>
          <Link
            href="/dashboard-admin/reservas"
            className="rounded-xl bg-surface px-4 py-2 text-sm font-semibold text-ink ring-1 ring-inset ring-ink/20 transition-colors hover:bg-ink/5"
          >
            Ver reservas
          </Link>
          <Link
            href="/dashboard-admin/usuarios"
            className="rounded-xl bg-accent px-4 py-2 text-sm font-semibold text-white transition-colors hover:bg-brand"
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