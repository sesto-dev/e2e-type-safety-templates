// hooks/use-logout.ts
"use client";

import { useState, useCallback } from "react";
import { useRouter } from "next/navigation";
import { authControllerLogout } from "~/client";


export function useLogout() {
  const [loading, setLoading] = useState(false);
  const router = useRouter();

  const logout = useCallback(async () => {
    if (loading) return; // Prevent duplicate calls
    setLoading(true);

    try {
      const response = await authControllerLogout();
      if (response.error)
        console.error("Unexpected logout status:", response.error);
    } catch (error) {
      console.error("Error during logout:", error);
    } finally {
      router.push("/login");
      setLoading(false);
    }
  }, [loading, router]);

  return { logout, loading };
}
