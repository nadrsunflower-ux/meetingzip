"use client";

import type { ReactNode } from "react";
import { AuthProvider } from "@/lib/useAuth";
import { AppShell } from "./AppShell";

export function Providers({ children }: { children: ReactNode }) {
  return (
    <AuthProvider>
      <AppShell>{children}</AppShell>
    </AuthProvider>
  );
}
