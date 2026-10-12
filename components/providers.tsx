"use client";

import React from "react";
import { VaultProvider } from "@/lib/crypto/vault-context";
import { ThemeProvider } from "./theme-provider";

export function Providers({ children }: { children: React.ReactNode }) {
  return (
    <ThemeProvider>
      <VaultProvider>{children}</VaultProvider>
    </ThemeProvider>
  );
}
