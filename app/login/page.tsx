"use client";

import React, { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Shield, Eye, EyeOff, Sun, Moon } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card } from "@/components/ui/card";
import { useTheme } from "@/components/theme-provider";

export default function LoginPage() {
  const router = useRouter();
  const { resolvedTheme, setTheme } = useTheme();
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
    <div className="min-h-screen bg-background flex flex-col justify-between p-4 selection:bg-brand-500 selection:text-white">
      {/* Top Header */}
      <div className="max-w-7xl w-full mx-auto flex items-center justify-between p-2">
        <Link href="/" className="flex items-center gap-2.5">
          <div className="w-8 h-8 rounded-lg bg-brand-500/10 border border-brand-500/20 flex items-center justify-center text-brand-500">
            <Shield className="w-4 h-4" />
          </div>
          <span className="font-bold text-base tracking-tight text-foreground">
            CLOUD<span className="text-brand-500">VAULT</span>
          </span>
        </Link>
        <button
          onClick={() => setTheme(resolvedTheme === "dark" ? "light" : "dark")}
          className="p-2 rounded-lg text-slate-500 hover:text-foreground hover:bg-surface-raised transition-colors"
          title="Toggle theme"
        >
          {resolvedTheme === "dark" ? <Sun className="w-4 h-4" /> : <Moon className="w-4 h-4" />}
        </button>
      </div>

      {/* Main Card */}
      <div className="flex items-center justify-center py-8">
        <Card className="max-w-md w-full p-8 space-y-6 shadow-xl">
          <div className="text-center space-y-1.5">
            <div className="w-10 h-10 rounded-xl bg-brand-500/10 border border-brand-500/20 text-brand-500 mx-auto flex items-center justify-center">
              <Shield className="w-5 h-5" />
            </div>
            <h1 className="text-xl font-bold text-foreground tracking-tight">Sign In to CloudVault</h1>
            <p className="text-xs text-slate-500 dark:text-slate-400">
              Access your zero-knowledge encrypted workspace
            </p>
          </div>

          {error && (
            <div className="p-3 bg-rose-500/10 border border-rose-500/20 rounded-lg text-xs text-rose-600 dark:text-rose-400">
              {error}
            </div>
          )}

          <form onSubmit={handleLogin} className="space-y-4">
            <Input
              label="Account Email"
              type="email"
              required
              autoFocus
              placeholder="name@example.com"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
            />

            <div className="space-y-1">
              <div className="flex items-center justify-between">
                <label className="block text-xs font-medium text-slate-700 dark:text-slate-300">
                  Account Password
                </label>
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="text-[11px] text-slate-500 hover:text-foreground flex items-center gap-1"
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
              Sign In
            </Button>
          </form>

          <div className="text-center text-xs text-slate-500 dark:text-slate-400 pt-3 border-t border-surface-border">
            Don&apos;t have an account?{" "}
            <Link href="/register" className="text-brand-500 hover:underline font-semibold">
              Create an account
            </Link>
          </div>
        </Card>
      </div>

      {/* Footer */}
      <div className="text-center text-xs text-slate-400 py-3">
        Zero-Knowledge Encrypted • AES-256-GCM
      </div>
    </div>
  );
}
