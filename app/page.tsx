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
    <div className="min-h-screen bg-[#080c14] text-slate-100 flex flex-col selection:bg-brand-500 selection:text-white">
      {/* Top Header */}
      <header className="border-b border-surface-border/60 bg-surface/50 backdrop-blur-md sticky top-0 z-50 px-6 py-4">
        <div className="max-w-7xl mx-auto flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-brand-500/10 border border-brand-500/30 flex items-center justify-center text-brand-400 shadow-[0_0_15px_rgba(56,189,248,0.25)]">
              <Shield className="w-6 h-6" />
            </div>
            <div>
              <span className="font-bold text-lg tracking-tight text-white">
                CLOUD<span className="text-brand-400">VAULT</span>
              </span>
            </div>
          </div>

          <div className="flex items-center gap-4">
            <Link
              href="/login"
              className="text-sm font-medium text-slate-300 hover:text-white transition-colors px-4 py-2 rounded-lg hover:bg-slate-800"
            >
              Sign In
            </Link>
            <Link
              href="/register"
              className="text-sm font-medium bg-brand-500 hover:bg-brand-600 text-white px-5 py-2 rounded-lg shadow-sm transition-all shadow-brand-500/20"
            >
              Get Started
            </Link>
          </div>
        </div>
      </header>

      {/* Hero Section */}
      <section className="pt-20 pb-16 px-6 relative overflow-hidden">
        <div className="max-w-5xl mx-auto text-center space-y-8">
          <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-brand-500/10 border border-brand-500/30 text-brand-400 text-xs font-mono tracking-wide">
            <Lock className="w-3.5 h-3.5" /> ZERO-KNOWLEDGE LOCAL-FIRST CLOUD STORAGE
          </div>

          <h1 className="text-4xl sm:text-6xl font-extrabold text-white tracking-tight leading-tight">
            Your Files. Your Keys. <br />
            <span className="text-transparent bg-clip-text bg-gradient-to-r from-brand-400 via-sky-300 to-blue-500">
              Your Privacy.
            </span>
          </h1>

          <p className="max-w-2xl mx-auto text-base sm:text-lg text-slate-400 leading-relaxed">
            CloudVault encrypts your files inside your browser using{" "}
            <strong className="text-slate-200">AES-256-GCM</strong> and{" "}
            <strong className="text-slate-200">Argon2id</strong> before bytes ever leave your device.
            The server only stores opaque ciphertext.
          </p>

          <div className="flex flex-col sm:flex-row items-center justify-center gap-4 pt-4">
            <Link
              href="/register"
              className="w-full sm:w-auto inline-flex items-center justify-center gap-2 px-8 py-3.5 rounded-xl bg-brand-500 hover:bg-brand-600 text-white font-semibold text-sm shadow-lg shadow-brand-500/25 transition-all"
            >
              Initialize Local Vault <ArrowRight className="w-4 h-4" />
            </Link>
            <Link
              href="/login"
              className="w-full sm:w-auto inline-flex items-center justify-center gap-2 px-8 py-3.5 rounded-xl bg-surface-raised hover:bg-slate-700 text-slate-200 border border-surface-border font-semibold text-sm transition-colors"
            >
              Unlock Existing Vault
            </Link>
          </div>
        </div>
      </section>

      {/* Architecture Pipeline Comparison */}
      <section className="py-16 px-6 bg-surface/30 border-y border-surface-border/40">
        <div className="max-w-6xl mx-auto space-y-12">
          <div className="text-center space-y-3">
            <h2 className="text-2xl sm:text-3xl font-bold text-white tracking-tight">
              Trust Boundaries & Cryptographic Pipeline
            </h2>
            <p className="text-sm text-slate-400 max-w-xl mx-auto">
              How CloudVault enforces true zero-knowledge client-side encryption.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            {/* Browser Sandbox */}
            <div className="bg-surface border border-brand-500/30 rounded-2xl p-6 space-y-5 shadow-xl relative overflow-hidden">
              <div className="absolute top-0 right-0 bg-brand-500/20 text-brand-400 text-[10px] font-mono px-3 py-1 rounded-bl-lg uppercase tracking-wider font-semibold border-b border-l border-brand-500/30">
                User Browser Sandbox
              </div>
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-lg bg-brand-500/10 border border-brand-500/30 flex items-center justify-center text-brand-400">
                  <Cpu className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="font-semibold text-white">Client-Side Cryptography</h3>
                  <p className="text-xs text-slate-400">Keys & Plaintext never leave browser</p>
                </div>
              </div>

              <div className="space-y-2.5 text-xs text-slate-300 font-mono">
                <div className="p-3 bg-slate-900/80 rounded-lg border border-surface-border flex items-start gap-2.5">
                  <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0 mt-0.5" />
                  <span>256-bit Master Key generated via Web Crypto API</span>
                </div>
                <div className="p-3 bg-slate-900/80 rounded-lg border border-surface-border flex items-start gap-2.5">
                  <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0 mt-0.5" />
                  <span>KEK derived via browser-side Argon2id (64MB memory cost)</span>
                </div>
                <div className="p-3 bg-slate-900/80 rounded-lg border border-surface-border flex items-start gap-2.5">
                  <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0 mt-0.5" />
                  <span>Per-file fresh AES-256-GCM keys & unique 96-bit nonces</span>
                </div>
                <div className="p-3 bg-slate-900/80 rounded-lg border border-surface-border flex items-start gap-2.5">
                  <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0 mt-0.5" />
                  <span>Filenames and metadata encrypted before upload</span>
                </div>
              </div>
            </div>

            {/* Local Backend Server */}
            <div className="bg-surface border border-surface-border rounded-2xl p-6 space-y-5 shadow-xl relative overflow-hidden">
              <div className="absolute top-0 right-0 bg-slate-800 text-slate-400 text-[10px] font-mono px-3 py-1 rounded-bl-lg uppercase tracking-wider font-semibold border-b border-l border-surface-border">
                Local Server & Storage
              </div>
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-lg bg-slate-800 border border-surface-border flex items-center justify-center text-slate-300">
                  <HardDrive className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="font-semibold text-white">Local Storage & Database</h3>
                  <p className="text-xs text-slate-400">Stores only ciphertext and envelopes</p>
                </div>
              </div>

              <div className="space-y-2.5 text-xs text-slate-300 font-mono">
                <div className="p-3 bg-slate-900/80 rounded-lg border border-surface-border flex items-start gap-2.5">
                  <CheckCircle2 className="w-4 h-4 text-brand-400 shrink-0 mt-0.5" />
                  <span>Local filesystem (./data/objects/) holds ciphertext only</span>
                </div>
                <div className="p-3 bg-slate-900/80 rounded-lg border border-surface-border flex items-start gap-2.5">
                  <CheckCircle2 className="w-4 h-4 text-brand-400 shrink-0 mt-0.5" />
                  <span>PostgreSQL holds hashed passwords & encrypted envelopes</span>
                </div>
                <div className="p-3 bg-slate-900/80 rounded-lg border border-surface-border flex items-start gap-2.5">
                  <CheckCircle2 className="w-4 h-4 text-brand-400 shrink-0 mt-0.5" />
                  <span>Redis fail-safe sliding window rate limiting</span>
                </div>
                <div className="p-3 bg-slate-900/80 rounded-lg border border-surface-border flex items-start gap-2.5">
                  <CheckCircle2 className="w-4 h-4 text-brand-400 shrink-0 mt-0.5" />
                  <span>Zero plaintext filenames or file contents stored</span>
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
            <p className="text-sm text-slate-400 max-w-xl mx-auto">
              Engineered with modern cryptographic primitives and local-first resilience.
            </p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
            <div className="bg-surface/60 border border-surface-border rounded-xl p-5 space-y-3">
              <Key className="w-6 h-6 text-brand-400" />
              <h3 className="font-semibold text-white text-base">Separate Authentication & Vault Keys</h3>
              <p className="text-xs text-slate-400 leading-relaxed">
                Your account password authenticates your session with the local server, while your vault passphrase unlocks the encryption keys strictly in the browser.
              </p>
            </div>

            <div className="bg-surface/60 border border-surface-border rounded-xl p-5 space-y-3">
              <RefreshCw className="w-6 h-6 text-emerald-400" />
              <h3 className="font-semibold text-white text-base">HKDF File-Key Wrapping</h3>
              <p className="text-xs text-slate-400 leading-relaxed">
                Every file generates a fresh 256-bit AES-GCM key, wrapped using purpose-specific keys derived from the master key with file-bound context.
              </p>
            </div>

            <div className="bg-surface/60 border border-surface-border rounded-xl p-5 space-y-3">
              <FileCheck className="w-6 h-6 text-sky-400" />
              <h3 className="font-semibold text-white text-base">Encrypted Metadata & Folders</h3>
              <p className="text-xs text-slate-400 leading-relaxed">
                Original file names, folder names, MIME types, and sizes are encrypted before transmission. The server only sees opaque UUID identifiers.
              </p>
            </div>

            <div className="bg-surface/60 border border-surface-border rounded-xl p-5 space-y-3">
              <Shield className="w-6 h-6 text-purple-400" />
              <h3 className="font-semibold text-white text-base">High-Entropy Recovery Secret</h3>
              <p className="text-xs text-slate-400 leading-relaxed">
                Generate an independent recovery secret during vault setup to restore access and rotate your passphrase without losing previously encrypted files.
              </p>
            </div>

            <div className="bg-surface/60 border border-surface-border rounded-xl p-5 space-y-3">
              <Terminal className="w-6 h-6 text-amber-400" />
              <h3 className="font-semibold text-white text-base">Local Docker Infrastructure</h3>
              <p className="text-xs text-slate-400 leading-relaxed">
                Powered by PostgreSQL and Redis bound strictly to loopback (127.0.0.1) in Docker, keeping your data entirely on your computer with ₹0 cloud costs.
              </p>
            </div>

            <div className="bg-surface/60 border border-surface-border rounded-xl p-5 space-y-3">
              <HardDrive className="w-6 h-6 text-rose-400" />
              <h3 className="font-semibold text-white text-base">Atomic Object Storage</h3>
              <p className="text-xs text-slate-400 leading-relaxed">
                Encrypted uploads are written with temporary random suffixes, verified for byte count integrity, and atomically renamed to prevent partial writes.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="mt-auto border-t border-surface-border/40 py-8 px-6 bg-surface/20">
        <div className="max-w-7xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-4 text-xs text-slate-500">
          <div className="flex items-center gap-2">
            <Shield className="w-4 h-4 text-brand-400" />
            <span>CloudVault — Local-First Zero-Knowledge Encrypted Storage</span>
          </div>
          <div>
            <span>100% Client-Side Encryption • AES-256-GCM • Argon2id • ₹0 Cloud Infrastructure</span>
          </div>
        </div>
      </footer>
    </div>
  );
}
