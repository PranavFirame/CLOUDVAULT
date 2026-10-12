"use client";

import React, { useState } from "react";
import Link from "next/link";
import {
  Shield,
  Lock,
  HardDrive,
  Cpu,
  RefreshCw,
  CheckCircle2,
  ArrowRight,
  Database,
  EyeOff,
  ServerOff,
  Zap,
  FolderLock,
  Layers,
  ChevronDown,
  ChevronUp,
  FileCheck,
  Search,
} from "lucide-react";
import { useTheme } from "@/components/theme-provider";
import { Sun, Moon } from "lucide-react";

export default function LandingPage() {
  const { resolvedTheme, setTheme } = useTheme();
  const [openFaq, setOpenFaq] = useState<number | null>(null);

  const toggleFaq = (index: number) => {
    setOpenFaq(openFaq === index ? null : index);
  };

  const faqs = [
    {
      q: "How does CloudVault's zero-knowledge encryption work?",
      a: "Before any file leaves your browser, your device generates a cryptographically random 256-bit AES-GCM file key. That key is wrapped with a purpose-specific key derived via HKDF from your Master Key. Your Master Key is decrypted strictly in browser RAM using Argon2id with your Vault Passphrase. The local server only stores opaque, unreadable ciphertext.",
    },
    {
      q: "Can the server administrator or cloud host view my files?",
      a: "No. The server never receives your Vault Passphrase, Master Key, or plaintext data. Even if someone obtains full root access to the database and filesystem, they will only see opaque binary objects with encrypted names and metadata.",
    },
    {
      q: "What happens if I forget my Vault Passphrase?",
      a: "During account initialization, CloudVault generates a high-entropy Emergency Recovery Secret. You can use this recovery secret to restore your Master Key and set a new passphrase without losing access to your encrypted files.",
    },
    {
      q: "Does CloudVault require any paid cloud infrastructure?",
      a: "None. CloudVault is designed to run entirely locally with ₹0 cloud expenses. It stores encrypted objects directly on your local filesystem with database persistence in PostgreSQL and Redis.",
    },
  ];

  return (
    <div className="min-h-screen bg-background text-foreground flex flex-col selection:bg-brand-500 selection:text-white">
      {/* Top Navigation */}
      <header className="border-b border-surface-border bg-surface/80 backdrop-blur-md sticky top-0 z-50 px-6 py-3.5 transition-colors">
        <div className="max-w-7xl mx-auto flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-brand-500/10 border border-brand-500/20 flex items-center justify-center text-brand-500">
              <Shield className="w-5 h-5" />
            </div>
            <div>
              <span className="font-bold text-lg tracking-tight text-foreground">
                CLOUD<span className="text-brand-500">VAULT</span>
              </span>
            </div>
          </div>

          <nav className="hidden md:flex items-center gap-6 text-sm text-slate-600 dark:text-slate-400 font-medium">
            <a href="#features" className="hover:text-foreground transition-colors">Features</a>
            <a href="#security" className="hover:text-foreground transition-colors">Security</a>
            <a href="#how-it-works" className="hover:text-foreground transition-colors">How It Works</a>
            <a href="#faq" className="hover:text-foreground transition-colors">FAQ</a>
          </nav>

          <div className="flex items-center gap-3">
            <button
              onClick={() => setTheme(resolvedTheme === "dark" ? "light" : "dark")}
              className="p-2 rounded-lg text-slate-500 hover:text-foreground hover:bg-surface-raised transition-colors"
              title="Toggle theme"
            >
              {resolvedTheme === "dark" ? <Sun className="w-4 h-4" /> : <Moon className="w-4 h-4" />}
            </button>
            <Link
              href="/login"
              className="text-xs font-semibold text-slate-600 dark:text-slate-300 hover:text-foreground transition-colors px-3 py-2 rounded-lg hover:bg-surface-raised"
            >
              Sign In
            </Link>
            <Link
              href="/register"
              className="text-xs font-semibold bg-brand-500 hover:bg-brand-600 active:bg-brand-700 text-white px-4 py-2 rounded-lg shadow-sm transition-all"
            >
              Get Started Free
            </Link>
          </div>
        </div>
      </header>

      {/* Hero Section */}
      <section className="pt-20 pb-16 px-6 text-center relative overflow-hidden">
        <div className="max-w-4xl mx-auto space-y-6">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-brand-500/10 border border-brand-500/20 text-brand-600 dark:text-brand-400 text-xs font-medium">
            <Lock className="w-3.5 h-3.5" /> Zero-Knowledge Client-Side Encryption • Local-First
          </div>

          <h1 className="text-4xl sm:text-6xl font-extrabold text-foreground tracking-tight leading-[1.15]">
            Your files. Your privacy. <br />
            <span className="text-brand-500">Your vault.</span>
          </h1>

          <p className="max-w-2xl mx-auto text-base sm:text-lg text-slate-600 dark:text-slate-400 leading-relaxed">
            Store, organize, and protect your files in one secure, beautifully simple workspace.
            Files are encrypted with AES-256-GCM right in your browser before ever hitting the disk.
          </p>

          <div className="flex flex-col sm:flex-row items-center justify-center gap-3 pt-2">
            <Link
              href="/register"
              className="w-full sm:w-auto inline-flex items-center justify-center gap-2 px-6 py-3 rounded-lg bg-brand-500 hover:bg-brand-600 text-white font-medium text-sm shadow-sm transition-all"
            >
              Get Started Free <ArrowRight className="w-4 h-4" />
            </Link>
            <a
              href="#features"
              className="w-full sm:w-auto inline-flex items-center justify-center gap-2 px-6 py-3 rounded-lg bg-surface border border-surface-border text-foreground hover:bg-surface-raised font-medium text-sm transition-all"
            >
              Explore Features
            </a>
          </div>

          {/* Product Dashboard Preview (Realistic UI Mockup) */}
          <div className="pt-10 max-w-5xl mx-auto">
            <div className="vault-card overflow-hidden rounded-xl border border-surface-border shadow-2xl bg-surface text-left">
              {/* Fake Window Header */}
              <div className="bg-surface-raised px-4 py-2.5 border-b border-surface-border flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <div className="w-3 h-3 rounded-full bg-rose-500/80" />
                  <div className="w-3 h-3 rounded-full bg-amber-500/80" />
                  <div className="w-3 h-3 rounded-full bg-emerald-500/80" />
                  <span className="ml-2 text-xs font-mono text-slate-500 dark:text-slate-400">
                    cloudvault://vault/files
                  </span>
                </div>
                <div className="text-xs font-mono text-emerald-600 dark:text-emerald-400 flex items-center gap-1.5">
                  <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
                  AES-256-GCM ACTIVE
                </div>
              </div>

              {/* Fake Dashboard Body */}
              <div className="p-6 grid grid-cols-1 md:grid-cols-4 gap-6 bg-surface">
                {/* Left Mini Sidebar */}
                <div className="hidden md:block space-y-1 text-xs text-slate-500 dark:text-slate-400">
                  <div className="px-3 py-2 font-semibold text-slate-700 dark:text-slate-200 bg-surface-raised rounded-lg flex items-center gap-2">
                    <FolderLock className="w-4 h-4 text-brand-500" /> My Files
                  </div>
                  <div className="px-3 py-2 hover:bg-surface-raised rounded-lg flex items-center gap-2">
                    <Layers className="w-4 h-4" /> Confidential Documents
                  </div>
                  <div className="px-3 py-2 hover:bg-surface-raised rounded-lg flex items-center gap-2">
                    <HardDrive className="w-4 h-4" /> Financial Audits
                  </div>
                </div>

                {/* Main Content Area */}
                <div className="md:col-span-3 space-y-4">
                  <div className="flex items-center justify-between pb-3 border-b border-surface-border">
                    <div className="text-sm font-semibold text-foreground">Encrypted Objects</div>
                    <div className="text-xs text-brand-600 dark:text-brand-400 font-mono">
                      100% Client Encrypted
                    </div>
                  </div>

                  <div className="space-y-2 text-xs">
                    <div className="p-3 bg-surface-raised rounded-lg flex items-center justify-between border border-surface-border">
                      <div className="flex items-center gap-3">
                        <div className="w-8 h-8 rounded-lg bg-brand-500/10 flex items-center justify-center text-brand-500 font-bold">
                          PDF
                        </div>
                        <div>
                          <div className="font-semibold text-foreground">Annual_Audit_Report_2026.pdf</div>
                          <div className="text-slate-500 text-[11px]">4.2 MB • Ciphertext ID: 8f9b...14a</div>
                        </div>
                      </div>
                      <span className="px-2 py-0.5 rounded text-[10px] font-mono bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20">
                        VERIFIED
                      </span>
                    </div>

                    <div className="p-3 bg-surface-raised rounded-lg flex items-center justify-between border border-surface-border">
                      <div className="flex items-center gap-3">
                        <div className="w-8 h-8 rounded-lg bg-emerald-500/10 flex items-center justify-center text-emerald-500 font-bold">
                          KEY
                        </div>
                        <div>
                          <div className="font-semibold text-foreground">Corporate_Master_Keys.kdbx</div>
                          <div className="text-slate-500 text-[11px]">890 KB • Ciphertext ID: 3e1a...99b</div>
                        </div>
                      </div>
                      <span className="px-2 py-0.5 rounded text-[10px] font-mono bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20">
                        VERIFIED
                      </span>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section id="features" className="py-20 px-6 border-t border-surface-border bg-surface-raised/40">
        <div className="max-w-6xl mx-auto space-y-12">
          <div className="text-center space-y-2">
            <h2 className="text-2xl sm:text-3xl font-bold tracking-tight text-foreground">
              Built for Security, Simplicity, and Speed
            </h2>
            <p className="text-sm text-slate-600 dark:text-slate-400 max-w-xl mx-auto">
              Enjoy the smooth usability of modern cloud drives with uncompromising mathematical protection.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="vault-card p-6 space-y-3 bg-surface">
              <div className="w-10 h-10 rounded-lg bg-brand-500/10 border border-brand-500/20 flex items-center justify-center text-brand-500">
                <FolderLock className="w-5 h-5" />
              </div>
              <h3 className="font-semibold text-foreground text-base">Organized File & Folder Hierarchy</h3>
              <p className="text-xs text-slate-600 dark:text-slate-400 leading-relaxed">
                Create nested directories, drag files, move items between folders, and rename files. Folder names are encrypted client-side with your Master Key.
              </p>
            </div>

            <div className="vault-card p-6 space-y-3 bg-surface">
              <div className="w-10 h-10 rounded-lg bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center text-emerald-500">
                <Search className="w-5 h-5" />
              </div>
              <h3 className="font-semibold text-foreground text-base">Instant Client-Side Search</h3>
              <p className="text-xs text-slate-600 dark:text-slate-400 leading-relaxed">
                Search, sort by file size or date, and filter through files instantaneously. Search happens entirely in browser memory on decrypted file metadata.
              </p>
            </div>

            <div className="vault-card p-6 space-y-3 bg-surface">
              <div className="w-10 h-10 rounded-lg bg-sky-500/10 border border-sky-500/20 flex items-center justify-center text-sky-500">
                <FileCheck className="w-5 h-5" />
              </div>
              <h3 className="font-semibold text-foreground text-base">In-Browser File Previews</h3>
              <p className="text-xs text-slate-600 dark:text-slate-400 leading-relaxed">
                Preview images, view code files, and inspect document metadata directly in the browser after memory-safe decryption.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Security Architecture Section */}
      <section id="security" className="py-20 px-6 border-t border-surface-border bg-surface">
        <div className="max-w-6xl mx-auto space-y-12">
          <div className="text-center space-y-2">
            <h2 className="text-2xl sm:text-3xl font-bold tracking-tight text-foreground">
              Mathematical Zero-Knowledge Privacy
            </h2>
            <p className="text-sm text-slate-600 dark:text-slate-400 max-w-xl mx-auto">
              Why CloudVault provides vastly stronger protection than traditional cloud storage.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            <div className="vault-card p-6 space-y-4 border-rose-500/20 bg-surface">
              <div className="flex items-center justify-between pb-3 border-b border-surface-border">
                <span className="font-bold text-foreground flex items-center gap-2">
                  <EyeOff className="w-4 h-4 text-rose-500" /> Traditional Cloud Storage
                </span>
                <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-rose-500/10 text-rose-600 dark:text-rose-400">
                  SERVER SEES ALL
                </span>
              </div>
              <ul className="space-y-3 text-xs text-slate-600 dark:text-slate-400 font-mono">
                <li className="flex items-start gap-2">
                  <span className="text-rose-500 font-bold">✕</span>
                  <span>Server possesses decryption keys and reads file contents</span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-rose-500 font-bold">✕</span>
                  <span>Filenames and documents indexed for ads, scanning, and AI training</span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-rose-500 font-bold">✕</span>
                  <span>Subject to third-party data breaches and subpoenas</span>
                </li>
              </ul>
            </div>

            <div className="vault-card p-6 space-y-4 border-brand-500/30 bg-surface shadow-md">
              <div className="flex items-center justify-between pb-3 border-b border-surface-border">
                <span className="font-bold text-foreground flex items-center gap-2">
                  <Shield className="w-4 h-4 text-brand-500" /> CloudVault Zero-Knowledge
                </span>
                <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-brand-500/10 text-brand-600 dark:text-brand-400 font-semibold">
                  MATHEMATICALLY PRIVATE
                </span>
              </div>
              <ul className="space-y-3 text-xs text-slate-600 dark:text-slate-400 font-mono">
                <li className="flex items-start gap-2">
                  <CheckCircle2 className="w-4 h-4 text-emerald-500 shrink-0 mt-0.5" />
                  <span>Files encrypted with fresh AES-256-GCM keys before upload</span>
                </li>
                <li className="flex items-start gap-2">
                  <CheckCircle2 className="w-4 h-4 text-emerald-500 shrink-0 mt-0.5" />
                  <span>Filenames, sizes, and folder trees stored strictly as ciphertext</span>
                </li>
                <li className="flex items-start gap-2">
                  <CheckCircle2 className="w-4 h-4 text-emerald-500 shrink-0 mt-0.5" />
                  <span>Server possesses zero keys; decryption mathematically impossible for server</span>
                </li>
              </ul>
            </div>
          </div>
        </div>
      </section>

      {/* How It Works Section */}
      <section id="how-it-works" className="py-20 px-6 border-t border-surface-border bg-surface-raised/30">
        <div className="max-w-5xl mx-auto space-y-12">
          <div className="text-center space-y-2">
            <h2 className="text-2xl sm:text-3xl font-bold tracking-tight text-foreground">
              How CloudVault Works
            </h2>
            <p className="text-sm text-slate-600 dark:text-slate-400 max-w-xl mx-auto">
              Three seamless steps from your file picker to authenticated encrypted storage.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="vault-card p-6 space-y-3 bg-surface">
              <div className="text-2xl font-bold text-brand-500 font-mono">01</div>
              <h3 className="font-semibold text-foreground text-sm">Unlock Your Vault</h3>
              <p className="text-xs text-slate-600 dark:text-slate-400 leading-relaxed">
                Enter your Vault Passphrase. The browser derives your Key-Encryption Key using Argon2id and unseals your Master Key in transient RAM.
              </p>
            </div>

            <div className="vault-card p-6 space-y-3 bg-surface">
              <div className="text-2xl font-bold text-brand-500 font-mono">02</div>
              <h3 className="font-semibold text-foreground text-sm">Browser Encrypts Bytes</h3>
              <p className="text-xs text-slate-600 dark:text-slate-400 leading-relaxed">
                When you drag or select a file, a unique 256-bit AES-GCM key is generated. The file is encrypted and wrapped with HKDF before leaving your device.
              </p>
            </div>

            <div className="vault-card p-6 space-y-3 bg-surface">
              <div className="text-2xl font-bold text-brand-500 font-mono">03</div>
              <h3 className="font-semibold text-foreground text-sm">Opaque Local Storage</h3>
              <p className="text-xs text-slate-600 dark:text-slate-400 leading-relaxed">
                The local application stores only the ciphertext object in `./data/objects/` under an opaque ID. Zero plaintext is ever written to disk.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* FAQ Section */}
      <section id="faq" className="py-20 px-6 border-t border-surface-border bg-surface">
        <div className="max-w-4xl mx-auto space-y-8">
          <div className="text-center space-y-2">
            <h2 className="text-2xl sm:text-3xl font-bold tracking-tight text-foreground">
              Frequently Asked Questions
            </h2>
            <p className="text-sm text-slate-600 dark:text-slate-400">
              Clear answers regarding security, recovery, and architecture.
            </p>
          </div>

          <div className="space-y-3">
            {faqs.map((faq, idx) => (
              <div key={idx} className="vault-card bg-surface overflow-hidden">
                <button
                  onClick={() => toggleFaq(idx)}
                  className="w-full p-4 text-left text-sm font-semibold text-foreground flex items-center justify-between hover:bg-surface-raised transition-colors"
                >
                  <span>{faq.q}</span>
                  {openFaq === idx ? (
                    <ChevronUp className="w-4 h-4 text-slate-400" />
                  ) : (
                    <ChevronDown className="w-4 h-4 text-slate-400" />
                  )}
                </button>
                {openFaq === idx && (
                  <div className="px-4 pb-4 pt-1 text-xs text-slate-600 dark:text-slate-400 leading-relaxed border-t border-surface-border/50">
                    {faq.a}
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="mt-auto border-t border-surface-border py-10 px-6 bg-surface-raised">
        <div className="max-w-7xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-4 text-xs text-slate-500">
          <div className="flex items-center gap-2">
            <Shield className="w-4 h-4 text-brand-500" />
            <span className="font-semibold text-foreground">CloudVault</span>
            <span>— Premium Zero-Knowledge Encrypted Cloud Storage</span>
          </div>
          <div className="font-mono text-[11px]">
            AES-256-GCM • Argon2id • HKDF-SHA256 • ₹0 Cloud Infrastructure
          </div>
        </div>
      </footer>
    </div>
  );
}
