import React from "react";
import Link from "next/link";
import {
  Shield,
  Lock,
  Key,
  HardDrive,
  Cpu,
  RefreshCw,
  FileCheck,
  CheckCircle2,
  Terminal,
  ArrowRight,
  Database,
  EyeOff,
  ServerOff,
  Sparkles,
  Zap,
} from "lucide-react";
import { Badge } from "@/components/ui/badge";

export default function LandingPage() {
  return (
    <div className="min-h-screen text-slate-100 flex flex-col selection:bg-brand-500 selection:text-white">
      {/* Top Header */}
      <header className="border-b border-slate-800/80 bg-slate-950/70 backdrop-blur-xl sticky top-0 z-50 px-6 py-4">
        <div className="max-w-7xl mx-auto flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-brand-500/20 to-sky-600/10 border border-brand-500/30 flex items-center justify-center text-brand-400 shadow-[0_0_15px_rgba(56,189,248,0.25)]">
              <Shield className="w-6 h-6" />
            </div>
            <div>
              <span className="font-extrabold text-lg tracking-tight text-white">
                CLOUD<span className="text-brand-400">VAULT</span>
              </span>
              <span className="ml-2 text-[10px] font-mono px-2 py-0.5 rounded-full bg-brand-500/10 text-brand-400 border border-brand-500/20 hidden sm:inline-block">
                LOCAL-FIRST ZERO-KNOWLEDGE
              </span>
            </div>
          </div>

          <div className="flex items-center gap-3">
            <Link
              href="/login"
              className="text-xs font-semibold text-slate-300 hover:text-white transition-colors px-4 py-2 rounded-xl hover:bg-slate-800/80"
            >
              Sign In
            </Link>
            <Link
              href="/register"
              className="text-xs font-semibold bg-gradient-to-r from-brand-500 to-sky-600 hover:from-brand-400 hover:to-sky-500 text-white px-5 py-2.5 rounded-xl shadow-lg shadow-brand-500/25 border border-brand-400/30 transition-all active:scale-95"
            >
              Initialize Vault
            </Link>
          </div>
        </div>
      </header>

      {/* Hero Section */}
      <section className="pt-24 pb-20 px-6 relative overflow-hidden">
        <div className="max-w-5xl mx-auto text-center space-y-8 relative z-10">
          <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-slate-900/90 border border-brand-500/30 text-brand-400 text-xs font-mono tracking-wide shadow-sm">
            <Lock className="w-3.5 h-3.5" /> TRUE ZERO-KNOWLEDGE ARCHITECTURE • ₹0 CLOUD COSTS
          </div>

          <h1 className="text-4xl sm:text-6xl lg:text-7xl font-extrabold text-white tracking-tight leading-[1.1]">
            Your Files. Your Keys. <br />
            <span className="text-transparent bg-clip-text bg-gradient-to-r from-brand-400 via-sky-300 to-blue-500">
              Absolute Privacy.
            </span>
          </h1>

          <p className="max-w-2xl mx-auto text-base sm:text-lg text-slate-400 leading-relaxed">
            CloudVault encrypts your files inside your browser using{" "}
            <strong className="text-slate-200">AES-256-GCM</strong> and{" "}
            <strong className="text-slate-200">Argon2id</strong> before bytes ever leave your device.
            The local server only manages opaque, impenetrable ciphertext.
          </p>

          <div className="flex flex-col sm:flex-row items-center justify-center gap-4 pt-4">
            <Link
              href="/register"
              className="w-full sm:w-auto inline-flex items-center justify-center gap-2 px-8 py-3.5 rounded-xl bg-gradient-to-r from-brand-500 to-sky-600 hover:from-brand-400 hover:to-sky-500 text-white font-semibold text-sm shadow-xl shadow-brand-500/25 transition-all border border-brand-400/30 active:scale-95"
            >
              Initialize Local Vault <ArrowRight className="w-4 h-4" />
            </Link>
            <Link
              href="/login"
              className="w-full sm:w-auto inline-flex items-center justify-center gap-2 px-8 py-3.5 rounded-xl glass-panel hover:bg-slate-800 text-slate-200 border border-slate-700/80 font-semibold text-sm transition-all"
            >
              Unlock Existing Vault
            </Link>
          </div>

          {/* Cryptographic Badges */}
          <div className="flex flex-wrap items-center justify-center gap-4 pt-8 text-xs font-mono text-slate-400">
            <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-slate-900/60 border border-slate-800">
              <Zap className="w-3.5 h-3.5 text-brand-400" /> AES-256-GCM Payload Cipher
            </div>
            <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-slate-900/60 border border-slate-800">
              <Cpu className="w-3.5 h-3.5 text-emerald-400" /> Argon2id Local Key Derivation
            </div>
            <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-slate-900/60 border border-slate-800">
              <ServerOff className="w-3.5 h-3.5 text-sky-400" /> Zero Plaintext Storage
            </div>
          </div>
        </div>
      </section>

      {/* Comparison Matrix: Traditional Cloud vs CloudVault */}
      <section className="py-20 px-6 border-y border-slate-800/80 bg-slate-950/40 relative">
        <div className="max-w-6xl mx-auto space-y-12">
          <div className="text-center space-y-3">
            <h2 className="text-2xl sm:text-3xl font-extrabold text-white tracking-tight">
              Why Zero-Knowledge Matters
            </h2>
            <p className="text-sm text-slate-400 max-w-xl mx-auto">
              Compare conventional corporate cloud storage with CloudVault&apos;s local-first zero-knowledge security model.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            {/* Traditional Cloud */}
            <div className="glass-panel rounded-2xl p-6 space-y-4 border-rose-500/20 relative">
              <div className="flex items-center justify-between pb-3 border-b border-slate-800">
                <span className="font-bold text-slate-200 flex items-center gap-2">
                  <EyeOff className="w-4 h-4 text-rose-400" /> Traditional Cloud Storage
                </span>
                <span className="text-[11px] font-mono uppercase px-2 py-0.5 rounded bg-rose-500/10 text-rose-400 border border-rose-500/20">
                  Third-Party Controlled
                </span>
              </div>
              <ul className="space-y-3 text-xs text-slate-400 font-mono">
                <li className="flex items-start gap-2.5">
                  <span className="text-rose-400 font-bold">✕</span>
                  <span>Server holds encryption keys and can decrypt anytime</span>
                </li>
                <li className="flex items-start gap-2.5">
                  <span className="text-rose-400 font-bold">✕</span>
                  <span>Files, thumbnails, and filenames indexed in plaintext</span>
                </li>
                <li className="flex items-start gap-2.5">
                  <span className="text-rose-400 font-bold">✕</span>
                  <span>Subject to subpoena, vendor scraping, and server-side data leaks</span>
                </li>
                <li className="flex items-start gap-2.5">
                  <span className="text-rose-400 font-bold">✕</span>
                  <span>Recurring monthly subscription fees</span>
                </li>
              </ul>
            </div>

            {/* CloudVault */}
            <div className="glass-panel-elevated rounded-2xl p-6 space-y-4 border-brand-500/30 glow-border-cyan relative">
              <div className="flex items-center justify-between pb-3 border-b border-slate-800">
                <span className="font-bold text-white flex items-center gap-2">
                  <Shield className="w-4 h-4 text-brand-400" /> CloudVault Zero-Knowledge
                </span>
                <span className="text-[11px] font-mono uppercase px-2.5 py-0.5 rounded-full bg-brand-500/20 text-brand-300 border border-brand-500/40 font-semibold">
                  100% User Owned
                </span>
              </div>
              <ul className="space-y-3 text-xs text-slate-300 font-mono">
                <li className="flex items-start gap-2.5">
                  <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0 mt-0.5" />
                  <span>Files encrypted in browser before dispatching network requests</span>
                </li>
                <li className="flex items-start gap-2.5">
                  <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0 mt-0.5" />
                  <span>File names, folders, and MIME types stored as ciphertext</span>
                </li>
                <li className="flex items-start gap-2.5">
                  <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0 mt-0.5" />
                  <span>Server possesses zero keys; decryption mathematically impossible for server</span>
                </li>
                <li className="flex items-start gap-2.5">
                  <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0 mt-0.5" />
                  <span>Runs entirely on your machine via Docker with ₹0 cloud expenses</span>
                </li>
              </ul>
            </div>
          </div>
        </div>
      </section>

      {/* Trust Boundaries & Cryptographic Pipeline */}
      <section className="py-20 px-6">
        <div className="max-w-6xl mx-auto space-y-12">
          <div className="text-center space-y-3">
            <h2 className="text-2xl sm:text-3xl font-extrabold text-white tracking-tight">
              Cryptographic Execution Pipeline
            </h2>
            <p className="text-sm text-slate-400 max-w-xl mx-auto">
              How CloudVault enforces true zero-knowledge client-side encryption.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            {/* Browser Sandbox */}
            <div className="glass-panel-elevated rounded-2xl p-6 space-y-5 shadow-2xl relative overflow-hidden border-brand-500/30">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-brand-500/10 border border-brand-500/30 flex items-center justify-center text-brand-400 shadow-sm">
                  <Cpu className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="font-bold text-white text-base">Client Browser Sandbox</h3>
                  <p className="text-xs text-slate-400 font-mono">Web Crypto API • In-Memory Memory Isolation</p>
                </div>
              </div>

              <div className="space-y-2.5 text-xs text-slate-300 font-mono">
                <div className="p-3 bg-slate-900/90 rounded-xl border border-slate-800 flex items-start gap-2.5">
                  <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0 mt-0.5" />
                  <span>256-bit Master Key generated via cryptographically secure CSPRNG</span>
                </div>
                <div className="p-3 bg-slate-900/90 rounded-xl border border-slate-800 flex items-start gap-2.5">
                  <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0 mt-0.5" />
                  <span>KEK derived via browser Argon2id (m=64MB, t=3, p=4)</span>
                </div>
                <div className="p-3 bg-slate-900/90 rounded-xl border border-slate-800 flex items-start gap-2.5">
                  <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0 mt-0.5" />
                  <span>Fresh 256-bit AES-GCM key and 96-bit nonce generated per file</span>
                </div>
                <div className="p-3 bg-slate-900/90 rounded-xl border border-slate-800 flex items-start gap-2.5">
                  <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0 mt-0.5" />
                  <span>File metadata (name, mime, size) encrypted into client envelope</span>
                </div>
              </div>
            </div>

            {/* Local Backend Server */}
            <div className="glass-panel rounded-2xl p-6 space-y-5 shadow-2xl relative overflow-hidden border-slate-800">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-slate-800/80 border border-slate-700/80 flex items-center justify-center text-slate-300">
                  <HardDrive className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="font-bold text-white text-base">Local Host Infrastructure</h3>
                  <p className="text-xs text-slate-400 font-mono">PostgreSQL • Redis • Atomic Filesystem</p>
                </div>
              </div>

              <div className="space-y-2.5 text-xs text-slate-300 font-mono">
                <div className="p-3 bg-slate-900/90 rounded-xl border border-slate-800 flex items-start gap-2.5">
                  <CheckCircle2 className="w-4 h-4 text-brand-400 shrink-0 mt-0.5" />
                  <span>Local filesystem (./data/objects/) persists opaque ciphertext only</span>
                </div>
                <div className="p-3 bg-slate-900/90 rounded-xl border border-slate-800 flex items-start gap-2.5">
                  <CheckCircle2 className="w-4 h-4 text-brand-400 shrink-0 mt-0.5" />
                  <span>PostgreSQL persists hashed credentials & encrypted key envelopes</span>
                </div>
                <div className="p-3 bg-slate-900/90 rounded-xl border border-slate-800 flex items-start gap-2.5">
                  <CheckCircle2 className="w-4 h-4 text-brand-400 shrink-0 mt-0.5" />
                  <span>Fail-safe sliding window rate limiting prevents brute-force</span>
                </div>
                <div className="p-3 bg-slate-900/90 rounded-xl border border-slate-800 flex items-start gap-2.5">
                  <CheckCircle2 className="w-4 h-4 text-brand-400 shrink-0 mt-0.5" />
                  <span>Loopback binding strictly to 127.0.0.1 for maximum attack surface defense</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Core Security Features Grid */}
      <section className="py-20 px-6 border-t border-slate-800/80 bg-slate-950/20">
        <div className="max-w-6xl mx-auto space-y-12">
          <div className="text-center space-y-3">
            <h2 className="text-2xl sm:text-3xl font-extrabold text-white tracking-tight">
              Enterprise Defensive Engineering
            </h2>
            <p className="text-sm text-slate-400 max-w-xl mx-auto">
              Built according to rigorous modern cryptography standards.
            </p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
            <div className="glass-panel rounded-2xl p-5 space-y-3 hover:border-brand-500/40 transition-colors">
              <div className="w-10 h-10 rounded-xl bg-brand-500/10 border border-brand-500/30 flex items-center justify-center text-brand-400">
                <Key className="w-5 h-5" />
              </div>
              <h3 className="font-bold text-white text-base">Dual Credential Model</h3>
              <p className="text-xs text-slate-400 leading-relaxed">
                Account password authenticates with the server; your vault passphrase unlocks encryption keys strictly in the browser.
              </p>
            </div>

            <div className="glass-panel rounded-2xl p-5 space-y-3 hover:border-emerald-500/40 transition-colors">
              <div className="w-10 h-10 rounded-xl bg-emerald-500/10 border border-emerald-500/30 flex items-center justify-center text-emerald-400">
                <RefreshCw className="w-5 h-5" />
              </div>
              <h3 className="font-bold text-white text-base">HKDF File-Key Wrapping</h3>
              <p className="text-xs text-slate-400 leading-relaxed">
                Every file generates a unique 256-bit AES-GCM key, wrapped using HKDF derived keys with contextual file ID binding.
              </p>
            </div>

            <div className="glass-panel rounded-2xl p-5 space-y-3 hover:border-sky-500/40 transition-colors">
              <div className="w-10 h-10 rounded-xl bg-sky-500/10 border border-sky-500/30 flex items-center justify-center text-sky-400">
                <FileCheck className="w-5 h-5" />
              </div>
              <h3 className="font-bold text-white text-base">Encrypted Metadata & Folders</h3>
              <p className="text-xs text-slate-400 leading-relaxed">
                Original file names, folder names, MIME types, and sizes are encrypted before transmission. Server only stores opaque UUIDs.
              </p>
            </div>

            <div className="glass-panel rounded-2xl p-5 space-y-3 hover:border-purple-500/40 transition-colors">
              <div className="w-10 h-10 rounded-xl bg-purple-500/10 border border-purple-500/30 flex items-center justify-center text-purple-400">
                <Shield className="w-5 h-5" />
              </div>
              <h3 className="font-bold text-white text-base">High-Entropy Recovery Secret</h3>
              <p className="text-xs text-slate-400 leading-relaxed">
                Generate an independent recovery secret during vault setup to restore access and rotate passphrases safely.
              </p>
            </div>

            <div className="glass-panel rounded-2xl p-5 space-y-3 hover:border-amber-500/40 transition-colors">
              <div className="w-10 h-10 rounded-xl bg-amber-500/10 border border-amber-500/30 flex items-center justify-center text-amber-400">
                <Terminal className="w-5 h-5" />
              </div>
              <h3 className="font-bold text-white text-base">Local Docker Infrastructure</h3>
              <p className="text-xs text-slate-400 leading-relaxed">
                Powered by PostgreSQL and Redis bound strictly to loopback (127.0.0.1), keeping data on your machine with ₹0 cloud bills.
              </p>
            </div>

            <div className="glass-panel rounded-2xl p-5 space-y-3 hover:border-rose-500/40 transition-colors">
              <div className="w-10 h-10 rounded-xl bg-rose-500/10 border border-rose-500/30 flex items-center justify-center text-rose-400">
                <HardDrive className="w-5 h-5" />
              </div>
              <h3 className="font-bold text-white text-base">Atomic Object Storage</h3>
              <p className="text-xs text-slate-400 leading-relaxed">
                Encrypted uploads are written with temporary random suffixes, verified for byte count integrity, and atomically renamed.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="mt-auto border-t border-slate-800/80 py-8 px-6 bg-slate-950/70">
        <div className="max-w-7xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-4 text-xs text-slate-500">
          <div className="flex items-center gap-2">
            <Shield className="w-4 h-4 text-brand-400" />
            <span className="text-slate-400 font-semibold">CloudVault — Local-First Zero-Knowledge Encrypted Storage</span>
          </div>
          <div className="font-mono text-[11px]">
            AES-256-GCM • Argon2id • HKDF-SHA256 • ₹0 Cloud Infrastructure
          </div>
        </div>
      </footer>
    </div>
  );
}
