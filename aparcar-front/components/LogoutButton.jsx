"use client";

import { useRouter } from "next/navigation";

import { useAuthStore } from "@/store/authStore";

export default function LogoutButton() {
  const logout = useAuthStore((state) => state.logout);
  const router = useRouter();

  const handleLogout = () => {
    logout();
    router.replace("/login");
  };

  return (
    <button
      type="button"
      onClick={handleLogout}
      className="rounded-xl bg-white px-4 py-2 text-sm font-semibold text-[#002147] ring-1 ring-inset ring-[#002147]/20 transition-colors hover:bg-[#002147]/5"
    >
      Cerrar sesión
    </button>
  );
}
