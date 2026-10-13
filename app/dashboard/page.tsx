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
  Film,
  Plus,
  FolderPlus,
  KeyRound,
  CheckCircle2,
  ExternalLink,
  X,
  Sparkles,
} from "lucide-react";
import { Card, CardTitle, CardHeader } from "../../components/ui/card";
import { Button } from "../../components/ui/button";
import { Badge } from "../../components/ui/badge";
import { Progress } from "../../components/ui/progress";
import { Dialog } from "../../components/ui/dialog";
import { useVault, DecryptedFileInfo } from "../../lib/crypto/vault-context";

interface CategoryStat {
  name: string;
  categoryKey: string;
  count: number;
  bytes: number;
  color: string;
  bgColor: string;
  icon: React.ReactNode;
}

export default function DashboardPage() {
  const {
    isUnlocked,
    prepareEncryptedUpload,
    decryptFileMetadataItem,
    decryptDownloadedFile,
    createEncryptedFolderPayload,
  } = useVault();

  const [stats, setStats] = useState({
    usedBytes: 0,
    quotaBytes: 5368709120, // 5 GB
    fileCount: 0,
    percentageUsed: 0,
  });

  const [userEmail, setUserEmail] = useState("");
  const [allFiles, setAllFiles] = useState<DecryptedFileInfo[]>([]);
  const [recentFiles, setRecentFiles] = useState<DecryptedFileInfo[]>([]);
  const [loadingFiles, setLoadingFiles] = useState(true);

  // Upload state
  const [uploading, setUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [uploadStatusText, setUploadStatusText] = useState("");
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [isDragOver, setIsDragOver] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // New folder modal
  const [isNewFolderOpen, setIsNewFolderOpen] = useState(false);
  const [newFolderName, setNewFolderName] = useState("");
  const [creatingFolder, setCreatingFolder] = useState(false);

  // Preview modal
  const [previewFile, setPreviewFile] = useState<DecryptedFileInfo | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [previewText, setPreviewText] = useState<string | null>(null);
  const [previewLoading, setPreviewLoading] = useState(false);

  const formatSize = (bytes: number) => {
    if (bytes === 0) return "0 B";
    const k = 1024;
    const sizes = ["B", "KB", "MB", "GB", "TB"];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + " " + sizes[i];
  };

  const getFileCategory = (filename: string, mimeType: string) => {
    const ext = filename.split(".").pop()?.toLowerCase() || "";
    if (
      ["png", "jpg", "jpeg", "gif", "webp", "svg", "bmp", "ico"].includes(ext) ||
      mimeType.startsWith("image/")
    ) {
      return "images";
    }
    if (
      ["pdf", "doc", "docx", "txt", "md", "rtf", "odt"].includes(ext) ||
      mimeType.includes("pdf") ||
      mimeType.includes("document") ||
      mimeType.includes("text")
    ) {
      return "documents";
    }
    if (
      ["mp4", "webm", "mov", "avi", "mkv", "mp3", "wav", "ogg", "flac"].includes(ext) ||
      mimeType.startsWith("video/") ||
      mimeType.startsWith("audio/")
    ) {
      return "media";
    }
    if (["zip", "tar", "gz", "7z", "rar", "bz2", "xz"].includes(ext)) {
      return "archives";
    }
    if (
      ["ts", "tsx", "js", "jsx", "py", "rs", "go", "json", "html", "css", "sql", "sh", "yaml", "yml"].includes(
        ext
      )
    ) {
      return "code";
    }
    return "others";
  };

  const getFileIcon = (filename: string, mimeType: string) => {
    const category = getFileCategory(filename, mimeType);
    switch (category) {
      case "images":
        return <ImageIcon className="w-4 h-4 text-purple-400 shrink-0" />;
      case "documents":
        return <FileText className="w-4 h-4 text-sky-400 shrink-0" />;
      case "media":
        return <Film className="w-4 h-4 text-rose-400 shrink-0" />;
      case "archives":
        return <Archive className="w-4 h-4 text-amber-400 shrink-0" />;
      case "code":
        return <FileCode className="w-4 h-4 text-emerald-400 shrink-0" />;
      default:
        return <FileIcon className="w-4 h-4 text-[rgb(240_158_79)] shrink-0" />;
    }
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
        const decryptedPromises = rawFiles.map((f: any) =>
          decryptFileMetadataItem(f)
        );
        const resolved = await Promise.all(decryptedPromises);
        setAllFiles(resolved);
        // Sort newest first
        const sorted = [...resolved].sort(
          (a, b) =>
            new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
        );
        setRecentFiles(sorted.slice(0, 6));
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

  // Compute category breakdown from decrypted files
  const categoryStats: CategoryStat[] = React.useMemo(() => {
    const categories: Record<
      string,
      { count: number; bytes: number }
    > = {
      documents: { count: 0, bytes: 0 },
      images: { count: 0, bytes: 0 },
      media: { count: 0, bytes: 0 },
      archives: { count: 0, bytes: 0 },
      code: { count: 0, bytes: 0 },
      others: { count: 0, bytes: 0 },
    };

    allFiles.forEach((file) => {
      const cat = getFileCategory(file.name, file.type);
      if (categories[cat]) {
        categories[cat].count += 1;
        categories[cat].bytes += file.size;
      } else {
        categories.others.count += 1;
        categories.others.bytes += file.size;
      }
    });

    return [
      {
        name: "Documents",
        categoryKey: "documents",
        count: categories.documents.count,
        bytes: categories.documents.bytes,
        color: "text-sky-400",
        bgColor: "bg-sky-500",
        icon: <FileText className="w-4 h-4 text-sky-400" />,
      },
      {
        name: "Images",
        categoryKey: "images",
        count: categories.images.count,
        bytes: categories.images.bytes,
        color: "text-purple-400",
        bgColor: "bg-purple-500",
        icon: <ImageIcon className="w-4 h-4 text-purple-400" />,
      },
      {
        name: "Media",
        categoryKey: "media",
        count: categories.media.count,
        bytes: categories.media.bytes,
        color: "text-rose-400",
        bgColor: "bg-rose-500",
        icon: <Film className="w-4 h-4 text-rose-400" />,
      },
      {
        name: "Archives",
        categoryKey: "archives",
        count: categories.archives.count,
        bytes: categories.archives.bytes,
        color: "text-amber-400",
        bgColor: "bg-amber-500",
        icon: <Archive className="w-4 h-4 text-amber-400" />,
      },
      {
        name: "Code",
        categoryKey: "code",
        count: categories.code.count,
        bytes: categories.code.bytes,
        color: "text-emerald-400",
        bgColor: "bg-emerald-500",
        icon: <FileCode className="w-4 h-4 text-emerald-400" />,
      },
      {
        name: "Other Files",
        categoryKey: "others",
        count: categories.others.count,
        bytes: categories.others.bytes,
        color: "text-[rgb(240_158_79)]",
        bgColor: "bg-[rgb(240_158_79)]",
        icon: <FileIcon className="w-4 h-4 text-[rgb(240_158_79)]" />,
      },
    ];
  }, [allFiles]);

  const totalCategorizedBytes = React.useMemo(() => {
    return categoryStats.reduce((sum, c) => sum + c.bytes, 0) || stats.usedBytes || 1;
  }, [categoryStats, stats.usedBytes]);

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
        setUploadStatusText(`Allocating secure block for ${file.name}...`);

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
        setUploadStatusText(`Transmitting ciphertext for ${file.name}...`);

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
    setUploadStatusText("All files encrypted and stored successfully!");
    await fetchDashboardData();

    setTimeout(() => {
      setUploading(false);
      setUploadProgress(0);
      setUploadStatusText("");
    }, 1200);
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

  const handlePreview = async (file: DecryptedFileInfo) => {
    if (!isUnlocked) {
      setErrorMessage("Please unlock your vault to preview decrypted content.");
      return;
    }

    setPreviewFile(file);
    setPreviewUrl(null);
    setPreviewText(null);
    setPreviewLoading(true);

    try {
      const res = await fetch(`/api/files/${file.id}/download`);
      if (!res.ok) throw new Error("Download failed");
      const ciphertext = await res.arrayBuffer();
      const { decryptedBlob, metadata } = await decryptDownloadedFile(file, ciphertext);

      const isImage = metadata.type.startsWith("image/");
      const isText =
        metadata.type.startsWith("text/") ||
        metadata.type.includes("json") ||
        metadata.type.includes("javascript") ||
        metadata.name.match(/\.(txt|md|json|js|ts|tsx|jsx|py|css|html|sh|yml|yaml|csv)$/i);

      if (isImage) {
        const url = URL.createObjectURL(decryptedBlob);
        setPreviewUrl(url);
      } else if (isText) {
        const text = await decryptedBlob.text();
        setPreviewText(text);
      }
    } catch (err: unknown) {
      setErrorMessage(err instanceof Error ? err.message : "Preview decryption error");
    } finally {
      setPreviewLoading(false);
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

  const handleCreateFolder = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newFolderName.trim() || !isUnlocked) return;
    setCreatingFolder(true);
    try {
      const payload = await createEncryptedFolderPayload(newFolderName.trim());
      const res = await fetch("/api/folders", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          encryptedFolderName: payload.encryptedFolderName,
          nameNonce: payload.nameNonce,
          parentFolderId: null,
        }),
      });
      if (res.ok) {
        setIsNewFolderOpen(false);
        setNewFolderName("");
      }
    } catch (err: unknown) {
      setErrorMessage(err instanceof Error ? err.message : "Folder creation failed");
    } finally {
      setCreatingFolder(false);
    }
  };

  const displayName = userEmail ? userEmail.split("@")[0] : "Vault User";

  return (
    <div className="max-w-6xl mx-auto space-y-6 pb-8">
      {/* Hidden File Picker */}
      <input
        type="file"
        multiple
        ref={fileInputRef}
        onChange={(e) => handleFileUpload(e.target.files)}
        className="hidden"
      />

      {/* Welcome Greeting Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-xl md:text-2xl font-bold tracking-tight text-foreground">
              Welcome back, {displayName}
            </h1>
            <Badge variant="success" className="hidden sm:inline-flex text-[10px] px-2 py-0.5">
              Verified Zero-Knowledge
            </Badge>
          </div>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5 flex items-center gap-1.5">
            <span>Private zero-knowledge cloud storage workspace</span>
            <span>•</span>
            <span className="font-mono text-[11px] text-[rgb(100_215_113)]">
              AES-256-GCM
            </span>
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2 sm:gap-2.5">
          {!isUnlocked ? (
            <Link href="/unlock">
              <Button
                variant="outline"
                size="sm"
                className="border-amber-500/40 text-amber-600 dark:text-amber-400 text-xs shadow-sm"
              >
                <Lock className="w-3.5 h-3.5 mr-1.5" /> Unlock Vault Keys
              </Button>
            </Link>
          ) : (
            <Badge variant="success" className="px-2.5 py-1 text-xs font-mono">
              <Unlock className="w-3.5 h-3.5 mr-1.5" /> Keys Active in Memory
            </Badge>
          )}

          <Button
            variant="secondary"
            size="sm"
            disabled={!isUnlocked}
            onClick={() => setIsNewFolderOpen(true)}
            className="text-xs"
          >
            <FolderPlus className="w-3.5 h-3.5 mr-1.5" /> New Folder
          </Button>

          <Button
            variant="primary"
            size="sm"
            disabled={!isUnlocked}
            onClick={() => fileInputRef.current?.click()}
            className="text-xs shadow-md"
          >
            <Plus className="w-3.5 h-3.5 mr-1.5" /> Upload Files
          </Button>
        </div>
      </div>

      {/* Warning if Vault is Locked */}
      {!isUnlocked && (
        <div className="p-4 rounded-2xl bg-amber-500/10 border border-amber-500/25 flex items-start gap-3.5 text-xs text-amber-700 dark:text-amber-300 backdrop-blur-md">
          <ShieldAlert className="w-5 h-5 shrink-0 text-amber-500 mt-0.5" />
          <div className="space-y-1">
            <p className="font-semibold text-sm">Vault Master Key Is Locked</p>
            <p className="text-slate-600 dark:text-slate-400">
              Your files and metadata are encrypted with zero-knowledge cryptography. Enter your vault passphrase to load your master key in browser memory and decrypt your files.
            </p>
            <div className="pt-1">
              <Link href="/unlock">
                <Button variant="primary" size="sm" className="text-xs py-1 px-3">
                  <KeyRound className="w-3.5 h-3.5 mr-1.5" /> Unlock Vault Now
                </Button>
              </Link>
            </div>
          </div>
        </div>
      )}

      {errorMessage && (
        <div className="p-3 rounded-xl bg-rose-500/10 border border-rose-500/25 flex items-center justify-between text-xs text-rose-600 dark:text-rose-400">
          <div className="flex items-center gap-2.5">
            <AlertCircle className="w-4 h-4 shrink-0 text-rose-500" />
            <span>{errorMessage}</span>
          </div>
          <button
            onClick={() => setErrorMessage(null)}
            className="text-slate-400 hover:text-foreground"
          >
            <X className="w-3.5 h-3.5" />
          </button>
        </div>
      )}

      {/* Top Telemetry Metric Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        {/* Storage Usage Card */}
        <Card className="space-y-3">
          <div className="flex items-center justify-between text-slate-500 dark:text-slate-400">
            <span className="text-xs font-semibold uppercase tracking-wider font-mono">
              Vault Storage
            </span>
            <div className="w-7 h-7 rounded-lg bg-[rgba(240,158,79,0.12)] border border-[rgba(240,158,79,0.3)] flex items-center justify-center text-[rgb(240_158_79)]">
              <HardDrive className="w-3.5 h-3.5" />
            </div>
          </div>
          <div>
            <div className="text-2xl font-bold font-mono text-foreground tracking-tight">
              {formatSize(stats.usedBytes)}
            </div>
            <div className="text-[11px] text-slate-500 font-mono mt-0.5">
              of {formatSize(stats.quotaBytes)} total quota ({stats.percentageUsed}%)
            </div>
          </div>
          <Progress value={stats.percentageUsed} max={100} />
        </Card>

        {/* Encrypted Files Card */}
        <Card className="space-y-3">
          <div className="flex items-center justify-between text-slate-500 dark:text-slate-400">
            <span className="text-xs font-semibold uppercase tracking-wider font-mono">
              Encrypted Objects
            </span>
            <div className="w-7 h-7 rounded-lg bg-[rgba(100,215,113,0.12)] border border-[rgba(100,215,113,0.3)] flex items-center justify-center text-[rgb(100_215_113)]">
              <Files className="w-3.5 h-3.5" />
            </div>
          </div>
          <div>
            <div className="text-2xl font-bold font-mono text-foreground tracking-tight">
              {stats.fileCount}
            </div>
            <div className="text-[11px] text-slate-500 font-mono mt-0.5">
              Ciphertext items persisted in vault
            </div>
          </div>
          <div className="text-[11px] text-[rgb(100_215_113)] font-mono flex items-center gap-1.5">
            <FileCheck2 className="w-3.5 h-3.5 shrink-0" />
            <span>100% Client-Side Encrypted</span>
          </div>
        </Card>

        {/* Cryptographic Security State */}
        <Card className="space-y-3">
          <div className="flex items-center justify-between text-slate-500 dark:text-slate-400">
            <span className="text-xs font-semibold uppercase tracking-wider font-mono">
              Security Protocol
            </span>
            <div className="w-7 h-7 rounded-lg bg-[rgba(240,158,79,0.12)] border border-[rgba(240,158,79,0.3)] flex items-center justify-center text-[rgb(240_158_79)]">
              <Shield className="w-3.5 h-3.5" />
            </div>
          </div>
          <div>
            <div className="text-2xl font-bold text-foreground tracking-tight flex items-center gap-2">
              {isUnlocked ? "Active" : "Locked"}
              <div
                className={`w-2.5 h-2.5 rounded-full ${
                  isUnlocked
                    ? "bg-[rgb(100_215_113)] animate-pulse"
                    : "bg-rose-500"
                }`}
              />
            </div>
            <div className="text-[11px] text-slate-500 font-mono mt-0.5">
              Argon2id KEK + AES-256-GCM
            </div>
          </div>
          <div className="text-[11px] text-slate-500 font-mono flex items-center justify-between">
            <span>Zero Server Knowledge</span>
            <span className="text-[rgb(240_158_79)]">Strict End-to-End</span>
          </div>
        </Card>
      </div>

      {/* Storage Breakdown by Category */}
      <Card className="p-5 space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-surface-border pb-3">
          <div>
            <h2 className="text-sm font-semibold text-foreground flex items-center gap-2">
              <Sparkles className="w-4 h-4 text-[rgb(240_158_79)]" />
              Storage Allocation by File Type
            </h2>
            <p className="text-[11px] text-slate-500 mt-0.5">
              Live breakdown computed from decrypted zero-knowledge metadata
            </p>
          </div>
          <Link
            href="/dashboard/files"
            className="text-xs font-medium text-[rgb(240_158_79)] hover:underline flex items-center gap-1 self-start sm:self-auto"
          >
            <span>Open File Manager</span>
            <ArrowUpRight className="w-3 h-3" />
          </Link>
        </div>

        {/* Proportional Segmented Storage Bar */}
        <div className="w-full bg-slate-200 dark:bg-zinc-800/80 rounded-full h-2.5 flex overflow-hidden p-0.5">
          {categoryStats.map((cat) => {
            const pct = Math.max(
              0,
              Math.min(100, (cat.bytes / totalCategorizedBytes) * 100)
            );
            if (pct <= 0) return null;
            return (
              <div
                key={cat.categoryKey}
                title={`${cat.name}: ${formatSize(cat.bytes)} (${pct.toFixed(1)}%)`}
                style={{ width: `${pct}%` }}
                className={`${cat.bgColor} h-full transition-all duration-300 first:rounded-l-full last:rounded-r-full`}
              />
            );
          })}
        </div>

        {/* Category Cards Grid */}
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-2.5 pt-1">
          {categoryStats.map((cat) => (
            <Link
              key={cat.categoryKey}
              href={`/dashboard/files?category=${cat.categoryKey}`}
              className="p-3 rounded-xl bg-surface-raised/70 hover:bg-surface-raised border border-surface-border hover:border-[rgba(240,158,79,0.3)] transition-all group"
            >
              <div className="flex items-center justify-between mb-2">
                <div className="p-1.5 rounded-lg bg-surface border border-surface-border group-hover:scale-105 transition-transform">
                  {cat.icon}
                </div>
                <span className="text-[10px] font-mono font-semibold text-slate-500">
                  {cat.count} {cat.count === 1 ? "file" : "files"}
                </span>
              </div>
              <div className="text-xs font-semibold text-foreground truncate">
                {cat.name}
              </div>
              <div className="text-[11px] font-mono text-slate-500 mt-0.5">
                {formatSize(cat.bytes)}
              </div>
            </Link>
          ))}
        </div>
      </Card>

      {/* Prominent Upload Zone */}
      <div
        className={`vault-card p-6 md:p-8 border-dashed border-2 transition-all text-center bg-surface relative rounded-2xl ${
          isDragOver
            ? "border-[rgb(240_158_79)] bg-[rgba(240,158,79,0.06)] shadow-[0_0_24px_rgba(240,158,79,0.2)]"
            : "border-surface-border hover:border-[rgba(240,158,79,0.4)]"
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
        <div className="max-w-md mx-auto space-y-3 pointer-events-none">
          <div className="w-12 h-12 rounded-2xl bg-[rgba(240,158,79,0.12)] border border-[rgba(240,158,79,0.35)] flex items-center justify-center mx-auto text-[rgb(240_158_79)] shadow-sm">
            <UploadCloud className="w-6 h-6 animate-pulse" />
          </div>
          <div>
            <h3 className="text-sm font-semibold text-foreground">
              {isDragOver
                ? "Drop your files here to encrypt & store"
                : "Drag & drop files here to encrypt"}
            </h3>
            <p className="text-xs text-slate-500 dark:text-slate-400 mt-1 max-w-sm mx-auto">
              Every file is encrypted in your browser with a unique AES-256-GCM key before upload. The server never reads raw contents.
            </p>
          </div>
          <div className="pt-1 pointer-events-auto">
            <Button
              variant="secondary"
              size="sm"
              disabled={!isUnlocked || uploading}
              onClick={() => fileInputRef.current?.click()}
              className="text-xs border-[rgba(240,158,79,0.3)] hover:border-[rgb(240_158_79)] text-foreground"
            >
              Browse Local Files
            </Button>
          </div>
        </div>

        {uploading && (
          <div className="absolute inset-0 z-20 bg-background/95 backdrop-blur-md rounded-2xl flex flex-col items-center justify-center p-6 space-y-3 animate-in fade-in duration-150">
            <div className="w-6 h-6 border-2 border-[rgb(240_158_79)] border-t-transparent rounded-full animate-spin" />
            <div className="space-y-1 text-center max-w-xs w-full">
              <p className="text-xs font-semibold text-foreground font-mono">
                {uploadStatusText}
              </p>
              <Progress value={uploadProgress} max={100} />
              <p className="text-[10px] text-slate-500 font-mono">
                {uploadProgress}% Encrypted & Transferred
              </p>
            </div>
          </div>
        )}
      </div>

      {/* Recent Files Table / List */}
      <Card className="p-5 space-y-4">
        <div className="flex items-center justify-between border-b border-surface-border pb-3">
          <div className="flex items-center gap-2">
            <Clock className="w-4 h-4 text-[rgb(240_158_79)]" />
            <h2 className="text-sm font-semibold text-foreground">
              Recent Vault Uploads
            </h2>
          </div>
          <Link
            href="/dashboard/files"
            className="text-xs font-medium text-[rgb(240_158_79)] hover:underline flex items-center gap-1"
          >
            <span>View All ({allFiles.length})</span>
            <ArrowUpRight className="w-3 h-3" />
          </Link>
        </div>

        {loadingFiles ? (
          <div className="py-12 flex flex-col items-center justify-center text-slate-400 space-y-3">
            <div className="w-6 h-6 border-2 border-[rgb(240_158_79)] border-t-transparent rounded-full animate-spin" />
            <span className="text-xs font-mono text-slate-500">
              Decrypting file metadata in browser memory...
            </span>
          </div>
        ) : recentFiles.length === 0 ? (
          <div className="py-12 text-center space-y-3">
            <div className="w-12 h-12 rounded-2xl bg-surface-raised border border-surface-border flex items-center justify-center mx-auto text-slate-400">
              <Files className="w-6 h-6" />
            </div>
            <div>
              <p className="text-sm font-medium text-foreground">
                No files in your encrypted vault yet
              </p>
              <p className="text-xs text-slate-500 max-w-sm mx-auto mt-1">
                Upload your first file above to experience zero-knowledge AES-256-GCM encryption with complete data sovereignty.
              </p>
            </div>
            <div className="pt-2">
              <Button
                variant="primary"
                size="sm"
                disabled={!isUnlocked}
                onClick={() => fileInputRef.current?.click()}
                className="text-xs"
              >
                <Plus className="w-3.5 h-3.5 mr-1" /> Upload First File
              </Button>
            </div>
          </div>
        ) : (
          <div className="divide-y divide-surface-border overflow-x-auto">
            {recentFiles.map((file) => (
              <div
                key={file.id}
                className="py-3 px-2 flex items-center justify-between gap-3 hover:bg-surface-raised/60 rounded-xl transition-colors group"
              >
                <div className="flex items-center gap-3 min-w-0">
                  <div className="p-2 rounded-xl bg-surface border border-surface-border shrink-0">
                    {getFileIcon(file.name, file.type)}
                  </div>
                  <div className="min-w-0">
                    <p className="text-xs font-medium text-foreground truncate max-w-xs sm:max-w-md">
                      {file.name}
                    </p>
                    <div className="flex items-center gap-2 text-[11px] text-slate-500 font-mono mt-0.5">
                      <span>{formatSize(file.size)}</span>
                      <span>•</span>
                      <span>
                        {new Date(file.createdAt).toLocaleDateString(undefined, {
                          month: "short",
                          day: "numeric",
                          year: "numeric",
                        })}
                      </span>
                      <span>•</span>
                      <span className="text-[rgb(100_215_113)] hidden sm:inline">
                        AES-256-GCM
                      </span>
                    </div>
                  </div>
                </div>

                <div className="flex items-center gap-1 shrink-0">
                  <button
                    onClick={() => handlePreview(file)}
                    title="In-browser decrypted preview"
                    className="p-1.5 rounded-lg text-slate-500 hover:text-foreground hover:bg-surface-raised transition-colors"
                  >
                    <Eye className="w-4 h-4" />
                  </button>
                  <button
                    onClick={() => handleDownload(file)}
                    title="Decrypt and Download"
                    className="p-1.5 rounded-lg text-slate-500 hover:text-[rgb(240_158_79)] hover:bg-surface-raised transition-colors"
                  >
                    <Download className="w-4 h-4" />
                  </button>
                  <button
                    onClick={() => handleDelete(file.id)}
                    title="Delete permanently"
                    className="p-1.5 rounded-lg text-slate-500 hover:text-rose-500 hover:bg-surface-raised transition-colors"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </Card>

      {/* New Folder Modal */}
      <Dialog
        isOpen={isNewFolderOpen}
        onClose={() => setIsNewFolderOpen(false)}
        title="Create Encrypted Folder"
      >
        <form onSubmit={handleCreateFolder} className="space-y-4 pt-2">
          <p className="text-xs text-slate-500 dark:text-slate-400">
            Folder names are encrypted client-side with fresh nonces so the server cannot read your directory structure.
          </p>
          <div className="space-y-1.5">
            <label className="text-xs font-medium text-foreground">
              Folder Name
            </label>
            <input
              type="text"
              required
              autoFocus
              placeholder="e.g. Financial Documents"
              value={newFolderName}
              onChange={(e) => setNewFolderName(e.target.value)}
              className="w-full bg-surface border border-surface-border text-foreground text-sm rounded-xl px-3.5 py-2.5 focus:outline-none focus:ring-2 focus:ring-[rgb(240_158_79)]"
            />
          </div>
          <div className="flex justify-end gap-2 pt-2">
            <Button
              type="button"
              variant="ghost"
              size="sm"
              onClick={() => setIsNewFolderOpen(false)}
            >
              Cancel
            </Button>
            <Button
              type="submit"
              variant="primary"
              size="sm"
              isLoading={creatingFolder}
            >
              Create Folder
            </Button>
          </div>
        </form>
      </Dialog>

      {/* Preview Modal */}
      <Dialog
        isOpen={!!previewFile}
        onClose={() => {
          if (previewUrl) URL.revokeObjectURL(previewUrl);
          setPreviewFile(null);
          setPreviewUrl(null);
          setPreviewText(null);
        }}
        title={previewFile?.name || "File Preview"}
      >
        <div className="space-y-4 pt-2">
          {previewLoading ? (
            <div className="py-16 flex flex-col items-center justify-center text-slate-400 space-y-3">
              <div className="w-6 h-6 border-2 border-[rgb(240_158_79)] border-t-transparent rounded-full animate-spin" />
              <p className="text-xs font-mono text-slate-500">
                Downloading ciphertext and decrypting in browser...
              </p>
            </div>
          ) : previewUrl ? (
            <div className="rounded-xl overflow-hidden border border-surface-border bg-black/40 flex items-center justify-center max-h-[60vh]">
              <img
                src={previewUrl}
                alt={previewFile?.name}
                className="max-h-[60vh] max-w-full object-contain"
              />
            </div>
          ) : previewText !== null ? (
            <div className="rounded-xl overflow-hidden border border-surface-border bg-surface-raised p-3.5 max-h-[60vh] overflow-y-auto">
              <pre className="text-xs font-mono text-foreground whitespace-pre-wrap font-sans">
                {previewText}
              </pre>
            </div>
          ) : (
            <div className="py-12 text-center space-y-2">
              <div className="w-12 h-12 rounded-xl bg-surface-raised border border-surface-border flex items-center justify-center mx-auto text-slate-400">
                <FileIcon className="w-6 h-6" />
              </div>
              <p className="text-xs font-medium text-foreground">
                In-browser preview is not available for this binary file format.
              </p>
              <p className="text-[11px] text-slate-500">
                You can download and decrypt the original file directly.
              </p>
            </div>
          )}

          {previewFile && (
            <div className="p-3 rounded-xl bg-surface-raised border border-surface-border text-[11px] font-mono space-y-1 text-slate-500">
              <div className="flex justify-between">
                <span>File Size:</span>
                <span className="text-foreground">{formatSize(previewFile.size)}</span>
              </div>
              <div className="flex justify-between">
                <span>Encryption:</span>
                <span className="text-[rgb(100_215_113)]">AES-256-GCM (Authenticated)</span>
              </div>
              <div className="flex justify-between">
                <span>MIME Type:</span>
                <span className="text-foreground truncate max-w-[200px]">
                  {previewFile.type || "application/octet-stream"}
                </span>
              </div>
            </div>
          )}

          <div className="flex justify-end gap-2 pt-2 border-t border-surface-border">
            {previewFile && (
              <Button
                variant="primary"
                size="sm"
                onClick={() => {
                  if (previewFile) handleDownload(previewFile);
                }}
              >
                <Download className="w-3.5 h-3.5 mr-1.5" /> Decrypt & Download
              </Button>
            )}
          </div>
        </div>
      </Dialog>
    </div>
  );
}
