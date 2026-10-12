"use client";

import React, { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Shield, Eye, EyeOff } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card } from "@/components/ui/card";

export default function LoginPage() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setIsLoading(true);

    try {
      const res = await fetch("/api/auth/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, password }),
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || "Authentication failed");
      }

      // Check if vault needs unlocking
      if (data.user?.hasVaultKey) {
        router.push("/unlock");
      } else {
        router.push("/dashboard");
      }
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : "Authentication failed";
      setError(msg);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#080c14] cyber-grid-bg flex items-center justify-center p-4">
      <Card className="max-w-md w-full p-8 space-y-6 border-slate-800 bg-[#0a0f1d]/90 shadow-2xl relative">
        <div className="text-center space-y-2">
          <div className="w-11 h-11 rounded-xl bg-gradient-to-br from-sky-500/20 to-blue-600/10 border border-sky-400/30 text-sky-400 mx-auto flex items-center justify-center shadow-[0_0_15px_rgba(56,189,248,0.2)]">
            <Shield className="w-6 h-6" />
          </div>
          <h1 className="text-lg font-bold text-white tracking-tight">Sign In to CloudVault</h1>
          <p className="text-xs text-slate-400">
            Authenticate your account with the local server
          </p>
        </div>

        {error && (
          <div className="p-3.5 bg-rose-500/10 border border-rose-500/30 rounded-xl text-xs text-rose-400 font-medium">
            {error}
          </div>
        )}

        <form onSubmit={handleLogin} className="space-y-4">
          <Input
            label="Account Email"
            type="email"
            required
            placeholder="developer@local"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
          />

          <div className="space-y-1">
            <div className="flex items-center justify-between">
              <label className="block text-xs font-medium text-slate-300">
                Account Password
              </label>
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="text-[11px] text-slate-400 hover:text-sky-400 transition-colors flex items-center gap-1 font-mono"
              >
                {showPassword ? <EyeOff className="w-3 h-3" /> : <Eye className="w-3 h-3" />}
                {showPassword ? "Hide" : "Show"}
              </button>
            </div>
            <Input
              type={showPassword ? "text" : "password"}
              required
              placeholder="Enter your account password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
            />
          </div>

          <Button
            type="submit"
            variant="primary"
            size="lg"
            className="w-full mt-2"
            isLoading={isLoading}
          >
            Authenticate Account
          </Button>
        </form>

        <div className="text-center text-xs text-slate-400 pt-2 border-t border-slate-800">
          Don&apos;t have an account?{" "}
          <Link href="/register" className="text-sky-400 hover:text-sky-300 font-semibold transition-colors">
            Register Vault
          </Link>
        </div>
      </Card>
    </div>
  );
}
