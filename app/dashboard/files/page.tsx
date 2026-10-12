"use client";

import React, { useEffect, useState, useCallback, useMemo, useRef } from "react";
import Link from "next/link";
import {
  Folder,
  FolderPlus,
  Upload,
  Download,
  Trash2,
  Edit2,
  MoveRight,
  Search,
  Grid,
  List,
  File as FileIcon,
  ChevronRight,
  ArrowUpDown,
  Lock,
  Info,
  CheckCircle2,
  FileText,
  FileCode,
  Image as ImageIcon,
  Archive,
  FileSpreadsheet,
  Eye,
  X,
  Share2,
} from "lucide-react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Dialog } from "@/components/ui/dialog";
import { Progress } from "@/components/ui/progress";
import {
  useVault,
  DecryptedFileInfo,
  DecryptedFolderInfo,
} from "@/lib/crypto/vault-context";

export default function FilesPage() {
  const {
    isUnlocked,
    prepareEncryptedUpload,
    decryptFileMetadataItem,
    decryptFolderItem,
    decryptDownloadedFile,
    createEncryptedFolderPayload,
    createEncryptedFileRenamePayload,
  } = useVault();

  // Navigation state
  const [currentFolderId, setCurrentFolderId] = useState<string | null>(null);
  const [folderBreadcrumbs, setFolderBreadcrumbs] = useState<
    Array<{ id: string | null; name: string }>
  >([{ id: null, name: "Root Vault" }]);

  // Data state
  const [folders, setFolders] = useState<DecryptedFolderInfo[]>([]);
  const [files, setFiles] = useState<DecryptedFileInfo[]>([]);
  const [loading, setLoading] = useState(true);

  // Search & View state
  const [searchQuery, setSearchQuery] = useState("");
  const [viewMode, setViewMode] = useState<"list" | "grid">("list");
  const [sortBy, setSortBy] = useState<"name" | "size" | "date">("name");
  const [sortOrder, setSortOrder] = useState<"asc" | "desc">("asc");

  // Upload state
  const [uploading, setUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [uploadStatus, setUploadStatus] = useState("");
  const [isDragOver, setIsDragOver] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Modals state
  const [isCreateFolderOpen, setIsCreateFolderOpen] = useState(false);
  const [newFolderName, setNewFolderName] = useState("");

  const [activeFileDetails, setActiveFileDetails] = useState<DecryptedFileInfo | null>(null);
  const [renameTarget, setRenameTarget] = useState<DecryptedFileInfo | null>(null);
  const [newRenameValue, setNewRenameValue] = useState("");

  const [moveTarget, setMoveTarget] = useState<DecryptedFileInfo | null>(null);
  const [selectedDestinationFolder, setSelectedDestinationFolder] = useState<string>("root");

  // In-browser Preview State
  const [previewTarget, setPreviewTarget] = useState<DecryptedFileInfo | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [previewTextContent, setPreviewTextContent] = useState<string | null>(null);
  const [previewLoading, setPreviewLoading] = useState(false);

  // Sharing Dialog State
  const [shareTarget, setShareTarget] = useState<DecryptedFileInfo | null>(null);
  const [copiedShare, setCopiedShare] = useState(false);

  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const formatSize = (bytes: number) => {
    if (bytes === 0) return "0 B";
    const k = 1024;
    const sizes = ["B", "KB", "MB", "GB"];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + " " + sizes[i];
  };

  const getFileTypeIcon = (filename: string, mimeType: string) => {
    const ext = filename.split(".").pop()?.toLowerCase();
    if (["png", "jpg", "jpeg", "gif", "webp", "svg"].includes(ext || "") || mimeType.startsWith("image/")) {
      return <ImageIcon className="w-4 h-4 text-purple-500 shrink-0" />;
    }
    if (["ts", "tsx", "js", "jsx", "py", "rs", "go", "json", "html", "css", "sql"].includes(ext || "")) {
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

  const fetchFolderContent = useCallback(async () => {
    setLoading(true);
    try {
      const folderParam = currentFolderId ? `?folderId=${currentFolderId}` : "?folderId=root";
      const parentParam = currentFolderId
        ? `?parentFolderId=${currentFolderId}`
        : "?parentFolderId=root";

      const [filesRes, foldersRes] = await Promise.all([
        fetch(`/api/files${folderParam}`),
        fetch(`/api/folders${parentParam}`),
      ]);

      if (filesRes.ok && foldersRes.ok) {
        const fData = await filesRes.json();
        const foldData = await foldersRes.json();

        const decFiles = await Promise.all(
          (fData.files || []).map((f: any) => decryptFileMetadataItem(f))
        );

        const decFolders = await Promise.all(
          (foldData.folders || []).map((fd: any) => decryptFolderItem(fd))
        );

        setFiles(decFiles);
        setFolders(decFolders);
      }
    } catch {
      // ignore
    } finally {
      setLoading(false);
    }
  }, [currentFolderId, decryptFileMetadataItem, decryptFolderItem]);

  useEffect(() => {
    fetchFolderContent();
  }, [fetchFolderContent, isUnlocked]);

  const handleCreateFolder = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newFolderName.trim()) return;

    try {
      const payload = await createEncryptedFolderPayload(newFolderName.trim());
      const res = await fetch("/api/folders", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          encryptedFolderName: payload.encryptedFolderName,
          nameNonce: payload.nameNonce,
          parentFolderId: currentFolderId,
        }),
      });

      if (!res.ok) throw new Error("Failed to create folder");

      setIsCreateFolderOpen(false);
      setNewFolderName("");
      await fetchFolderContent();
    } catch (err: unknown) {
      setErrorMessage(err instanceof Error ? err.message : "Folder creation failed");
    }
  };

  const handleFilesUpload = async (fileList: FileList | null) => {
    if (!fileList || fileList.length === 0) return;
    if (!isUnlocked) {
      setErrorMessage("Please unlock your vault before uploading files.");
      return;
    }

    setUploading(true);
    setErrorMessage(null);

    const filesArray = Array.from(fileList);
    for (let i = 0; i < filesArray.length; i++) {
      const file = filesArray[i];
      setUploadStatus(`Encrypting ${file.name} (${i + 1}/${filesArray.length})...`);
      setUploadProgress(Math.round(((i * 2 + 1) / (filesArray.length * 2)) * 100));

      try {
        const encryptedData = await prepareEncryptedUpload(file, currentFolderId);

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
            folderId: currentFolderId,
          }),
        });

        if (!initRes.ok) {
          const err = await initRes.json();
          throw new Error(err.error || "Failed to initiate upload");
        }

        const { fileId } = await initRes.json();
        setUploadStatus(`Saving ciphertext for ${file.name}...`);

        const uploadRes = await fetch(`/api/files/upload/${fileId}`, {
          method: "POST",
          headers: { "Content-Type": "application/octet-stream" },
          body: new Blob([encryptedData.ciphertext as any]),
        });

        if (!uploadRes.ok) {
          throw new Error(`Failed to upload ${file.name}`);
        }
      } catch (err: unknown) {
        setErrorMessage(err instanceof Error ? err.message : "Upload error");
        break;
      }
    }

    setUploadProgress(100);
    setUploadStatus("Upload complete!");
    setTimeout(() => {
      setUploading(false);
      setUploadProgress(0);
      setUploadStatus("");
      fetchFolderContent();
    }, 1000);
  };

  const handleDownload = async (file: DecryptedFileInfo) => {
    try {
      const res = await fetch(`/api/files/${file.id}/download`);
      if (!res.ok) throw new Error("Download request failed");

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
      setErrorMessage(err instanceof Error ? err.message : "Decryption failed");
    }
  };

  const handlePreview = async (file: DecryptedFileInfo) => {
    if (!isUnlocked) {
      setErrorMessage("Please unlock your vault before previewing files.");
      return;
    }

    setPreviewTarget(file);
    setPreviewLoading(true);
    setPreviewUrl(null);
    setPreviewTextContent(null);

    try {
      const res = await fetch(`/api/files/${file.id}/download`);
      if (!res.ok) throw new Error("Failed to download file for preview");

      const ciphertext = await res.arrayBuffer();
      const { decryptedBlob } = await decryptDownloadedFile(file, ciphertext);

      const ext = file.name.split(".").pop()?.toLowerCase();
      const isImg = ["png", "jpg", "jpeg", "gif", "webp", "svg"].includes(ext || "") || file.type.startsWith("image/");
      const isTxt = ["txt", "md", "json", "js", "ts", "tsx", "html", "css", "py"].includes(ext || "") || file.type.startsWith("text/");

      if (isImg) {
        const url = URL.createObjectURL(decryptedBlob);
        setPreviewUrl(url);
      } else if (isTxt) {
        const text = await decryptedBlob.text();
        setPreviewTextContent(text);
      }
    } catch (err: unknown) {
      setErrorMessage(err instanceof Error ? err.message : "Preview generation failed");
    } finally {
      setPreviewLoading(false);
    }
  };

  const closePreview = () => {
    if (previewUrl) {
      URL.revokeObjectURL(previewUrl);
    }
    setPreviewTarget(null);
    setPreviewUrl(null);
    setPreviewTextContent(null);
  };

  const handleDeleteFile = async (id: string) => {
    if (!confirm("Are you sure you want to permanently delete this encrypted file?")) return;
    try {
      const res = await fetch(`/api/files/${id}`, { method: "DELETE" });
      if (res.ok) await fetchFolderContent();
    } catch {
      // ignore
    }
  };

  const handleDeleteFolder = async (id: string) => {
    if (!confirm("Are you sure you want to delete this folder?")) return;
    try {
      const res = await fetch(`/api/folders/${id}`, { method: "DELETE" });
      if (res.ok) await fetchFolderContent();
    } catch {
      // ignore
    }
  };

  const handleRenameSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!renameTarget || !newRenameValue.trim()) return;

    try {
      const payload = await createEncryptedFileRenamePayload(renameTarget, newRenameValue.trim());
      const res = await fetch(`/api/files/${renameTarget.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          encryptedMetadata: payload.encryptedMetadata,
          metadataNonce: payload.metadataNonce,
        }),
      });

      if (res.ok) {
        setRenameTarget(null);
        setNewRenameValue("");
        await fetchFolderContent();
      }
    } catch (err: unknown) {
      setErrorMessage(err instanceof Error ? err.message : "Rename failed");
    }
  };

  const handleMoveFile = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!moveTarget) return;

    try {
      const destination = selectedDestinationFolder === "root" ? null : selectedDestinationFolder;
      const res = await fetch(`/api/files/${moveTarget.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ folderId: destination }),
      });

      if (res.ok) {
        setMoveTarget(null);
        await fetchFolderContent();
      }
    } catch {
      // ignore
    }
  };

  const copyShareLink = () => {
    if (!shareTarget) return;
    const url = `${window.location.origin}/dashboard/files?focus=${shareTarget.id}`;
    navigator.clipboard.writeText(url);
    setCopiedShare(true);
    setTimeout(() => setCopiedShare(false), 2000);
  };

  // Filter & Sort
  const filteredFiles = useMemo(() => {
    let result = [...files];
    if (searchQuery.trim()) {
      const query = searchQuery.toLowerCase();
      result = result.filter((f) => f.name.toLowerCase().includes(query));
    }
    result.sort((a, b) => {
      let comparison = 0;
      if (sortBy === "name") comparison = a.name.localeCompare(b.name);
      else if (sortBy === "size") comparison = a.size - b.size;
      else if (sortBy === "date")
        comparison = new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime();

      return sortOrder === "asc" ? comparison : -comparison;
    });
    return result;
  }, [files, searchQuery, sortBy, sortOrder]);

  const enterFolder = (folder: DecryptedFolderInfo) => {
    setCurrentFolderId(folder.id);
    setFolderBreadcrumbs((prev) => [...prev, { id: folder.id, name: folder.name }]);
  };

  const navigateBreadcrumb = (index: number) => {
    const target = folderBreadcrumbs[index];
    setCurrentFolderId(target.id);
    setFolderBreadcrumbs((prev) => prev.slice(0, index + 1));
  };

  return (
    <div
      className="max-w-6xl mx-auto space-y-5 relative min-h-[calc(100vh-8rem)]"
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
          handleFilesUpload(e.dataTransfer.files);
        }
      }}
    >
      {/* Full-view Drag & Drop Overlay */}
      {isDragOver && (
        <div className="absolute inset-0 z-50 rounded-2xl bg-background/85 backdrop-blur-md border-2 border-dashed border-[rgb(240_158_79)] flex flex-col items-center justify-center pointer-events-none p-6 text-center animate-in fade-in-50 duration-200 shadow-[0_0_32px_rgba(240,158,79,0.25)]">
          <div className="w-16 h-16 rounded-2xl bg-[rgba(240,158,79,0.15)] border border-[rgb(240_158_79)] text-[rgb(240_158_79)] flex items-center justify-center mb-4 shadow-[0_0_20px_rgba(240,158,79,0.3)] animate-bounce">
            <Upload className="w-8 h-8" />
          </div>
          <h2 className="text-xl font-bold text-foreground tracking-tight mb-1">
            Drop files to encrypt & store in this folder
          </h2>
          <p className="text-xs text-slate-500 dark:text-slate-400 font-mono max-w-sm">
            {isUnlocked
              ? "AES-256-GCM browser encryption will run immediately for each file"
              : "Vault locked — unlock vault before dropping files to encrypt"}
          </p>
        </div>
      )}

      {/* Header with Breadcrumbs & Actions */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-3">
        <div>
          <h1 className="text-xl md:text-2xl font-bold tracking-tight text-foreground">
            My Files
          </h1>
          {/* Breadcrumb Trail */}
          <div className="flex items-center gap-1.5 text-xs text-slate-500 mt-0.5">
            {folderBreadcrumbs.map((bc, idx) => (
              <React.Fragment key={bc.id || "root"}>
                {idx > 0 && <ChevronRight className="w-3 h-3 text-slate-400" />}
                <button
                  onClick={() => navigateBreadcrumb(idx)}
                  className={`hover:text-foreground transition-colors ${
                    idx === folderBreadcrumbs.length - 1 ? "font-semibold text-foreground" : ""
                  }`}
                >
                  {bc.name}
                </button>
              </React.Fragment>
            ))}
          </div>
        </div>

        <div className="flex items-center gap-2">
          <input
            type="file"
            multiple
            ref={fileInputRef}
            className="hidden"
            onChange={(e) => handleFilesUpload(e.target.files)}
          />
          <Button
            variant="secondary"
            size="sm"
            disabled={!isUnlocked}
            onClick={() => setIsCreateFolderOpen(true)}
          >
            <FolderPlus className="w-3.5 h-3.5 mr-1 text-brand-500" /> New Folder
          </Button>

          <Button
            variant="primary"
            size="sm"
            disabled={!isUnlocked}
            onClick={() => fileInputRef.current?.click()}
          >
            <Upload className="w-3.5 h-3.5 mr-1" /> Upload Files
          </Button>
        </div>
      </div>

      {errorMessage && (
        <div className="p-3 rounded-lg bg-rose-500/10 border border-rose-500/20 text-xs text-rose-600 dark:text-rose-400">
          {errorMessage}
        </div>
      )}

      {/* Upload Progress Bar if active */}
      {uploading && (
        <div className="vault-card p-4 space-y-2 bg-surface">
          <div className="flex items-center justify-between text-xs font-mono text-brand-500">
            <span>{uploadStatus}</span>
            <span>{uploadProgress}%</span>
          </div>
          <Progress value={uploadProgress} />
        </div>
      )}

      {/* Filter and View Controls Toolbar */}
      <div className="flex flex-col sm:flex-row items-center justify-between gap-3 bg-surface p-2.5 rounded-xl border border-surface-border">
        <div className="relative w-full sm:w-72">
          <Search className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
          <input
            type="text"
            placeholder="Search decrypted files..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full bg-surface-raised border border-surface-border rounded-lg pl-9 pr-3 py-1.5 text-xs text-foreground placeholder-slate-400 focus:outline-none focus:border-brand-500"
          />
        </div>

        <div className="flex items-center gap-2 self-end sm:self-auto">
          {/* Sort Dropdown */}
          <div className="flex items-center gap-1 bg-surface-raised border border-surface-border rounded-lg px-2 py-1 text-xs text-slate-500">
            <ArrowUpDown className="w-3 h-3 mr-0.5" />
            <select
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value as any)}
              className="bg-transparent text-foreground focus:outline-none cursor-pointer text-xs"
            >
              <option value="name" className="bg-surface">Name</option>
              <option value="size" className="bg-surface">Size</option>
              <option value="date" className="bg-surface">Date</option>
            </select>
            <button
              onClick={() => setSortOrder(sortOrder === "asc" ? "desc" : "asc")}
              className="ml-1 text-[10px] font-mono hover:text-foreground"
            >
              {sortOrder.toUpperCase()}
            </button>
          </div>

          {/* View Toggle */}
          <div className="flex items-center bg-surface-raised border border-surface-border rounded-lg p-0.5">
            <button
              onClick={() => setViewMode("list")}
              className={`p-1 rounded ${viewMode === "list" ? "bg-surface text-brand-500 shadow-sm" : "text-slate-400 hover:text-foreground"}`}
              title="List view"
            >
              <List className="w-3.5 h-3.5" />
            </button>
            <button
              onClick={() => setViewMode("grid")}
              className={`p-1 rounded ${viewMode === "grid" ? "bg-surface text-brand-500 shadow-sm" : "text-slate-400 hover:text-foreground"}`}
              title="Grid view"
            >
              <Grid className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>
      </div>

      {/* Folders Section */}
      {folders.length > 0 && (
        <div className="space-y-2">
          <h2 className="text-xs font-semibold uppercase tracking-wider text-slate-400">
            Folders
          </h2>
          <div className="grid grid-cols-2 sm:grid-cols-4 md:grid-cols-6 gap-3">
            {folders.map((folder) => (
              <div
                key={folder.id}
                className="group vault-card bg-surface p-3 flex items-center justify-between cursor-pointer transition-all hover:border-brand-500/40"
                onClick={() => enterFolder(folder)}
              >
                <div className="flex items-center gap-2 min-w-0">
                  <Folder className="w-4 h-4 text-brand-500 shrink-0" />
                  <span className="text-xs font-medium text-foreground truncate">
                    {folder.name}
                  </span>
                </div>
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    handleDeleteFolder(folder.id);
                  }}
                  className="opacity-0 group-hover:opacity-100 p-1 text-slate-400 hover:text-rose-500 transition-opacity"
                  title="Delete folder"
                >
                  <Trash2 className="w-3 h-3" />
                </button>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Files Section */}
      <div className="space-y-2">
        <div className="flex items-center justify-between">
          <h2 className="text-xs font-semibold uppercase tracking-wider text-slate-400">
            Files ({filteredFiles.length})
          </h2>
        </div>

        {loading ? (
          <div className="py-12 text-center text-xs text-slate-500 font-mono">
            Loading and decrypting metadata envelopes...
          </div>
        ) : filteredFiles.length === 0 ? (
          <Card className="py-16 text-center space-y-3">
            <FileIcon className="w-10 h-10 text-slate-400 mx-auto" />
            <p className="text-sm text-slate-500">No encrypted files in this folder.</p>
            <Button
              variant="outline"
              size="sm"
              disabled={!isUnlocked}
              onClick={() => fileInputRef.current?.click()}
            >
              Upload Encrypted File
            </Button>
          </Card>
        ) : viewMode === "list" ? (
          /* LIST VIEW */
          <Card className="overflow-hidden p-0">
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs text-slate-600 dark:text-slate-300">
                <thead className="bg-surface-raised text-slate-500 border-b border-surface-border text-[11px] font-medium">
                  <tr>
                    <th className="px-4 py-2.5">Name</th>
                    <th className="px-4 py-2.5">Size</th>
                    <th className="px-4 py-2.5">Type</th>
                    <th className="px-4 py-2.5">Created</th>
                    <th className="px-4 py-2.5 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-surface-border">
                  {filteredFiles.map((file) => (
                    <tr key={file.id} className="hover:bg-surface-raised transition-colors group">
                      <td className="px-4 py-2.5 font-medium text-foreground flex items-center gap-2.5">
                        {getFileTypeIcon(file.name, file.type)}
                        <span className="truncate max-w-xs">{file.name}</span>
                      </td>
                      <td className="px-4 py-2.5 font-mono text-slate-500">
                        {formatSize(file.size || file.ciphertextSize)}
                      </td>
                      <td className="px-4 py-2.5 text-slate-500 font-mono text-[11px] truncate max-w-[120px]">
                        {file.type}
                      </td>
                      <td className="px-4 py-2.5 text-slate-500 text-[11px]">
                        {new Date(file.createdAt).toLocaleDateString()}
                      </td>
                      <td className="px-4 py-2.5 text-right">
                        <div className="flex items-center justify-end gap-1">
                          <button
                            onClick={() => handlePreview(file)}
                            className="p-1 text-slate-400 hover:text-brand-500 transition-colors"
                            title="Preview file"
                          >
                            <Eye className="w-3.5 h-3.5" />
                          </button>
                          <button
                            onClick={() => handleDownload(file)}
                            className="p-1 text-slate-400 hover:text-brand-500 transition-colors"
                            title="Download decrypted file"
                          >
                            <Download className="w-3.5 h-3.5" />
                          </button>
                          <button
                            onClick={() => {
                              setRenameTarget(file);
                              setNewRenameValue(file.name);
                            }}
                            className="p-1 text-slate-400 hover:text-foreground transition-colors"
                            title="Rename"
                          >
                            <Edit2 className="w-3.5 h-3.5" />
                          </button>
                          <button
                            onClick={() => setMoveTarget(file)}
                            className="p-1 text-slate-400 hover:text-foreground transition-colors"
                            title="Move to folder"
                          >
                            <MoveRight className="w-3.5 h-3.5" />
                          </button>
                          <button
                            onClick={() => setShareTarget(file)}
                            className="p-1 text-slate-400 hover:text-brand-500 transition-colors"
                            title="Share"
                          >
                            <Share2 className="w-3.5 h-3.5" />
                          </button>
                          <button
                            onClick={() => setActiveFileDetails(file)}
                            className="p-1 text-slate-400 hover:text-sky-500 transition-colors"
                            title="Cryptographic info"
                          >
                            <Info className="w-3.5 h-3.5" />
                          </button>
                          <button
                            onClick={() => handleDeleteFile(file.id)}
                            className="p-1 text-slate-400 hover:text-rose-500 transition-colors"
                            title="Delete"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </Card>
        ) : (
          /* GRID VIEW */
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3">
            {filteredFiles.map((file) => (
              <Card key={file.id} className="p-4 space-y-3 hover:border-brand-500/40 transition-all flex flex-col justify-between group">
                <div className="flex items-start justify-between gap-2">
                  <div className="w-10 h-10 rounded-lg bg-surface-raised border border-surface-border flex items-center justify-center shrink-0">
                    {getFileTypeIcon(file.name, file.type)}
                  </div>
                  <div className="flex items-center gap-1">
                    <button
                      onClick={() => handlePreview(file)}
                      className="p-1 text-slate-400 hover:text-brand-500"
                      title="Preview"
                    >
                      <Eye className="w-3.5 h-3.5" />
                    </button>
                    <button
                      onClick={() => handleDownload(file)}
                      className="p-1 text-slate-400 hover:text-brand-500"
                      title="Download"
                    >
                      <Download className="w-3.5 h-3.5" />
                    </button>
                    <button
                      onClick={() => handleDeleteFile(file.id)}
                      className="p-1 text-slate-400 hover:text-rose-500"
                      title="Delete"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>

                <div className="space-y-0.5">
                  <div className="text-xs font-semibold text-foreground truncate" title={file.name}>
                    {file.name}
                  </div>
                  <div className="text-[11px] text-slate-500 font-mono">
                    {formatSize(file.size || file.ciphertextSize)}
                  </div>
                </div>

                <div className="pt-2 border-t border-surface-border flex items-center justify-between text-[11px] text-slate-500 font-mono">
                  <span>{new Date(file.createdAt).toLocaleDateString()}</span>
                  <button
                    onClick={() => setActiveFileDetails(file)}
                    className="text-brand-500 hover:underline flex items-center gap-0.5"
                  >
                    <Info className="w-3 h-3" /> Info
                  </button>
                </div>
              </Card>
            ))}
          </div>
        )}
      </div>

      {/* Dialog: Create Folder */}
      <Dialog
        isOpen={isCreateFolderOpen}
        onClose={() => setIsCreateFolderOpen(false)}
        title="Create Encrypted Folder"
      >
        <form onSubmit={handleCreateFolder} className="space-y-4">
          <Input
            label="Folder Name"
            type="text"
            required
            autoFocus
            placeholder="e.g. Confidential Documents"
            value={newFolderName}
            onChange={(e) => setNewFolderName(e.target.value)}
            helperText="Folder name is encrypted client-side with your Master Key"
          />
          <div className="flex justify-end gap-2 pt-2">
            <Button type="button" variant="secondary" onClick={() => setIsCreateFolderOpen(false)}>
              Cancel
            </Button>
            <Button type="submit" variant="primary">
              Create Folder
            </Button>
          </div>
        </form>
      </Dialog>

      {/* Dialog: Rename File */}
      <Dialog
        isOpen={!!renameTarget}
        onClose={() => setRenameTarget(null)}
        title={`Rename "${renameTarget?.name}"`}
      >
        <form onSubmit={handleRenameSubmit} className="space-y-4">
          <Input
            label="New File Name"
            type="text"
            required
            autoFocus
            value={newRenameValue}
            onChange={(e) => setNewRenameValue(e.target.value)}
            helperText="Metadata envelope is re-encrypted with your Master Key"
          />
          <div className="flex justify-end gap-2 pt-2">
            <Button type="button" variant="secondary" onClick={() => setRenameTarget(null)}>
              Cancel
            </Button>
            <Button type="submit" variant="primary">
              Save Name
            </Button>
          </div>
        </form>
      </Dialog>

      {/* Dialog: Move File */}
      <Dialog
        isOpen={!!moveTarget}
        onClose={() => setMoveTarget(null)}
        title={`Move "${moveTarget?.name}"`}
      >
        <form onSubmit={handleMoveFile} className="space-y-4">
          <div className="space-y-1.5">
            <label className="block text-xs font-medium text-slate-700 dark:text-slate-300">
              Destination Folder
            </label>
            <select
              value={selectedDestinationFolder}
              onChange={(e) => setSelectedDestinationFolder(e.target.value)}
              className="w-full bg-surface border border-surface-border text-foreground rounded-lg px-3 py-2 text-xs focus:outline-none focus:border-brand-500"
            >
              <option value="root">Root Vault</option>
              {folders.map((fd) => (
                <option key={fd.id} value={fd.id}>
                  {fd.name}
                </option>
              ))}
            </select>
          </div>
          <div className="flex justify-end gap-2 pt-2">
            <Button type="button" variant="secondary" onClick={() => setMoveTarget(null)}>
              Cancel
            </Button>
            <Button type="submit" variant="primary">
              Move File
            </Button>
          </div>
        </form>
      </Dialog>

      {/* Dialog: Share File */}
      <Dialog
        isOpen={!!shareTarget}
        onClose={() => setShareTarget(null)}
        title={`Share "${shareTarget?.name}"`}
      >
        <div className="space-y-4 text-xs">
          <p className="text-slate-600 dark:text-slate-400">
            Generate an authenticated workspace reference for this encrypted file. Note that recipients must be authorized local vault users with appropriate key access.
          </p>
          <div className="p-3 bg-surface-raised rounded-lg border border-surface-border flex items-center justify-between gap-2">
            <span className="font-mono text-[11px] truncate text-slate-500">
              {typeof window !== "undefined" ? `${window.location.origin}/dashboard/files?focus=${shareTarget?.id}` : ""}
            </span>
            <Button type="button" variant="secondary" size="sm" onClick={copyShareLink}>
              {copiedShare ? "Copied!" : "Copy Link"}
            </Button>
          </div>
          <div className="flex justify-end pt-2">
            <Button type="button" variant="secondary" onClick={() => setShareTarget(null)}>
              Done
            </Button>
          </div>
        </div>
      </Dialog>

      {/* Dialog: In-Browser File Preview */}
      <Dialog
        isOpen={!!previewTarget}
        onClose={closePreview}
        title={`Preview: ${previewTarget?.name}`}
      >
        <div className="space-y-4 text-xs">
          {previewLoading ? (
            <div className="py-12 text-center text-slate-500 font-mono">
              Decrypting file in browser RAM...
            </div>
          ) : previewUrl ? (
            <div className="max-h-96 overflow-auto rounded-lg border border-surface-border flex items-center justify-center bg-surface-raised p-2">
              <img
                src={previewUrl}
                alt={previewTarget?.name}
                className="max-h-80 max-w-full rounded object-contain"
              />
            </div>
          ) : previewTextContent !== null ? (
            <div className="max-h-96 overflow-auto rounded-lg border border-surface-border bg-surface-raised p-3 font-mono text-[11px] leading-relaxed text-foreground whitespace-pre-wrap">
              {previewTextContent}
            </div>
          ) : (
            <div className="p-6 text-center space-y-2 bg-surface-raised rounded-lg border border-surface-border">
              <FileIcon className="w-8 h-8 text-slate-400 mx-auto" />
              <p className="text-slate-600 dark:text-slate-400">
                Direct in-browser preview is not available for this MIME type ({previewTarget?.type}).
              </p>
              <Button
                variant="primary"
                size="sm"
                onClick={() => previewTarget && handleDownload(previewTarget)}
              >
                <Download className="w-3.5 h-3.5 mr-1" /> Download Decrypted File
              </Button>
            </div>
          )}

          <div className="flex justify-between items-center pt-2">
            <span className="text-slate-400 font-mono text-[11px]">
              {previewTarget && formatSize(previewTarget.size || previewTarget.ciphertextSize)}
            </span>
            <Button type="button" variant="secondary" onClick={closePreview}>
              Close
            </Button>
          </div>
        </div>
      </Dialog>

      {/* Dialog: Cryptographic Details */}
      <Dialog
        isOpen={!!activeFileDetails}
        onClose={() => setActiveFileDetails(null)}
        title="Cryptographic Object Details"
      >
        {activeFileDetails && (
          <div className="space-y-4 text-xs">
            <div className="p-3 bg-surface-raised rounded-lg border border-surface-border font-mono space-y-2">
              <div>
                <span className="text-slate-400">File ID: </span>
                <span className="text-foreground">{activeFileDetails.id}</span>
              </div>
              <div>
                <span className="text-slate-400">Ciphertext Size: </span>
                <span className="text-foreground">
                  {activeFileDetails.ciphertextSize} bytes
                </span>
              </div>
              <div>
                <span className="text-slate-400">Wrapping Nonce (Base64): </span>
                <span className="text-brand-500 break-all">
                  {activeFileDetails.fileKeyWrappingNonce}
                </span>
              </div>
              <div>
                <span className="text-slate-400">File AES-GCM Nonce: </span>
                <span className="text-brand-500 break-all">
                  {activeFileDetails.fileEncryptionNonce}
                </span>
              </div>
              <div>
                <span className="text-slate-400">Metadata Nonce: </span>
                <span className="text-brand-500 break-all">
                  {activeFileDetails.metadataNonce}
                </span>
              </div>
            </div>

            <div className="p-3 bg-emerald-500/10 border border-emerald-500/20 rounded-lg text-emerald-600 dark:text-emerald-400 flex items-start gap-2">
              <CheckCircle2 className="w-4 h-4 shrink-0 mt-0.5" />
              <span>
                The server stores only ciphertext and the wrapped key envelope. Plaintext keys exist strictly in browser RAM.
              </span>
            </div>

            <div className="flex justify-end pt-2">
              <Button
                type="button"
                variant="secondary"
                onClick={() => setActiveFileDetails(null)}
              >
                Close
              </Button>
            </div>
          </div>
        )}
      </Dialog>
    </div>
  );
}
