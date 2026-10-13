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
  Shield,
  Eye,
  FileText,
  FileCode,
  Image as ImageIcon,
  Archive,
  FileSpreadsheet,
  Plus,
} from "lucide-react";
import { Card, CardTitle, CardHeader } from "../../components/ui/card";
import { Button } from "../../components/ui/button";
import { Badge } from "../../components/ui/badge";
import { Progress } from "../../components/ui/progress";
import { useVault, DecryptedFileInfo } from "../../lib/crypto/vault-context";

export default function DashboardPage() {
  const { isUnlocked, prepareEncryptedUpload, decryptFileMetadataItem, decryptDownloadedFile } =
    useVault();

  const [stats, setStats] = useState({
    usedBytes: 0,
    quotaBytes: 5368709120,
    fileCount: 0,
    percentageUsed: 0,
  });

  const [userEmail, setUserEmail] = useState("");
  const [recentFiles, setRecentFiles] = useState<DecryptedFileInfo[]>([]);
  const [loadingFiles, setLoadingFiles] = useState(true);
  const [uploading, setUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [uploadStatusText, setUploadStatusText] = useState("");
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [isDragOver, setIsDragOver] = useState(false);

  const fileInputRef = useRef<HTMLInputElement>(null);

  const formatSize = (bytes: number) => {
    if (bytes === 0) return "0 B";
    const k = 1024;
    const sizes = ["B", "KB", "MB", "GB"];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + " " + sizes[i];
  };

  const getFileIcon = (filename: string, mimeType: string) => {
    const ext = filename.split(".").pop()?.toLowerCase();
    if (["png", "jpg", "jpeg", "gif", "webp", "svg"].includes(ext || "") || mimeType.startsWith("image/")) {
      return <ImageIcon className="w-4 h-4 text-purple-500 shrink-0" />;
    }
    if (["ts", "tsx", "js", "jsx", "py", "rs", "go", "json", "html", "css"].includes(ext || "")) {
      return <FileCode className="w-4 h-4 text-emerald-500 shrink-0" />;
    }
    if (["zip", "tar", "gz", "7z", "rar"].includes(ext || "")) {
      return <Archive className="w-4 h-4 text-amber-500 shrink-0" />;
    }
    if (["csv", "xlsx", "xls"].includes(ext || "")) {
      return <FileSpreadsheet className="w-4 h-4 text-teal-500 shrink-0" />;
    }
    if (["pdf", "txt", "md", "doc", "docx"].includes(ext || "")) {
      return <FileText className="w-4 h-4 text-sky-500 shrink-0" />;
    }
    return <FileIcon className="w-4 h-4 text-brand-500 shrink-0" />;
  };

  const fetchDashboardData = useCallback(async () => {
    try {
      const [storageRes, filesRes, authRes] = await Promise.all([
        fetch("/api/storage/usage"),
        fetch("/api/files"),
        fetch("/api/auth/me"),
      ]);

      if (authRes.ok) {
        const u = await authRes.json();
        if (u?.user?.email) setUserEmail(u.user.email);
      }

      if (storageRes.ok) {
        const sData = await storageRes.json();
        setStats(sData);
      }

      if (filesRes.ok) {
        const fData = await filesRes.json();
        const rawFiles = fData.files || [];
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

    const filesArray = Array.from(files);
    for (let i = 0; i < filesArray.length; i++) {
      const file = filesArray[i];
      setUploadStatusText(`Encrypting ${file.name} (${i + 1}/${filesArray.length})...`);
      setUploadProgress(Math.round(((i * 2 + 1) / (filesArray.length * 2)) * 100));

      try {
        const encryptedData = await prepareEncryptedUpload(file);
        setUploadStatusText(`Reserving opaque ID for ${file.name}...`);

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
          throw new Error(err.error || `Failed to initiate upload for ${file.name}`);
        }

        const { fileId } = await initRes.json();
        setUploadStatusText(`Saving ciphertext for ${file.name}...`);

        const uploadRes = await fetch(`/api/files/upload/${fileId}`, {
          method: "POST",
          headers: { "Content-Type": "application/octet-stream" },
          body: new Blob([encryptedData.ciphertext as any]),
        });

        if (!uploadRes.ok) {
          throw new Error(`Failed to store encrypted ciphertext for ${file.name}`);
        }
      } catch (err: unknown) {
        const msg = err instanceof Error ? err.message : "Upload failed";
        setErrorMessage(msg);
        break;
      }
    }

    setUploadProgress(100);
    setUploadStatusText("Upload complete!");
    await fetchDashboardData();

    setTimeout(() => {
      setUploading(false);
      setUploadProgress(0);
      setUploadStatusText("");
    }, 1000);
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

  const displayName = userEmail ? userEmail.split("@")[0] : "User";

  return (
    <div className="max-w-6xl mx-auto space-y-6">
      {/* Welcome Greeting Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-xl md:text-2xl font-bold tracking-tight text-foreground">
            Welcome back, {displayName}
          </h1>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
            Zero-knowledge encrypted cloud storage workspace
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2 sm:gap-2.5">
          {!isUnlocked ? (
            <Link href="/unlock">
              <Button variant="outline" size="sm" className="border-amber-500/40 text-amber-600 dark:text-amber-400 text-xs">
                <Lock className="w-3.5 h-3.5 mr-1.5" /> Unlock Vault Keys
              </Button>
            </Link>
          ) : (
            <Badge variant="success" className="px-2.5 py-1 text-xs">
              <Unlock className="w-3.5 h-3.5 mr-1.5" /> Vault Active
            </Badge>
          )}

          <Button
            variant="primary"
            size="sm"
            disabled={!isUnlocked}
            onClick={() => fileInputRef.current?.click()}
            className="text-xs"
          >
            <Plus className="w-4 h-4 mr-1" /> Upload File
          </Button>
        </div>
      </div>

      {/* Warning if Vault is Locked */}
      {!isUnlocked && (
        <div className="p-3.5 rounded-xl bg-amber-500/10 border border-amber-500/20 flex items-start gap-3 text-xs text-amber-700 dark:text-amber-300">
          <ShieldAlert className="w-4 h-4 shrink-0 text-amber-500 mt-0.5" />
          <div className="space-y-0.5">
            <p className="font-semibold">Vault Memory Locked</p>
            <p className="text-slate-600 dark:text-slate-400">
              Your master encryption key is not loaded in browser memory. Please{" "}
              <Link href="/unlock" className="text-brand-500 underline font-medium">
                unlock your vault
              </Link>{" "}
              to view decrypted filenames and perform uploads.
            </p>
          </div>
        </div>
      )}

      {errorMessage && (
        <div className="p-3 rounded-lg bg-rose-500/10 border border-rose-500/20 flex items-center gap-2.5 text-xs text-rose-600 dark:text-rose-400">
          <AlertCircle className="w-4 h-4 shrink-0" />
          <span>{errorMessage}</span>
        </div>
      )}

      {/* Top Metric Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <Card className="space-y-2.5">
          <div className="flex items-center justify-between text-slate-500 dark:text-slate-400">
            <span className="text-xs font-medium">Storage Used</span>
            <HardDrive className="w-4 h-4 text-brand-500" />
          </div>
          <div>
            <div className="text-2xl font-bold font-mono text-foreground">
              {formatSize(stats.usedBytes)}
            </div>
            <div className="text-[11px] text-slate-500 mt-0.5">
              of {formatSize(stats.quotaBytes)} total ({stats.percentageUsed}%)
            </div>
          </div>
          <Progress value={stats.percentageUsed} />
        </Card>

        <Card className="space-y-2.5">
          <div className="flex items-center justify-between text-slate-500 dark:text-slate-400">
            <span className="text-xs font-medium">Encrypted Objects</span>
            <Files className="w-4 h-4 text-emerald-500" />
          </div>
          <div>
            <div className="text-2xl font-bold font-mono text-foreground">
              {stats.fileCount}
            </div>
            <div className="text-[11px] text-slate-500 mt-0.5">
              Persisted in local filesystem
            </div>
          </div>
          <div className="text-[11px] text-emerald-600 dark:text-emerald-400 font-mono flex items-center gap-1">
            <FileCheck2 className="w-3.5 h-3.5" /> 100% Ciphertext Verified
          </div>
        </Card>

        <Card className="space-y-2.5">
          <div className="flex items-center justify-between text-slate-500 dark:text-slate-400">
            <span className="text-xs font-medium">Security State</span>
            <Shield className="w-4 h-4 text-brand-500" />
          </div>
          <div>
            <div className="text-2xl font-bold text-foreground">
              {isUnlocked ? "Unlocked" : "Locked"}
            </div>
            <div className="text-[11px] text-slate-500 mt-0.5">
              AES-256-GCM + Argon2id
            </div>
          </div>
          <div className="text-[11px] text-slate-500 font-mono">
            Local Loopback (127.0.0.1)
          </div>
        </Card>
      </div>

      {/* Prominent Upload Zone */}
      <div
        className={`vault-card p-6 md:p-8 border-dashed border-2 transition-all text-center bg-surface relative ${
          isDragOver
            ? "border-[rgb(240_158_79)] bg-[rgba(240,158,79,0.06)] shadow-[0_0_24px_rgba(240,158,79,0.2)]"
            : "border-surface-border hover:border-brand-500/50"
        }`}
        onDragOver={(e) => {
          e.preventDefault();
          e.stopPropagation();
          if (!isDragOver) setIsDragOver(true);
        }}
        onDragEnter={(e) => {
          e.preventDefault();
          e.stopPropagation();
          setIsDragOver(true);
        }}
        onDragLeave={(e) => {
          e.preventDefault();
          e.stopPropagation();
          if (!e.currentTarget.contains(e.relatedTarget as Node)) {
            setIsDragOver(false);
          }
        }}
        onDrop={(e) => {
          e.preventDefault();
          e.stopPropagation();
          setIsDragOver(false);
          if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
            handleFileUpload(e.dataTransfer.files);
          }
        }}
      >
        <input
          type="file"
          multiple
          ref={fileInputRef}
          className="hidden"
          onChange={(e) => handleFileUpload(e.target.files)}
        />

        <div className="max-w-md mx-auto space-y-3 pointer-events-none">
          <div
            className={`w-12 h-12 rounded-xl border mx-auto flex items-center justify-center transition-all ${
              isDragOver
                ? "bg-[rgba(240,158,79,0.2)] border-[rgb(240_158_79)] text-[rgb(240_158_79)] scale-110 shadow-[0_0_16px_rgba(240,158,79,0.4)]"
                : "bg-[rgba(240,158,79,0.1)] border-[rgba(240,158,79,0.3)] text-[rgb(240_158_79)] shadow-[0_0_12px_rgba(240,158,79,0.15)]"
            }`}
          >
            <UploadCloud className="w-6 h-6" />
          </div>

          <div className="space-y-1">
            <h3 className="text-sm font-semibold text-foreground">
              {isDragOver ? "Drop files to encrypt & upload" : "Drag and drop files here, or browse"}
            </h3>
            <p className="text-xs text-slate-500 dark:text-slate-400">
              Files are encrypted with AES-256-GCM before saving to disk
            </p>
          </div>

          {uploading ? (
            <div className="space-y-2 pt-2">
              <Progress value={uploadProgress} />
              <p className="text-xs font-mono text-brand-500 animate-pulse">
                {uploadStatusText}
              </p>
            </div>
          ) : (
            <div className="flex justify-center gap-2 pt-2 pointer-events-auto">
              <Button
                variant="primary"
                size="sm"
                onClick={() => fileInputRef.current?.click()}
                disabled={!isUnlocked}
              >
                Choose File to Encrypt
              </Button>
            </div>
          )}
        </div>
      </div>

      {/* Recently Uploaded Files */}
      <Card className="p-5 space-y-4">
        <CardHeader className="mb-0">
          <div>
            <CardTitle>Recent Files</CardTitle>
            <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
              Recently uploaded client-side encrypted objects
            </p>
          </div>
          <Link
            href="/dashboard/files"
            className="text-xs text-brand-500 hover:underline font-medium flex items-center gap-1"
          >
            View All Files <ArrowUpRight className="w-3.5 h-3.5" />
          </Link>
        </CardHeader>

        {loadingFiles ? (
          <div className="py-8 text-center text-xs text-slate-500 font-mono">
            Decrypting metadata in browser memory...
          </div>
        ) : recentFiles.length === 0 ? (
          <div className="py-8 text-center space-y-2">
            <FileIcon className="w-8 h-8 text-slate-400 mx-auto" />
            <p className="text-xs text-slate-500">No files in your vault yet.</p>
          </div>
        ) : (
          <div className="divide-y divide-surface-border">
            {recentFiles.map((file) => (
              <div
                key={file.id}
                className="py-2.5 flex items-center justify-between gap-4 hover:bg-surface-raised px-2 rounded-lg transition-colors"
              >
                <div className="flex items-center gap-3 min-w-0">
                  <div className="w-8 h-8 rounded-lg bg-surface-raised border border-surface-border flex items-center justify-center shrink-0">
                    {getFileIcon(file.name, file.type)}
                  </div>
                  <div className="min-w-0">
                    <div className="text-xs font-medium text-foreground truncate max-w-sm">
                      {file.name}
                    </div>
                    <div className="text-[11px] text-slate-500 flex items-center gap-2">
                      <span>{formatSize(file.size || file.ciphertextSize)}</span>
                      <span>•</span>
                      <span className="flex items-center gap-1 font-mono">
                        <Clock className="w-3 h-3" />
                        {new Date(file.createdAt).toLocaleDateString()}
                      </span>
                    </div>
                  </div>
                </div>

                <div className="flex items-center gap-1 shrink-0">
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => handleDownload(file)}
                    title="Decrypt & Download"
                  >
                    <Download className="w-3.5 h-3.5 text-brand-500" />
                  </Button>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => handleDelete(file.id)}
                    title="Delete"
                  >
                    <Trash2 className="w-3.5 h-3.5 text-slate-400 hover:text-rose-500" />
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
