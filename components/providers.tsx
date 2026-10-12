"use client";

import React from "react";
import { VaultProvider } from "@/lib/crypto/vault-context";

export function Providers({ children }: { children: React.ReactNode }) {
  return <VaultProvider>{children}</VaultProvider>;
}
