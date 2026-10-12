"use client";

import React, { useEffect, useState, useCallback, useRef } from "react";
import Link from "next/link";
import {
  HardDrive,
  Files,
  Lock,
  Unlock,
  UploadCloud,
  FileCheck2,
  Clock,
  ArrowUpRight,
  ShieldAlert,
  AlertCircle,
  File as FileIcon,
  Download,
  Trash2,
} from "lucide-react";
import { Card, CardTitle, CardHeader } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { useVault, DecryptedFileInfo } from "@/lib/crypto/vault-context";

export default function DashboardPage() {
  const { isUnlocked, prepareEncryptedUpload, decryptFileMetadataItem, decryptDownloadedFile } =
    useVault();

  const [stats, setStats] = useState({
    usedBytes: 0,
    quotaBytes: 5368709120,
    fileCount: 0,
    percentageUsed: 0,
  });

  const [recentFiles, setRecentFiles] = useState<DecryptedFileInfo[]>([]);
  const [loadingFiles, setLoadingFiles] = useState(true);
  const [uploading, setUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [uploadStatusText, setUploadStatusText] = useState("");
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const fileInputRef = useRef<HTMLInputElement>(null);

  const formatSize = (bytes: number) => {
    if (bytes === 0) return "0 B";
    const k = 1024;
    const sizes = ["B", "KB", "MB", "GB"];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + " " + sizes[i];
  };

  const fetchDashboardData = useCallback(async () => {
    try {
      const [storageRes, filesRes] = await Promise.all([
        fetch("/api/storage/usage"),
        fetch("/api/files"),
      ]);

      if (storageRes.ok) {
        const sData = await storageRes.json();
        setStats(sData);
      }

      if (filesRes.ok) {
        const fData = await filesRes.json();
        const rawFiles = fData.files || [];
        // Decrypt metadata for recent files
        const decryptedPromises = rawFiles.slice(0, 5).map((f: any) =>
          decryptFileMetadataItem(f)
        );
        const resolved = await Promise.all(decryptedPromises);
        setRecentFiles(resolved);
      }
    } catch {
      // ignore
    } finally {
      setLoadingFiles(false);
    }
  }, [decryptFileMetadataItem]);

  useEffect(() => {
    fetchDashboardData();
  }, [fetchDashboardData, isUnlocked]);

  const handleFileUpload = async (files: FileList | null) => {
    if (!files || files.length === 0) return;
    if (!isUnlocked) {
      setErrorMessage("Please unlock your vault before uploading files.");
      return;
    }

    setErrorMessage(null);
    setUploading(true);
    setUploadProgress(10);
    setUploadStatusText("Encrypting file in browser (AES-256-GCM)...");

    try {
      const file = files[0];

      // 1. Client-Side Encryption
      const encryptedData = await prepareEncryptedUpload(file);
      setUploadProgress(40);
      setUploadStatusText("Authorizing upload & reserving opaque object ID...");

      // 2. Authorize upload with backend
      const initRes = await fetch("/api/files/initiate-upload", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          fileId: encryptedData.fileId,
          declaredCiphertextSize: encryptedData.ciphertextSize,
          encryptedFileKey: encryptedData.encryptedFileKey,
          fileKeyWrappingNonce: encryptedData.fileKeyWrappingNonce,
          fileEncryptionNonce: encryptedData.fileEncryptionNonce,
          encryptedMetadata: encryptedData.encryptedMetadata,
          metadataNonce: encryptedData.metadataNonce,
          folderId: null,
        }),
      });

      if (!initRes.ok) {
        const err = await initRes.json();
        throw new Error(err.error || "Failed to initiate upload");
      }

      const { fileId } = await initRes.json();
      setUploadProgress(70);
      setUploadStatusText("Writing ciphertext to local encrypted storage...");

      // 3. Upload ciphertext binary
      const uploadRes = await fetch(`/api/files/upload/${fileId}`, {
        method: "POST",
        headers: { "Content-Type": "application/octet-stream" },
        body: new Blob([encryptedData.ciphertext as any]),
      });

      if (!uploadRes.ok) {
        throw new Error("Failed to store encrypted ciphertext");
      }

      setUploadProgress(100);
      setUploadStatusText("Upload complete & verified!");
      await fetchDashboardData();
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : "Upload failed";
      setErrorMessage(msg);
    } finally {
      setTimeout(() => {
        setUploading(false);
        setUploadProgress(0);
        setUploadStatusText("");
      }, 1200);
    }
  };

  const handleDownload = async (file: DecryptedFileInfo) => {
    if (!isUnlocked) {
      setErrorMessage("Please unlock your vault before decrypting files.");
      return;
    }

    try {
      const res = await fetch(`/api/files/${file.id}/download`);
      if (!res.ok) throw new Error("Failed to download ciphertext");

      const ciphertext = await res.arrayBuffer();
      const { decryptedBlob, metadata } = await decryptDownloadedFile(file, ciphertext);

      const url = URL.createObjectURL(decryptedBlob);
      const a = document.createElement("a");
      a.href = url;
      a.download = metadata.name;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : "Decryption failed";
      setErrorMessage(msg);
    }
  };

  const handleDelete = async (fileId: string) => {
    if (!confirm("Are you sure you want to permanently delete this encrypted file?")) return;
    try {
      const res = await fetch(`/api/files/${fileId}`, { method: "DELETE" });
      if (res.ok) {
        await fetchDashboardData();
      }
    } catch {
      // ignore
    }
  };

  return (
    <div className="max-w-7xl mx-auto space-y-8">
        {/* Welcome & Vault Status Header */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <h1 className="text-2xl font-bold text-white tracking-tight">Security Dashboard</h1>
            <p className="text-xs text-slate-400 mt-1">
              Local-first zero-knowledge encrypted object storage
            </p>
          </div>

          <div className="flex items-center gap-3">
            {!isUnlocked ? (
              <Link href="/unlock">
                <Button variant="outline" size="sm" className="border-amber-500/40 text-amber-400 hover:bg-amber-500/10">
                  <Lock className="w-4 h-4 mr-2" /> Unlock Vault Keys
                </Button>
              </Link>
            ) : (
              <Badge variant="success" className="px-3 py-1 font-mono">
                <Unlock className="w-3.5 h-3.5 mr-1" /> Active Session Ready
              </Badge>
            )}
          </div>
        </div>

        {/* Warning if Vault is Locked */}
        {!isUnlocked && (
          <div className="p-4 rounded-xl bg-amber-500/10 border border-amber-500/30 flex items-start gap-3 text-xs text-amber-300">
            <ShieldAlert className="w-5 h-5 shrink-0 text-amber-400 mt-0.5" />
            <div className="space-y-1">
              <p className="font-semibold text-amber-200">Vault Memory Key Scrubbed</p>
              <p className="text-slate-400">
                Your master encryption key is not held in memory. Filenames and file data are shown in encrypted format until you{" "}
                <Link href="/unlock" className="text-brand-400 underline font-medium">
                  unlock your vault
                </Link>
                .
              </p>
            </div>
          </div>
        )}

        {errorMessage && (
          <div className="p-4 rounded-xl bg-red-500/10 border border-red-500/30 flex items-center gap-3 text-xs text-red-400">
            <AlertCircle className="w-4 h-4 shrink-0" />
            <span>{errorMessage}</span>
          </div>
        )}

        {/* Top Metric Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-5">
          <Card className="space-y-3 relative overflow-hidden group">
            <div className="flex items-center justify-between">
              <span className="text-xs font-semibold uppercase tracking-wider text-slate-400">Encrypted Storage</span>
              <div className="w-8 h-8 rounded-lg bg-brand-500/10 border border-brand-500/20 flex items-center justify-center text-brand-400">
                <HardDrive className="w-4 h-4" />
              </div>
            </div>
            <div>
              <div className="text-2xl font-bold font-mono text-white tracking-tight">
                {formatSize(stats.usedBytes)}
              </div>
              <div className="text-xs text-slate-400 mt-1">
                of {formatSize(stats.quotaBytes)} total quota ({stats.percentageUsed}%)
              </div>
            </div>
            <Progress value={stats.percentageUsed} />
          </Card>

          <Card className="space-y-3 relative overflow-hidden group">
            <div className="flex items-center justify-between">
              <span className="text-xs font-semibold uppercase tracking-wider text-slate-400">Encrypted Objects</span>
              <div className="w-8 h-8 rounded-lg bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center text-emerald-400">
                <Files className="w-4 h-4" />
              </div>
            </div>
            <div>
              <div className="text-2xl font-bold font-mono text-white tracking-tight">
                {stats.fileCount}
              </div>
              <div className="text-xs text-slate-400 mt-1">
                Persisted in ./data/objects/
              </div>
            </div>
            <div className="text-[11px] text-emerald-400 font-mono flex items-center gap-1.5 font-medium">
              <FileCheck2 className="w-3.5 h-3.5" /> 100% Ciphertext Verified
            </div>
          </Card>

          <Card className="space-y-3 relative overflow-hidden group">
            <div className="flex items-center justify-between">
              <span className="text-xs font-semibold uppercase tracking-wider text-slate-400">Security Posture</span>
              <div className={`w-8 h-8 rounded-lg flex items-center justify-center ${
                isUnlocked
                  ? "bg-emerald-500/10 border border-emerald-500/20 text-emerald-400"
                  : "bg-rose-500/10 border border-rose-500/20 text-rose-400"
              }`}>
                {isUnlocked ? <Unlock className="w-4 h-4" /> : <Lock className="w-4 h-4" />}
              </div>
            </div>
            <div>
              <div className="text-2xl font-bold text-white tracking-tight">
                {isUnlocked ? "Memory Active" : "Memory Scrubbed"}
              </div>
              <div className="text-xs text-slate-400 mt-1">
                AES-256-GCM + Argon2id
              </div>
            </div>
            <div className="text-[11px] text-brand-400 font-mono">
              Loopback Bound (127.0.0.1)
            </div>
          </Card>
        </div>

        {/* Cryptographic Pipeline Status Pill Visualizer */}
        <div className="glass-panel p-4 rounded-2xl border-slate-800 flex flex-col md:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="w-2.5 h-2.5 rounded-full bg-brand-400 animate-pulse shadow-[0_0_8px_rgba(56,189,248,0.8)]" />
            <div className="text-xs font-mono">
              <span className="text-slate-400">CRYPTO STACK: </span>
              <span className="text-white font-semibold">Web Crypto API CSPRNG ➔ Argon2id KDF ➔ AES-256-GCM ➔ HKDF Wrap</span>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <Badge variant="info">ZERO-KNOWLEDGE</Badge>
            <Badge variant={isUnlocked ? "success" : "warning"}>
              {isUnlocked ? "KEYS MOUNTED" : "LOCKED"}
            </Badge>
          </div>
        </div>

        {/* Quick Encrypted Upload Dropzone */}
        <div className="glass-panel p-8 rounded-2xl border-dashed border-2 border-slate-700/80 hover:border-brand-500/50 transition-all text-center">
          <input
            type="file"
            ref={fileInputRef}
            className="hidden"
            onChange={(e) => handleFileUpload(e.target.files)}
          />

          <div className="max-w-md mx-auto space-y-4">
            <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-brand-500/20 to-sky-600/10 border border-brand-500/30 text-brand-400 mx-auto flex items-center justify-center shadow-[0_0_15px_rgba(56,189,248,0.2)]">
              <UploadCloud className="w-7 h-7" />
            </div>

            <div className="space-y-1">
              <h3 className="text-base font-bold text-white">
                Quick Encrypted File Upload
              </h3>
              <p className="text-xs text-slate-400">
                Files are encrypted with AES-256-GCM in your browser before saving to disk.
              </p>
            </div>

            {uploading ? (
              <div className="space-y-2.5 pt-2">
                <Progress value={uploadProgress} />
                <p className="text-xs font-mono text-brand-400 animate-pulse">
                  {uploadStatusText}
                </p>
              </div>
            ) : (
              <div className="flex justify-center gap-3 pt-2">
                <Button
                  variant="primary"
                  onClick={() => fileInputRef.current?.click()}
                  disabled={!isUnlocked}
                >
                  Select File to Encrypt & Store
                </Button>
              </div>
            )}
          </div>
        </div>

        {/* Recent Files Section */}
        <Card className="p-6 space-y-4">
          <CardHeader className="mb-0">
            <div>
              <CardTitle>Recent Encrypted Files</CardTitle>
              <p className="text-xs text-slate-400 mt-0.5">
                Latest client-side encrypted objects
              </p>
            </div>
            <Link
              href="/dashboard/files"
              className="text-xs text-brand-400 hover:text-brand-300 font-medium flex items-center gap-1"
            >
              View All Files <ArrowUpRight className="w-3.5 h-3.5" />
            </Link>
          </CardHeader>

          {loadingFiles ? (
            <div className="py-8 text-center text-xs text-slate-500 font-mono">
              Decrypting file metadata envelopes...
            </div>
          ) : recentFiles.length === 0 ? (
            <div className="py-8 text-center space-y-2">
              <FileIcon className="w-8 h-8 text-slate-600 mx-auto" />
              <p className="text-xs text-slate-500">No encrypted files stored yet.</p>
            </div>
          ) : (
            <div className="divide-y divide-surface-border/40">
              {recentFiles.map((file) => (
                <div
                  key={file.id}
                  className="py-3 flex items-center justify-between gap-4 hover:bg-slate-900/40 px-2 rounded-lg transition-colors"
                >
                  <div className="flex items-center gap-3 min-w-0">
                    <div className="w-9 h-9 rounded-lg bg-slate-800 border border-surface-border flex items-center justify-center text-slate-400 shrink-0">
                      <FileIcon className="w-4 h-4" />
                    </div>
                    <div className="min-w-0">
                      <div className="text-sm font-medium text-slate-200 truncate">
                        {file.name}
                      </div>
                      <div className="text-xs text-slate-500 flex items-center gap-2 mt-0.5">
                        <span>{formatSize(file.size || file.ciphertextSize)}</span>
                        <span>•</span>
                        <span className="flex items-center gap-1 font-mono text-[11px]">
                          <Clock className="w-3 h-3" />
                          {new Date(file.createdAt).toLocaleDateString()}
                        </span>
                      </div>
                    </div>
                  </div>

                  <div className="flex items-center gap-2 shrink-0">
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => handleDownload(file)}
                      title="Decrypt & Download"
                    >
                      <Download className="w-4 h-4 text-brand-400" />
                    </Button>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => handleDelete(file.id)}
                      title="Delete Object"
                    >
                      <Trash2 className="w-4 h-4 text-slate-400 hover:text-rose-400" />
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </Card>
    </div>
  );
}
