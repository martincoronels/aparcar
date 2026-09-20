import { requireAuth } from "@/utils/serverAuth";
import LogoutButton from "@/components/LogoutButton";
import PanelVisitante from "./PanelVisitante";

export default async function DashboardUserPage() {
  await requireAuth(["USER"]);

  return (
    <div className="min-h-screen bg-bg px-4 py-12 sm:px-6 lg:px-8">
      <div className="mx-auto max-w-3xl space-y-12">
        <div className="flex justify-end">
          <LogoutButton />
        </div>
        <PanelVisitante />
      </div>
    </div>
  );
}