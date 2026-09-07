"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { useAuthStore } from "../store/authStore";

export default function ProtectedRoute({ children, allowedRoles = [] }) {
  const { isAuthenticated, user, checkAuth, isHydrated } = useAuthStore();
  const router = useRouter();
  const [isReady, setIsReady] = useState(false);

  useEffect(() => {
    checkAuth();
  }, [checkAuth]);

  useEffect(() => {
    if (!isHydrated) return;

    if (!isAuthenticated) {
      router.push("/login");
    } else if (allowedRoles.length > 0 && user && !allowedRoles.some((r) => user.roles?.includes(r))) {
      // Si hay reglas de roles y el usuario no los cumple, enviarlo a Unauthorized
      router.push("/unauthorized");
    } else {
      setIsReady(true);
    }
  }, [isAuthenticated, user, allowedRoles, router, isHydrated]);

  if (!isHydrated || !isReady) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-zinc-950">
        <div className="h-8 w-8 animate-spin rounded-full border-4 border-emerald-500 border-t-transparent"></div>
      </div>
    );
  }

  return <>{children}</>;}
