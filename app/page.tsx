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
} from "lucide-react";

export default function LandingPage() {
  return (
    <div className="min-h-screen bg-[#080c14] text-slate-100 flex flex-col selection:bg-sky-500 selection:text-white cyber-grid-bg">
      {/* Top Header */}
      <header className="border-b border-slate-800/80 bg-[#080c14]/80 backdrop-blur-xl sticky top-0 z-50 px-6 py-3.5">
        <div className="max-w-7xl mx-auto flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-sky-500/20 to-blue-600/10 border border-sky-400/40 flex items-center justify-center text-sky-400 shadow-[0_0_15px_rgba(56,189,248,0.25)]">
              <Shield className="w-5 h-5" />
            </div>
            <div className="flex flex-col">
              <span className="font-bold text-base tracking-tight text-white flex items-center gap-1">
                CLOUD<span className="text-transparent bg-clip-text bg-gradient-to-r from-sky-400 to-blue-400">VAULT</span>
              </span>
              <span className="text-[10px] text-slate-400 font-mono tracking-wider -mt-0.5">
                ZERO-KNOWLEDGE
              </span>
            </div>
          </div>

          <div className="flex items-center gap-3">
            <Link
              href="/login"
              className="text-xs font-semibold text-slate-300 hover:text-white transition-colors px-4 py-2 rounded-lg hover:bg-slate-800/60"
            >
              Sign In
            </Link>
            <Link
              href="/register"
              className="text-xs font-semibold bg-gradient-to-r from-sky-500 to-blue-600 hover:from-sky-400 hover:to-blue-500 text-white px-4 py-2 rounded-lg shadow-md shadow-sky-500/20 transition-all border border-sky-400/30"
            >
              Get Started
            </Link>
          </div>
        </div>
      </header>

      {/* Hero Section */}
      <section className="pt-24 pb-20 px-6 relative overflow-hidden">
        <div className="max-w-5xl mx-auto text-center space-y-8">
          <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-sky-500/10 border border-sky-500/30 text-sky-400 text-xs font-mono tracking-wide shadow-[0_0_12px_rgba(56,189,248,0.15)]">
            <Lock className="w-3.5 h-3.5" /> ZERO-KNOWLEDGE LOCAL-FIRST ARCHITECTURE
          </div>

          <h1 className="text-4xl sm:text-6xl font-extrabold text-white tracking-tight leading-tight sm:leading-none">
            Your Files. Your Keys. <br />
            <span className="text-transparent bg-clip-text bg-gradient-to-r from-sky-400 via-teal-300 to-blue-500">
              Your Privacy.
            </span>
          </h1>

          <p className="max-w-2xl mx-auto text-sm sm:text-base text-slate-300 leading-relaxed font-normal">
            CloudVault encrypts every byte inside your browser using{" "}
            <span className="text-sky-300 font-semibold font-mono">AES-256-GCM</span> and{" "}
            <span className="text-sky-300 font-semibold font-mono">Argon2id</span> before data ever leaves your device.
            The local server only stores opaque ciphertext envelopes.
          </p>

          <div className="flex flex-col sm:flex-row items-center justify-center gap-4 pt-4">
            <Link
              href="/register"
              className="w-full sm:w-auto inline-flex items-center justify-center gap-2 px-7 py-3 rounded-xl bg-gradient-to-r from-sky-500 to-blue-600 hover:from-sky-400 hover:to-blue-500 text-white font-semibold text-xs shadow-lg shadow-sky-500/25 transition-all border border-sky-400/30 active:scale-95"
            >
              Initialize Local Vault <ArrowRight className="w-4 h-4" />
            </Link>
            <Link
              href="/login"
              className="w-full sm:w-auto inline-flex items-center justify-center gap-2 px-7 py-3 rounded-xl bg-slate-900/90 hover:bg-slate-800 text-slate-200 border border-slate-700/80 font-semibold text-xs transition-colors shadow-sm"
            >
              Unlock Existing Vault
            </Link>
          </div>

          {/* Quick Telemetry Bar */}
          <div className="pt-8 flex flex-wrap items-center justify-center gap-6 sm:gap-10 text-[11px] font-mono text-slate-400">
            <div className="flex items-center gap-2">
              <span className="w-2 h-2 rounded-full bg-emerald-400"></span>
              <span>Argon2id (64MB RAM KDF)</span>
            </div>
            <div className="flex items-center gap-2">
              <span className="w-2 h-2 rounded-full bg-sky-400"></span>
              <span>AES-256-GCM + 96-bit Nonces</span>
            </div>
            <div className="flex items-center gap-2">
              <span className="w-2 h-2 rounded-full bg-purple-400"></span>
              <span>HKDF-SHA256 File Wrapping</span>
            </div>
            <div className="flex items-center gap-2">
              <span className="w-2 h-2 rounded-full bg-amber-400"></span>
              <span>100% Local / ₹0 Cloud Subscriptions</span>
            </div>
          </div>
        </div>
      </section>

      {/* Architecture Pipeline Comparison */}
      <section className="py-20 px-6 bg-slate-950/60 border-y border-slate-800/80">
        <div className="max-w-6xl mx-auto space-y-12">
          <div className="text-center space-y-3">
            <h2 className="text-2xl sm:text-3xl font-bold text-white tracking-tight">
              Cryptographic Trust Boundaries
            </h2>
            <p className="text-xs sm:text-sm text-slate-400 max-w-xl mx-auto">
              Clear mathematical separation between client-side plaintext and local server ciphertext storage.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            {/* Browser Sandbox */}
            <div className="bg-slate-900/70 border border-sky-500/30 rounded-2xl p-6 sm:p-7 space-y-5 shadow-2xl relative overflow-hidden">
              <div className="absolute top-0 right-0 bg-sky-500/10 text-sky-400 text-[10px] font-mono px-3.5 py-1.5 rounded-bl-xl uppercase tracking-wider font-semibold border-b border-l border-sky-500/30">
                User Browser Sandbox
              </div>
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-sky-500/10 border border-sky-500/30 flex items-center justify-center text-sky-400 shadow-[0_0_12px_rgba(56,189,248,0.2)]">
                  <Cpu className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="font-semibold text-white text-sm">Client-Side Cryptography</h3>
                  <p className="text-xs text-slate-400">Master Keys & Plaintext never leave browser RAM</p>
                </div>
              </div>

              <div className="space-y-3 text-xs text-slate-300 font-mono">
                <div className="p-3 bg-slate-950/80 rounded-xl border border-slate-800 flex items-start gap-2.5">
                  <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0 mt-0.5" />
                  <span>256-bit Master Key generated via Web Crypto API in local memory</span>
                </div>
                <div className="p-3 bg-slate-950/80 rounded-xl border border-slate-800 flex items-start gap-2.5">
                  <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0 mt-0.5" />
                  <span>KEK derived via browser Argon2id (64MB memory cost, 3 iterations)</span>
                </div>
                <div className="p-3 bg-slate-950/80 rounded-xl border border-slate-800 flex items-start gap-2.5">
                  <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0 mt-0.5" />
                  <span>Per-file fresh AES-256-GCM keys & unique 96-bit random nonces</span>
                </div>
                <div className="p-3 bg-slate-950/80 rounded-xl border border-slate-800 flex items-start gap-2.5">
                  <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0 mt-0.5" />
                  <span>Original filenames, folder paths, and MIME types encrypted before upload</span>
                </div>
              </div>
            </div>

            {/* Local Backend Server */}
            <div className="bg-slate-900/50 border border-slate-800/80 rounded-2xl p-6 sm:p-7 space-y-5 shadow-2xl relative overflow-hidden">
              <div className="absolute top-0 right-0 bg-slate-800/80 text-slate-400 text-[10px] font-mono px-3.5 py-1.5 rounded-bl-xl uppercase tracking-wider font-semibold border-b border-l border-slate-700">
                Local Host & Storage
              </div>
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-slate-800/80 border border-slate-700 flex items-center justify-center text-slate-300">
                  <HardDrive className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="font-semibold text-white text-sm">Local Storage & Host Services</h3>
                  <p className="text-xs text-slate-400">Stores only opaque ciphertext envelopes & hash digests</p>
                </div>
              </div>

              <div className="space-y-3 text-xs text-slate-300 font-mono">
                <div className="p-3 bg-slate-950/80 rounded-xl border border-slate-800 flex items-start gap-2.5">
                  <CheckCircle2 className="w-4 h-4 text-sky-400 shrink-0 mt-0.5" />
                  <span>Local storage (./data/objects/) holds ciphertext files under opaque IDs</span>
                </div>
                <div className="p-3 bg-slate-950/80 rounded-xl border border-slate-800 flex items-start gap-2.5">
                  <CheckCircle2 className="w-4 h-4 text-sky-400 shrink-0 mt-0.5" />
                  <span>PostgreSQL holds hashed passwords & encrypted metadata envelopes</span>
                </div>
                <div className="p-3 bg-slate-950/80 rounded-xl border border-slate-800 flex items-start gap-2.5">
                  <CheckCircle2 className="w-4 h-4 text-sky-400 shrink-0 mt-0.5" />
                  <span>Redis fail-safe sliding-window rate limiting & abuse prevention</span>
                </div>
                <div className="p-3 bg-slate-950/80 rounded-xl border border-slate-800 flex items-start gap-2.5">
                  <CheckCircle2 className="w-4 h-4 text-sky-400 shrink-0 mt-0.5" />
                  <span>Zero plaintext files, keys, or passwords ever reach the server</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Core Security Features */}
      <section className="py-20 px-6">
        <div className="max-w-6xl mx-auto space-y-12">
          <div className="text-center space-y-3">
            <h2 className="text-2xl sm:text-3xl font-bold text-white tracking-tight">
              Enterprise Zero-Knowledge Architecture
            </h2>
            <p className="text-xs sm:text-sm text-slate-400 max-w-xl mx-auto">
              Engineered with modern cryptographic primitives and local-first resilience.
            </p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
            <div className="bg-slate-900/60 border border-slate-800/80 hover:border-sky-500/30 rounded-2xl p-5 space-y-3 transition-colors shadow-lg">
              <div className="w-9 h-9 rounded-lg bg-sky-500/10 border border-sky-500/20 flex items-center justify-center text-sky-400">
                <Key className="w-4 h-4" />
              </div>
              <h3 className="font-semibold text-white text-sm">Two-Factor Credential Model</h3>
              <p className="text-xs text-slate-400 leading-relaxed">
                Your account password authenticates your session with the local server, while your vault passphrase unlocks your encryption keys strictly inside your browser memory.
              </p>
            </div>

            <div className="bg-slate-900/60 border border-slate-800/80 hover:border-emerald-500/30 rounded-2xl p-5 space-y-3 transition-colors shadow-lg">
              <div className="w-9 h-9 rounded-lg bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center text-emerald-400">
                <RefreshCw className="w-4 h-4" />
              </div>
              <h3 className="font-semibold text-white text-sm">HKDF File-Key Wrapping</h3>
              <p className="text-xs text-slate-400 leading-relaxed">
                Every file generates a fresh 256-bit AES-GCM key, wrapped using purpose-specific keys derived from the master key with file-bound context identifiers.
              </p>
            </div>

            <div className="bg-slate-900/60 border border-slate-800/80 hover:border-teal-500/30 rounded-2xl p-5 space-y-3 transition-colors shadow-lg">
              <div className="w-9 h-9 rounded-lg bg-teal-500/10 border border-teal-500/20 flex items-center justify-center text-teal-400">
                <FileCheck className="w-4 h-4" />
              </div>
              <h3 className="font-semibold text-white text-sm">Encrypted Metadata & Folders</h3>
              <p className="text-xs text-slate-400 leading-relaxed">
                Original file names, folder names, MIME types, and sizes are encrypted before transmission. The server only sees opaque UUID identifiers.
              </p>
            </div>

            <div className="bg-slate-900/60 border border-slate-800/80 hover:border-purple-500/30 rounded-2xl p-5 space-y-3 transition-colors shadow-lg">
              <div className="w-9 h-9 rounded-lg bg-purple-500/10 border border-purple-500/20 flex items-center justify-center text-purple-400">
                <Shield className="w-4 h-4" />
              </div>
              <h3 className="font-semibold text-white text-sm">High-Entropy Recovery Secret</h3>
              <p className="text-xs text-slate-400 leading-relaxed">
                Generate an independent recovery secret during vault setup to restore access and rotate your passphrase without losing previously encrypted files.
              </p>
            </div>

            <div className="bg-slate-900/60 border border-slate-800/80 hover:border-amber-500/30 rounded-2xl p-5 space-y-3 transition-colors shadow-lg">
              <div className="w-9 h-9 rounded-lg bg-amber-500/10 border border-amber-500/20 flex items-center justify-center text-amber-400">
                <Terminal className="w-4 h-4" />
              </div>
              <h3 className="font-semibold text-white text-sm">Loopback Isolation</h3>
              <p className="text-xs text-slate-400 leading-relaxed">
                PostgreSQL and Redis are bound strictly to loopback (127.0.0.1) on Docker or host, keeping all operational state on your physical machine.
              </p>
            </div>

            <div className="bg-slate-900/60 border border-slate-800/80 hover:border-rose-500/30 rounded-2xl p-5 space-y-3 transition-colors shadow-lg">
              <div className="w-9 h-9 rounded-lg bg-rose-500/10 border border-rose-500/20 flex items-center justify-center text-rose-400">
                <HardDrive className="w-4 h-4" />
              </div>
              <h3 className="font-semibold text-white text-sm">Atomic Object Storage</h3>
              <p className="text-xs text-slate-400 leading-relaxed">
                Encrypted uploads are written with temporary random suffixes, verified for byte count integrity, and atomically renamed to prevent partial writes.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="mt-auto border-t border-slate-800/80 py-8 px-6 bg-[#080c14]/90">
        <div className="max-w-7xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-4 text-xs text-slate-400">
          <div className="flex items-center gap-2">
            <Shield className="w-4 h-4 text-sky-400" />
            <span className="font-medium text-slate-300">CloudVault — Local-First Zero-Knowledge Encrypted Storage</span>
          </div>
          <div>
            <span className="font-mono text-[11px]">100% Client-Side Encryption • AES-256-GCM • Argon2id • ₹0 Cloud Infrastructure</span>
          </div>
        </div>
      </footer>
    </div>
  );
}
