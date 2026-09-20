import Link from "next/link";
import { requireAuth } from "@/utils/serverAuth";
import LogoutButton from "@/components/LogoutButton";
import ReservasContent from "@/components/ReservasContent";

export default async function ReservasAdminPage() {
  await requireAuth(["ADMIN"]);

  return (
    <div className="min-h-screen bg-bg px-4 py-12 sm:px-6 lg:px-8">
      <div className="mx-auto max-w-3xl">
        <div className="mb-8 flex flex-wrap items-center justify-between gap-3">
          <Link
            href="/dashboard-admin"
            className="rounded-xl bg-surface px-4 py-2 text-sm font-semibold text-ink ring-1 ring-inset ring-ink/20 transition-colors hover:bg-ink/5"
          >
            ← Volver al panel
          </Link>
          <LogoutButton />
        </div>

        <ReservasContent modo="admin" />
      </div>
    </div>
  );
}