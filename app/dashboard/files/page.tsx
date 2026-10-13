"use client";

import React, { useEffect, useState, useCallback, useMemo, useRef } from "react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import {
  Folder,
  FolderPlus,
  UploadCloud,
  Download,
  Trash2,
  Edit2,
  MoveRight,
  Search,
  Grid,
  List,
  File as FileIcon,
  Files as FilesIcon,
  ChevronRight,
  ArrowUpDown,
  Lock,
  Unlock,
  Info,
  CheckCircle2,
  FileText,
  FileCode,
  Image as ImageIcon,
  Archive,
  FileSpreadsheet,
  Film,
  Eye,
  X,
  Share2,
  Star,
  CheckSquare,
  Square,
  MoreVertical,
  RefreshCw,
  FolderOpen,
  Plus,
  Copy,
  Check,
  Shield,
  Clock,
  Filter,
} from "lucide-react";
import { Card } from "../../../components/ui/card";
import { Button } from "../../../components/ui/button";
import { Input } from "../../../components/ui/input";
import { Dialog } from "../../../components/ui/dialog";
import { Progress } from "../../../components/ui/progress";
import { Badge } from "../../../components/ui/badge";
import {
  useVault,
  DecryptedFileInfo,
  DecryptedFolderInfo,
} from "../../../lib/crypto/vault-context";

type CategoryFilter = "all" | "documents" | "images" | "media" | "archives" | "code" | "favorites";

export default function FilesPage() {
  const searchParams = useSearchParams();
  const initialCategoryParam = searchParams.get("category");
  const initialTabParam = searchParams.get("tab");
  const initialSearchQuery = searchParams.get("q") || "";

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

  // Search & Filters state
  const [searchQuery, setSearchQuery] = useState(initialSearchQuery);
  const [selectedCategory, setSelectedCategory] = useState<CategoryFilter>(
    initialTabParam === "favorites"
      ? "favorites"
      : (initialCategoryParam as CategoryFilter) || "all"
  );
  const [viewMode, setViewMode] = useState<"list" | "grid">("list");
  const [sortBy, setSortBy] = useState<"name" | "size" | "date">("name");
  const [sortOrder, setSortOrder] = useState<"asc" | "desc">("asc");

  // Favorites state (persisted in localStorage)
  const [favoriteIds, setFavoriteIds] = useState<Set<string>>(new Set());

  // Multi-selection state
  const [selectedFileIds, setSelectedFileIds] = useState<Set<string>>(new Set());

  // Upload state
  const [uploading, setUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [uploadStatus, setUploadStatus] = useState("");
  const [isDragOver, setIsDragOver] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Modals state
  const [isCreateFolderOpen, setIsCreateFolderOpen] = useState(false);
  const [newFolderName, setNewFolderName] = useState("");
  const [isCreatingFolder, setIsCreatingFolder] = useState(false);

  const [activeFileDetails, setActiveFileDetails] = useState<DecryptedFileInfo | null>(null);
  const [renameTarget, setRenameTarget] = useState<DecryptedFileInfo | null>(null);
  const [newRenameValue, setNewRenameValue] = useState("");
  const [renameFolderTarget, setRenameFolderTarget] = useState<DecryptedFolderInfo | null>(null);
  const [newFolderRenameValue, setNewFolderRenameValue] = useState("");

  const [moveTarget, setMoveTarget] = useState<DecryptedFileInfo | null>(null);
  const [selectedDestinationFolder, setSelectedDestinationFolder] = useState<string>("root");
  const [isMoving, setIsMoving] = useState(false);

  // In-browser Preview State
  const [previewTarget, setPreviewTarget] = useState<DecryptedFileInfo | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [previewTextContent, setPreviewTextContent] = useState<string | null>(null);
  const [previewLoading, setPreviewLoading] = useState(false);

  // Sharing Dialog State
  const [shareTarget, setShareTarget] = useState<DecryptedFileInfo | null>(null);
  const [copiedShare, setCopiedShare] = useState(false);

  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  // Load favorites and viewMode preference from localStorage
  useEffect(() => {
    try {
      const savedFavs = localStorage.getItem("cloudvault_favorites");
      if (savedFavs) {
        setFavoriteIds(new Set(JSON.parse(savedFavs)));
      }
      const savedView = localStorage.getItem("cloudvault_view_mode");
      if (savedView === "grid" || savedView === "list") {
        setViewMode(savedView);
      }
    } catch {
      // ignore
    }
  }, []);

  const toggleFavorite = (fileId: string) => {
    setFavoriteIds((prev) => {
      const next = new Set(prev);
      if (next.has(fileId)) {
        next.delete(fileId);
      } else {
        next.add(fileId);
      }
      try {
        localStorage.setItem("cloudvault_favorites", JSON.stringify(Array.from(next)));
      } catch {
        // ignore
      }
      return next;
    });
  };

  const handleToggleViewMode = (mode: "grid" | "list") => {
    setViewMode(mode);
    try {
      localStorage.setItem("cloudvault_view_mode", mode);
    } catch {
      // ignore
    }
  };

  const formatSize = (bytes: number) => {
    if (bytes === 0) return "0 B";
    const k = 1024;
    const sizes = ["B", "KB", "MB", "GB", "TB"];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + " " + sizes[i];
  };

  const getFileCategory = (filename: string, mimeType: string): CategoryFilter => {
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
    return "all";
  };

  const getFileTypeIcon = (filename: string, mimeType: string) => {
    const cat = getFileCategory(filename, mimeType);
    switch (cat) {
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

  const fetchFolderContent = useCallback(async () => {
    setLoading(true);
    setSelectedFileIds(new Set());
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
    setIsCreatingFolder(true);

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
    } finally {
      setIsCreatingFolder(false);
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
        setUploadStatus(`Transmitting ciphertext for ${file.name}...`);

        const uploadRes = await fetch(`/api/files/upload/${fileId}`, {
          method: "POST",
          headers: { "Content-Type": "application/octet-stream" },
          body: new Blob([encryptedData.ciphertext as any]),
        });

        if (!uploadRes.ok) {
          throw new Error(`Failed to upload ${file.name}`);
        }
      } catch (err: unknown) {
        const msg = err instanceof Error ? err.message : "Upload error";
        setErrorMessage(msg);
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

  // Bulk download selected files
  const handleBulkDownload = async () => {
    const selectedFiles = files.filter((f) => selectedFileIds.has(f.id));
    for (const f of selectedFiles) {
      await handleDownload(f);
    }
  };

  // Bulk delete selected files
  const handleBulkDelete = async () => {
    if (
      !confirm(
        `Are you sure you want to permanently delete ${selectedFileIds.size} selected file(s)?`
      )
    )
      return;

    try {
      for (const id of Array.from(selectedFileIds)) {
        await fetch(`/api/files/${id}`, { method: "DELETE" });
      }
      setSelectedFileIds(new Set());
      await fetchFolderContent();
    } catch {
      // ignore
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
      const isImg =
        ["png", "jpg", "jpeg", "gif", "webp", "svg"].includes(ext || "") ||
        file.type.startsWith("image/");
      const isTxt =
        ["txt", "md", "json", "js", "ts", "tsx", "html", "css", "py", "sql", "sh", "yml", "yaml"].includes(
          ext || ""
        ) || file.type.startsWith("text/");

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

      if (!res.ok) throw new Error("Rename failed");

      setRenameTarget(null);
      setNewRenameValue("");
      await fetchFolderContent();
    } catch (err: unknown) {
      setErrorMessage(err instanceof Error ? err.message : "Failed to rename file");
    }
  };

  const handleFolderRenameSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!renameFolderTarget || !newFolderRenameValue.trim()) return;

    try {
      const payload = await createEncryptedFolderPayload(newFolderRenameValue.trim());
      const res = await fetch(`/api/folders/${renameFolderTarget.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          encryptedFolderName: payload.encryptedFolderName,
          nameNonce: payload.nameNonce,
        }),
      });

      if (!res.ok) throw new Error("Folder rename failed");

      setRenameFolderTarget(null);
      setNewFolderRenameValue("");
      await fetchFolderContent();
    } catch (err: unknown) {
      setErrorMessage(err instanceof Error ? err.message : "Failed to rename folder");
    }
  };

  const handleMoveSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!moveTarget) return;

    setIsMoving(true);
    try {
      const targetFolderId = selectedDestinationFolder === "root" ? null : selectedDestinationFolder;
      const res = await fetch(`/api/files/${moveTarget.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          folderId: targetFolderId,
        }),
      });

      if (!res.ok) throw new Error("Move failed");

      setMoveTarget(null);
      await fetchFolderContent();
    } catch (err: unknown) {
      setErrorMessage(err instanceof Error ? err.message : "Failed to move file");
    } finally {
      setIsMoving(false);
    }
  };

  const navigateToFolder = (folderId: string | null, folderName: string) => {
    setCurrentFolderId(folderId);
    if (folderId === null) {
      setFolderBreadcrumbs([{ id: null, name: "Root Vault" }]);
    } else {
      setFolderBreadcrumbs((prev) => [...prev, { id: folderId, name: folderName }]);
    }
  };

  const navigateToBreadcrumb = (index: number) => {
    const target = folderBreadcrumbs[index];
    setCurrentFolderId(target.id);
    setFolderBreadcrumbs((prev) => prev.slice(0, index + 1));
  };

  // Filtered & Sorted Files
  const filteredFiles = useMemo(() => {
    return files
      .filter((file) => {
        // Search filter
        if (
          searchQuery.trim() &&
          !file.name.toLowerCase().includes(searchQuery.toLowerCase().trim())
        ) {
          return false;
        }

        // Category filter
        if (selectedCategory === "favorites") {
          return favoriteIds.has(file.id);
        }
        if (selectedCategory !== "all") {
          const cat = getFileCategory(file.name, file.type);
          return cat === selectedCategory;
        }

        return true;
      })
      .sort((a, b) => {
        if (sortBy === "name") {
          return sortOrder === "asc"
            ? a.name.localeCompare(b.name)
            : b.name.localeCompare(a.name);
        }
        if (sortBy === "size") {
          return sortOrder === "asc" ? a.size - b.size : b.size - a.size;
        }
        if (sortBy === "date") {
          const dateA = new Date(a.createdAt).getTime();
          const dateB = new Date(b.createdAt).getTime();
          return sortOrder === "asc" ? dateA - dateB : dateB - dateA;
        }
        return 0;
      });
  }, [files, searchQuery, selectedCategory, favoriteIds, sortBy, sortOrder]);

  const toggleSelectAll = () => {
    if (selectedFileIds.size === filteredFiles.length) {
      setSelectedFileIds(new Set());
    } else {
      setSelectedFileIds(new Set(filteredFiles.map((f) => f.id)));
    }
  };

  const toggleSelectFile = (fileId: string) => {
    setSelectedFileIds((prev) => {
      const next = new Set(prev);
      if (next.has(fileId)) next.delete(fileId);
      else next.add(fileId);
      return next;
    });
  };

  const categoryPills: Array<{ key: CategoryFilter; label: string; icon: React.ReactNode }> = [
    { key: "all", label: "All Files", icon: <FilesIcon className="w-3.5 h-3.5" /> },
    { key: "documents", label: "Documents", icon: <FileText className="w-3.5 h-3.5 text-sky-400" /> },
    { key: "images", label: "Images", icon: <ImageIcon className="w-3.5 h-3.5 text-purple-400" /> },
    { key: "media", label: "Media", icon: <Film className="w-3.5 h-3.5 text-rose-400" /> },
    { key: "archives", label: "Archives", icon: <Archive className="w-3.5 h-3.5 text-amber-400" /> },
    { key: "code", label: "Code", icon: <FileCode className="w-3.5 h-3.5 text-emerald-400" /> },
    { key: "favorites", label: "Favorites", icon: <Star className="w-3.5 h-3.5 text-amber-400" /> },
  ];

  return (
    <div
      className="max-w-6xl mx-auto space-y-5 pb-16"
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
      <input
        type="file"
        multiple
        ref={fileInputRef}
        onChange={(e) => handleFilesUpload(e.target.files)}
        className="hidden"
      />

      {/* Breadcrumb & Primary Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="space-y-1">
          {/* Breadcrumb Trail */}
          <nav className="flex items-center gap-1.5 text-xs font-mono text-slate-500 overflow-x-auto pb-1">
            {folderBreadcrumbs.map((crumb, idx) => (
              <React.Fragment key={crumb.id || "root"}>
                {idx > 0 && <ChevronRight className="w-3.5 h-3.5 text-slate-600 shrink-0" />}
                <button
                  onClick={() => navigateToBreadcrumb(idx)}
                  className={`hover:text-foreground transition-colors truncate max-w-[150px] ${
                    idx === folderBreadcrumbs.length - 1
                      ? "text-foreground font-semibold"
                      : "text-slate-400"
                  }`}
                >
                  {crumb.name}
                </button>
              </React.Fragment>
            ))}
          </nav>
          <h1 className="text-xl md:text-2xl font-bold tracking-tight text-foreground flex items-center gap-2">
            <span>{folderBreadcrumbs[folderBreadcrumbs.length - 1]?.name || "Files"}</span>
            <span className="text-xs font-mono text-slate-500 font-normal">
              ({filteredFiles.length} {filteredFiles.length === 1 ? "item" : "items"})
            </span>
          </h1>
        </div>

        {/* Action Controls */}
        <div className="flex flex-wrap items-center gap-2">
          <Button
            variant="secondary"
            size="sm"
            disabled={!isUnlocked}
            onClick={() => setIsCreateFolderOpen(true)}
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
            <Plus className="w-3.5 h-3.5 mr-1.5" /> Upload File
          </Button>
        </div>
      </div>

      {/* Lock Warning */}
      {!isUnlocked && (
        <div className="p-3.5 rounded-2xl bg-amber-500/10 border border-amber-500/25 flex items-center justify-between text-xs text-amber-700 dark:text-amber-300">
          <div className="flex items-center gap-2.5">
            <Lock className="w-4 h-4 text-amber-500 shrink-0" />
            <span>Vault memory is locked. Unlock to decrypt filenames and view files.</span>
          </div>
          <Link href="/unlock">
            <Button variant="primary" size="sm" className="text-xs py-1 px-3">
              Unlock Vault
            </Button>
          </Link>
        </div>
      )}

      {errorMessage && (
        <div className="p-3 rounded-xl bg-rose-500/10 border border-rose-500/25 flex items-center justify-between text-xs text-rose-600 dark:text-rose-400">
          <div className="flex items-center gap-2">
            <Info className="w-4 h-4 shrink-0 text-rose-500" />
            <span>{errorMessage}</span>
          </div>
          <button onClick={() => setErrorMessage(null)} className="text-slate-400 hover:text-foreground">
            <X className="w-3.5 h-3.5" />
          </button>
        </div>
      )}

      {/* Search, Filter Tabs & View Controls */}
      <Card className="p-3.5 space-y-3">
        <div className="flex flex-col md:flex-row items-stretch md:items-center justify-between gap-3">
          {/* Search Bar */}
          <div className="relative flex-1 max-w-md">
            <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none" />
            <input
              type="text"
              placeholder="Filter by decrypted filename..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-9 pr-8 py-2 bg-surface-raised/70 border border-surface-border rounded-xl text-xs text-foreground placeholder-slate-400 focus:outline-none focus:ring-1 focus:ring-[rgb(240_158_79)] focus:border-[rgb(240_158_79)] transition-all"
            />
            {searchQuery && (
              <button
                onClick={() => setSearchQuery("")}
                className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-foreground"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            )}
          </div>

          {/* View Mode & Sort Dropdowns */}
          <div className="flex items-center justify-between sm:justify-end gap-2">
            {/* Sort Dropdown */}
            <div className="flex items-center gap-1.5 bg-surface-raised/70 border border-surface-border rounded-xl px-2.5 py-1 text-xs text-slate-400">
              <ArrowUpDown className="w-3.5 h-3.5 text-[rgb(240_158_79)]" />
              <select
                value={`${sortBy}-${sortOrder}`}
                onChange={(e) => {
                  const [b, o] = e.target.value.split("-") as [any, any];
                  setSortBy(b);
                  setSortOrder(o);
                }}
                className="bg-transparent text-foreground text-xs focus:outline-none cursor-pointer"
              >
                <option value="name-asc" className="bg-surface text-foreground">Name (A-Z)</option>
                <option value="name-desc" className="bg-surface text-foreground">Name (Z-A)</option>
                <option value="size-desc" className="bg-surface text-foreground">Size (Largest)</option>
                <option value="size-asc" className="bg-surface text-foreground">Size (Smallest)</option>
                <option value="date-desc" className="bg-surface text-foreground">Date (Newest)</option>
                <option value="date-asc" className="bg-surface text-foreground">Date (Oldest)</option>
              </select>
            </div>

            {/* View Mode Switcher */}
            <div className="flex items-center bg-surface-raised/70 border border-surface-border rounded-xl p-0.5">
              <button
                onClick={() => handleToggleViewMode("list")}
                title="List View"
                className={`p-1.5 rounded-lg transition-colors ${
                  viewMode === "list"
                    ? "bg-surface text-[rgb(240_158_79)] shadow-sm font-semibold"
                    : "text-slate-400 hover:text-foreground"
                }`}
              >
                <List className="w-4 h-4" />
              </button>
              <button
                onClick={() => handleToggleViewMode("grid")}
                title="Grid View"
                className={`p-1.5 rounded-lg transition-colors ${
                  viewMode === "grid"
                    ? "bg-surface text-[rgb(240_158_79)] shadow-sm font-semibold"
                    : "text-slate-400 hover:text-foreground"
                }`}
              >
                <Grid className="w-4 h-4" />
              </button>
            </div>
          </div>
        </div>

        {/* Category Pills */}
        <div className="flex items-center gap-1.5 overflow-x-auto pt-1 pb-0.5 no-scrollbar">
          {categoryPills.map((pill) => {
            const isSelected = selectedCategory === pill.key;
            return (
              <button
                key={pill.key}
                onClick={() => setSelectedCategory(pill.key)}
                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-medium whitespace-nowrap transition-all ${
                  isSelected
                    ? "bg-[rgba(240,158,79,0.15)] text-[rgb(240_158_79)] border border-[rgba(240,158,79,0.35)] shadow-sm font-semibold"
                    : "bg-surface-raised/50 text-slate-600 dark:text-slate-400 hover:text-foreground hover:bg-surface-raised border border-transparent"
                }`}
              >
                {pill.icon}
                <span>{pill.label}</span>
              </button>
            );
          })}
        </div>
      </Card>

      {/* Main Content Area */}
      {loading ? (
        <div className="py-24 flex flex-col items-center justify-center text-slate-400 space-y-3">
          <div className="w-8 h-8 border-2 border-[rgb(240_158_79)] border-t-transparent rounded-full animate-spin" />
          <p className="text-xs font-mono text-slate-500">
            Decrypting vault metadata with master key...
          </p>
        </div>
      ) : (
        <div className="space-y-4">
          {/* Folders Section (Only in Root or folder view if folders exist) */}
          {folders.length > 0 && selectedCategory === "all" && !searchQuery && (
            <div className="space-y-2.5">
              <div className="text-xs font-semibold text-slate-500 uppercase tracking-wider font-mono px-1">
                Folders ({folders.length})
              </div>
              <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-3">
                {folders.map((folder) => (
                  <div
                    key={folder.id}
                    className="p-3.5 rounded-xl bg-surface border border-surface-border hover:border-[rgba(240,158,79,0.35)] hover:bg-surface-raised/70 transition-all group flex items-center justify-between gap-2"
                  >
                    <button
                      onClick={() => navigateToFolder(folder.id, folder.name)}
                      className="flex items-center gap-2.5 min-w-0 flex-1 text-left"
                    >
                      <Folder className="w-5 h-5 text-[rgb(240_158_79)] shrink-0" />
                      <span className="text-xs font-medium text-foreground truncate group-hover:text-[rgb(240_158_79)] transition-colors">
                        {folder.name}
                      </span>
                    </button>
                    <div className="flex items-center gap-0.5 opacity-0 group-hover:opacity-100 transition-opacity">
                      <button
                        onClick={() => {
                          setRenameFolderTarget(folder);
                          setNewFolderRenameValue(folder.name);
                        }}
                        title="Rename folder"
                        className="p-1 rounded text-slate-400 hover:text-foreground"
                      >
                        <Edit2 className="w-3.5 h-3.5" />
                      </button>
                      <button
                        onClick={() => handleDeleteFolder(folder.id)}
                        title="Delete folder"
                        className="p-1 rounded text-slate-400 hover:text-rose-500"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Files Section */}
          {filteredFiles.length === 0 ? (
            <div className="py-20 text-center space-y-3 vault-card rounded-2xl p-8 bg-surface">
              <div className="w-12 h-12 rounded-2xl bg-surface-raised border border-surface-border flex items-center justify-center mx-auto text-slate-400">
                <FilesIcon className="w-6 h-6" />
              </div>
              <div>
                <p className="text-sm font-semibold text-foreground">
                  {searchQuery || selectedCategory !== "all"
                    ? "No files match your filter"
                    : "No files in this folder"}
                </p>
                <p className="text-xs text-slate-500 max-w-sm mx-auto mt-1">
                  {searchQuery || selectedCategory !== "all"
                    ? "Try clearing your search query or choosing another category filter."
                    : "Upload files directly here to encrypt and store them with client-side zero-knowledge security."}
                </p>
              </div>
              <div className="pt-2 flex justify-center gap-2">
                {searchQuery || selectedCategory !== "all" ? (
                  <Button
                    variant="secondary"
                    size="sm"
                    onClick={() => {
                      setSearchQuery("");
                      setSelectedCategory("all");
                    }}
                    className="text-xs"
                  >
                    Clear Filters
                  </Button>
                ) : (
                  <Button
                    variant="primary"
                    size="sm"
                    disabled={!isUnlocked}
                    onClick={() => fileInputRef.current?.click()}
                    className="text-xs"
                  >
                    <Plus className="w-3.5 h-3.5 mr-1" /> Upload File
                  </Button>
                )}
              </div>
            </div>
          ) : viewMode === "list" ? (
            /* LIST VIEW */
            <div className="vault-card rounded-2xl border border-surface-border bg-surface overflow-hidden shadow-sm">
              <div className="overflow-x-auto">
                <table className="w-full text-left border-collapse">
                  <thead>
                    <tr className="border-b border-surface-border text-[11px] font-mono text-slate-500 bg-surface-raised/40">
                      <th className="py-2.5 px-3 w-8">
                        <button
                          onClick={toggleSelectAll}
                          className="text-slate-400 hover:text-foreground"
                          title="Select All"
                        >
                          {selectedFileIds.size === filteredFiles.length && filteredFiles.length > 0 ? (
                            <CheckSquare className="w-4 h-4 text-[rgb(240_158_79)]" />
                          ) : (
                            <Square className="w-4 h-4" />
                          )}
                        </button>
                      </th>
                      <th className="py-2.5 px-2 w-8"></th>
                      <th className="py-2.5 px-3 font-semibold">Name</th>
                      <th className="py-2.5 px-3 font-semibold hidden sm:table-cell">Size</th>
                      <th className="py-2.5 px-3 font-semibold hidden md:table-cell">Uploaded</th>
                      <th className="py-2.5 px-3 font-semibold hidden lg:table-cell">Security</th>
                      <th className="py-2.5 px-3 font-semibold text-right">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-surface-border text-xs">
                    {filteredFiles.map((file) => {
                      const isSelected = selectedFileIds.has(file.id);
                      const isFavorite = favoriteIds.has(file.id);

                      return (
                        <tr
                          key={file.id}
                          className={`hover:bg-surface-raised/50 transition-colors group ${
                            isSelected ? "bg-[rgba(240,158,79,0.06)]" : ""
                          }`}
                        >
                          {/* Selection Checkbox */}
                          <td className="py-2.5 px-3">
                            <button
                              onClick={() => toggleSelectFile(file.id)}
                              className="text-slate-400 hover:text-foreground"
                            >
                              {isSelected ? (
                                <CheckSquare className="w-4 h-4 text-[rgb(240_158_79)]" />
                              ) : (
                                <Square className="w-4 h-4" />
                              )}
                            </button>
                          </td>

                          {/* Favorite Star */}
                          <td className="py-2.5 px-1">
                            <button
                              onClick={() => toggleFavorite(file.id)}
                              title={isFavorite ? "Remove favorite" : "Mark favorite"}
                              className="text-slate-400 hover:text-amber-400 transition-colors"
                            >
                              <Star
                                className={`w-4 h-4 ${
                                  isFavorite
                                    ? "text-amber-400 fill-amber-400"
                                    : "text-slate-400 hover:text-amber-400"
                                }`}
                              />
                            </button>
                          </td>

                          {/* File Name & Icon */}
                          <td className="py-2.5 px-3">
                            <div className="flex items-center gap-2.5 min-w-0">
                              <div className="p-1.5 rounded-lg bg-surface border border-surface-border shrink-0">
                                {getFileTypeIcon(file.name, file.type)}
                              </div>
                              <span
                                onClick={() => handlePreview(file)}
                                className="font-medium text-foreground truncate cursor-pointer hover:text-[rgb(240_158_79)] transition-colors max-w-xs md:max-w-sm"
                                title={file.name}
                              >
                                {file.name}
                              </span>
                            </div>
                          </td>

                          {/* Size */}
                          <td className="py-2.5 px-3 font-mono text-slate-500 hidden sm:table-cell whitespace-nowrap">
                            {formatSize(file.size)}
                          </td>

                          {/* Upload Date */}
                          <td className="py-2.5 px-3 font-mono text-slate-500 hidden md:table-cell whitespace-nowrap">
                            {new Date(file.createdAt).toLocaleDateString(undefined, {
                              month: "short",
                              day: "numeric",
                              year: "numeric",
                            })}
                          </td>

                          {/* Security Badge */}
                          <td className="py-2.5 px-3 hidden lg:table-cell whitespace-nowrap">
                            <span className="text-[10px] font-mono font-medium text-[rgb(100_215_113)] bg-[rgba(100,215,113,0.12)] px-2 py-0.5 rounded-md border border-[rgba(100,215,113,0.25)]">
                              AES-256-GCM
                            </span>
                          </td>

                          {/* Actions */}
                          <td className="py-2.5 px-3 text-right whitespace-nowrap">
                            <div className="flex items-center justify-end gap-1">
                              <button
                                onClick={() => handlePreview(file)}
                                title="In-browser decrypted preview"
                                className="p-1.5 rounded-lg text-slate-500 hover:text-foreground hover:bg-surface-raised transition-colors"
                              >
                                <Eye className="w-4 h-4" />
                              </button>
                              <button
                                onClick={() => handleDownload(file)}
                                title="Decrypt & Download"
                                className="p-1.5 rounded-lg text-slate-500 hover:text-[rgb(240_158_79)] hover:bg-surface-raised transition-colors"
                              >
                                <Download className="w-4 h-4" />
                              </button>
                              <button
                                onClick={() => {
                                  setRenameTarget(file);
                                  setNewRenameValue(file.name);
                                }}
                                title="Rename file"
                                className="p-1.5 rounded-lg text-slate-500 hover:text-foreground hover:bg-surface-raised transition-colors hidden sm:inline-block"
                              >
                                <Edit2 className="w-4 h-4" />
                              </button>
                              <button
                                onClick={() => {
                                  setMoveTarget(file);
                                  setSelectedDestinationFolder(currentFolderId || "root");
                                }}
                                title="Move file"
                                className="p-1.5 rounded-lg text-slate-500 hover:text-foreground hover:bg-surface-raised transition-colors hidden sm:inline-block"
                              >
                                <MoveRight className="w-4 h-4" />
                              </button>
                              <button
                                onClick={() => setActiveFileDetails(file)}
                                title="File details"
                                className="p-1.5 rounded-lg text-slate-500 hover:text-foreground hover:bg-surface-raised transition-colors"
                              >
                                <Info className="w-4 h-4" />
                              </button>
                              <button
                                onClick={() => setShareTarget(file)}
                                title="Share file"
                                className="p-1.5 rounded-lg text-slate-500 hover:text-foreground hover:bg-surface-raised transition-colors"
                              >
                                <Share2 className="w-4 h-4" />
                              </button>
                              <button
                                onClick={() => handleDeleteFile(file.id)}
                                title="Delete file"
                                className="p-1.5 rounded-lg text-slate-500 hover:text-rose-500 hover:bg-surface-raised transition-colors"
                              >
                                <Trash2 className="w-4 h-4" />
                              </button>
                            </div>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            </div>
          ) : (
            /* GRID VIEW */
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-3.5">
              {filteredFiles.map((file) => {
                const isSelected = selectedFileIds.has(file.id);
                const isFavorite = favoriteIds.has(file.id);

                return (
                  <div
                    key={file.id}
                    className={`vault-card rounded-2xl p-3.5 bg-surface border border-surface-border hover:border-[rgba(240,158,79,0.35)] flex flex-col justify-between space-y-3 transition-all group relative ${
                      isSelected ? "border-[rgb(240_158_79)] bg-[rgba(240,158,79,0.05)] shadow-md" : ""
                    }`}
                  >
                    {/* Top Row: Checkbox & Star */}
                    <div className="flex items-center justify-between">
                      <button
                        onClick={() => toggleSelectFile(file.id)}
                        className="text-slate-400 hover:text-foreground"
                      >
                        {isSelected ? (
                          <CheckSquare className="w-4 h-4 text-[rgb(240_158_79)]" />
                        ) : (
                          <Square className="w-4 h-4 opacity-50 group-hover:opacity-100 transition-opacity" />
                        )}
                      </button>

                      <button
                        onClick={() => toggleFavorite(file.id)}
                        title={isFavorite ? "Remove favorite" : "Mark favorite"}
                      >
                        <Star
                          className={`w-4 h-4 transition-colors ${
                            isFavorite
                              ? "text-amber-400 fill-amber-400"
                              : "text-slate-400 hover:text-amber-400 opacity-40 group-hover:opacity-100"
                          }`}
                        />
                      </button>
                    </div>

                    {/* Preview / Center Icon */}
                    <div
                      onClick={() => handlePreview(file)}
                      className="py-4 flex flex-col items-center justify-center cursor-pointer group-hover:scale-105 transition-transform"
                    >
                      <div className="w-12 h-12 rounded-2xl bg-surface-raised border border-surface-border flex items-center justify-center text-[rgb(240_158_79)] shadow-sm">
                        {getFileTypeIcon(file.name, file.type)}
                      </div>
                    </div>

                    {/* Meta info */}
                    <div className="space-y-1">
                      <p
                        onClick={() => handlePreview(file)}
                        className="text-xs font-semibold text-foreground truncate cursor-pointer hover:text-[rgb(240_158_79)] transition-colors"
                        title={file.name}
                      >
                        {file.name}
                      </p>
                      <div className="flex items-center justify-between text-[11px] font-mono text-slate-500">
                        <span>{formatSize(file.size)}</span>
                        <span className="text-[10px] text-[rgb(100_215_113)]">GCM</span>
                      </div>
                    </div>

                    {/* Quick action footer */}
                    <div className="pt-2 border-t border-surface-border flex items-center justify-between text-slate-500">
                      <button
                        onClick={() => handlePreview(file)}
                        title="Preview"
                        className="p-1 hover:text-foreground transition-colors"
                      >
                        <Eye className="w-3.5 h-3.5" />
                      </button>
                      <button
                        onClick={() => handleDownload(file)}
                        title="Download"
                        className="p-1 hover:text-[rgb(240_158_79)] transition-colors"
                      >
                        <Download className="w-3.5 h-3.5" />
                      </button>
                      <button
                        onClick={() => setActiveFileDetails(file)}
                        title="Details"
                        className="p-1 hover:text-foreground transition-colors"
                      >
                        <Info className="w-3.5 h-3.5" />
                      </button>
                      <button
                        onClick={() => handleDeleteFile(file.id)}
                        title="Delete"
                        className="p-1 hover:text-rose-500 transition-colors"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      )}

      {/* Floating Bulk Action Bar */}
      {selectedFileIds.size > 0 && (
        <div className="fixed bottom-6 left-1/2 -translate-x-1/2 z-40 bg-surface/95 backdrop-blur-xl border border-[rgba(240,158,79,0.4)] rounded-2xl px-4 py-2.5 shadow-2xl flex items-center gap-4 text-xs animate-in slide-in-from-bottom-4 duration-200">
          <div className="font-mono font-semibold text-foreground flex items-center gap-1.5">
            <CheckSquare className="w-4 h-4 text-[rgb(240_158_79)]" />
            <span>{selectedFileIds.size} selected</span>
          </div>
          <div className="h-4 w-px bg-surface-border" />
          <Button
            variant="secondary"
            size="sm"
            onClick={handleBulkDownload}
            className="text-xs py-1 px-2.5"
          >
            <Download className="w-3.5 h-3.5 mr-1 text-[rgb(240_158_79)]" /> Download All
          </Button>
          <Button
            variant="danger"
            size="sm"
            onClick={handleBulkDelete}
            className="text-xs py-1 px-2.5"
          >
            <Trash2 className="w-3.5 h-3.5 mr-1" /> Delete
          </Button>
          <button
            onClick={() => setSelectedFileIds(new Set())}
            className="text-slate-400 hover:text-foreground p-1"
            title="Clear selection"
          >
            <X className="w-4 h-4" />
          </button>
        </div>
      )}

      {/* Uploading Shimmer Overlay */}
      {uploading && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-md flex items-center justify-center p-4">
          <div className="bg-surface border border-surface-border rounded-2xl max-w-sm w-full p-6 space-y-4 shadow-2xl text-center">
            <div className="w-8 h-8 border-2 border-[rgb(240_158_79)] border-t-transparent rounded-full animate-spin mx-auto" />
            <div className="space-y-1">
              <h3 className="text-sm font-semibold text-foreground font-mono">
                {uploadStatus}
              </h3>
              <Progress value={uploadProgress} max={100} />
              <p className="text-[11px] text-slate-500 font-mono">
                {uploadProgress}% Encrypted with AES-256-GCM
              </p>
            </div>
          </div>
        </div>
      )}

      {/* Create Folder Modal */}
      <Dialog
        isOpen={isCreateFolderOpen}
        onClose={() => setIsCreateFolderOpen(false)}
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
              placeholder="e.g. Legal Documents"
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
              onClick={() => setIsCreateFolderOpen(false)}
            >
              Cancel
            </Button>
            <Button
              type="submit"
              variant="primary"
              size="sm"
              isLoading={isCreatingFolder}
            >
              Create Folder
            </Button>
          </div>
        </form>
      </Dialog>

      {/* Rename File Modal */}
      <Dialog
        isOpen={!!renameTarget}
        onClose={() => setRenameTarget(null)}
        title="Rename Encrypted File"
      >
        <form onSubmit={handleRenameSubmit} className="space-y-4 pt-2">
          <p className="text-xs text-slate-500">
            The new filename is re-encrypted in your browser before updating metadata.
          </p>
          <div className="space-y-1.5">
            <label className="text-xs font-medium text-foreground">New Filename</label>
            <input
              type="text"
              required
              autoFocus
              value={newRenameValue}
              onChange={(e) => setNewRenameValue(e.target.value)}
              className="w-full bg-surface border border-surface-border text-foreground text-sm rounded-xl px-3.5 py-2.5 focus:outline-none focus:ring-2 focus:ring-[rgb(240_158_79)]"
            />
          </div>
          <div className="flex justify-end gap-2 pt-2">
            <Button type="button" variant="ghost" size="sm" onClick={() => setRenameTarget(null)}>
              Cancel
            </Button>
            <Button type="submit" variant="primary" size="sm">
              Save Name
            </Button>
          </div>
        </form>
      </Dialog>

      {/* Rename Folder Modal */}
      <Dialog
        isOpen={!!renameFolderTarget}
        onClose={() => setRenameFolderTarget(null)}
        title="Rename Encrypted Folder"
      >
        <form onSubmit={handleFolderRenameSubmit} className="space-y-4 pt-2">
          <p className="text-xs text-slate-500">
            The updated folder name will be re-encrypted before persisting.
          </p>
          <div className="space-y-1.5">
            <label className="text-xs font-medium text-foreground">New Folder Name</label>
            <input
              type="text"
              required
              autoFocus
              value={newFolderRenameValue}
              onChange={(e) => setNewFolderRenameValue(e.target.value)}
              className="w-full bg-surface border border-surface-border text-foreground text-sm rounded-xl px-3.5 py-2.5 focus:outline-none focus:ring-2 focus:ring-[rgb(240_158_79)]"
            />
          </div>
          <div className="flex justify-end gap-2 pt-2">
            <Button
              type="button"
              variant="ghost"
              size="sm"
              onClick={() => setRenameFolderTarget(null)}
            >
              Cancel
            </Button>
            <Button type="submit" variant="primary" size="sm">
              Save Folder Name
            </Button>
          </div>
        </form>
      </Dialog>

      {/* Move File Modal */}
      <Dialog
        isOpen={!!moveTarget}
        onClose={() => setMoveTarget(null)}
        title="Move Encrypted File"
      >
        <form onSubmit={handleMoveSubmit} className="space-y-4 pt-2">
          <p className="text-xs text-slate-500">
            Select the destination folder for <span className="font-semibold text-foreground">{moveTarget?.name}</span>:
          </p>
          <div className="space-y-2">
            <label className="text-xs font-medium text-foreground">Destination Folder</label>
            <div className="space-y-1.5 max-h-48 overflow-y-auto">
              <label
                className={`flex items-center gap-2 p-2.5 rounded-xl border cursor-pointer text-xs transition-colors ${
                  selectedDestinationFolder === "root"
                    ? "border-[rgb(240_158_79)] bg-[rgba(240,158,79,0.1)] text-foreground font-semibold"
                    : "border-surface-border hover:bg-surface-raised text-slate-400"
                }`}
              >
                <input
                  type="radio"
                  name="destinationFolder"
                  value="root"
                  checked={selectedDestinationFolder === "root"}
                  onChange={() => setSelectedDestinationFolder("root")}
                  className="hidden"
                />
                <Folder className="w-4 h-4 text-[rgb(240_158_79)]" />
                <span>Root Vault</span>
              </label>

              {folders.map((f) => (
                <label
                  key={f.id}
                  className={`flex items-center gap-2 p-2.5 rounded-xl border cursor-pointer text-xs transition-colors ${
                    selectedDestinationFolder === f.id
                      ? "border-[rgb(240_158_79)] bg-[rgba(240,158,79,0.1)] text-foreground font-semibold"
                      : "border-surface-border hover:bg-surface-raised text-slate-400"
                  }`}
                >
                  <input
                    type="radio"
                    name="destinationFolder"
                    value={f.id}
                    checked={selectedDestinationFolder === f.id}
                    onChange={() => setSelectedDestinationFolder(f.id)}
                    className="hidden"
                  />
                  <Folder className="w-4 h-4 text-[rgb(240_158_79)]" />
                  <span>{f.name}</span>
                </label>
              ))}
            </div>
          </div>
          <div className="flex justify-end gap-2 pt-2">
            <Button type="button" variant="ghost" size="sm" onClick={() => setMoveTarget(null)}>
              Cancel
            </Button>
            <Button type="submit" variant="primary" size="sm" isLoading={isMoving}>
              Move File
            </Button>
          </div>
        </form>
      </Dialog>

      {/* File Details Modal */}
      <Dialog
        isOpen={!!activeFileDetails}
        onClose={() => setActiveFileDetails(null)}
        title="Encrypted File Metadata"
      >
        {activeFileDetails && (
          <div className="space-y-4 pt-2">
            <div className="p-3.5 rounded-xl bg-surface-raised border border-surface-border space-y-2 text-xs font-mono">
              <div className="flex justify-between border-b border-surface-border/60 pb-1.5">
                <span className="text-slate-500">Decrypted Name:</span>
                <span className="text-foreground font-semibold truncate max-w-[200px]">
                  {activeFileDetails.name}
                </span>
              </div>
              <div className="flex justify-between border-b border-surface-border/60 pb-1.5">
                <span className="text-slate-500">File Size:</span>
                <span className="text-foreground">{formatSize(activeFileDetails.size)}</span>
              </div>
              <div className="flex justify-between border-b border-surface-border/60 pb-1.5">
                <span className="text-slate-500">MIME Type:</span>
                <span className="text-foreground truncate max-w-[200px]">
                  {activeFileDetails.type || "application/octet-stream"}
                </span>
              </div>
              <div className="flex justify-between border-b border-surface-border/60 pb-1.5">
                <span className="text-slate-500">Encryption Scheme:</span>
                <span className="text-[rgb(100_215_113)]">AES-256-GCM (Authenticated)</span>
              </div>
              <div className="flex justify-between border-b border-surface-border/60 pb-1.5">
                <span className="text-slate-500">Format Version:</span>
                <span className="text-foreground">v1 (Zero-Knowledge)</span>
              </div>
              <div className="flex justify-between border-b border-surface-border/60 pb-1.5">
                <span className="text-slate-500">Encrypted File ID:</span>
                <span className="text-slate-400 font-mono text-[11px] truncate max-w-[200px]">
                  {activeFileDetails.id}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-500">Uploaded Date:</span>
                <span className="text-slate-400">
                  {new Date(activeFileDetails.createdAt).toLocaleString()}
                </span>
              </div>
            </div>

            <div className="flex justify-end gap-2 pt-2 border-t border-surface-border">
              <Button
                variant="primary"
                size="sm"
                onClick={() => {
                  handleDownload(activeFileDetails);
                }}
              >
                <Download className="w-3.5 h-3.5 mr-1.5" /> Decrypt & Download
              </Button>
            </div>
          </div>
        )}
      </Dialog>

      {/* Share Modal */}
      <Dialog
        isOpen={!!shareTarget}
        onClose={() => {
          setShareTarget(null);
          setCopiedShare(false);
        }}
        title="Zero-Knowledge Secure Share"
      >
        {shareTarget && (
          <div className="space-y-4 pt-2">
            <p className="text-xs text-slate-500">
              Files are zero-knowledge encrypted on the server. To share{" "}
              <span className="font-semibold text-foreground">{shareTarget.name}</span>, a secure reference link is generated:
            </p>

            <div className="flex items-center gap-2 p-2.5 rounded-xl bg-surface-raised border border-surface-border text-xs font-mono">
              <input
                type="text"
                readOnly
                value={typeof window !== "undefined" ? `${window.location.origin}/dashboard/files?shared=${shareTarget.id}` : ""}
                className="w-full bg-transparent text-slate-400 focus:outline-none"
              />
              <Button
                variant="secondary"
                size="sm"
                onClick={() => {
                  navigator.clipboard.writeText(
                    `${window.location.origin}/dashboard/files?shared=${shareTarget.id}`
                  );
                  setCopiedShare(true);
                  setTimeout(() => setCopiedShare(false), 2000);
                }}
                className="py-1 px-2.5 text-xs shrink-0"
              >
                {copiedShare ? (
                  <>
                    <Check className="w-3.5 h-3.5 text-emerald-400 mr-1" /> Copied
                  </>
                ) : (
                  <>
                    <Copy className="w-3.5 h-3.5 mr-1" /> Copy Link
                  </>
                )}
              </Button>
            </div>

            <div className="p-3 rounded-xl bg-amber-500/10 border border-amber-500/20 text-[11px] text-amber-700 dark:text-amber-300 space-y-1">
              <div className="font-semibold flex items-center gap-1.5">
                <Shield className="w-3.5 h-3.5 text-amber-500" /> End-to-End Encryption Note
              </div>
              <p>
                Recipients must have an authorized CloudVault session and possess decryption credentials to read the file contents.
              </p>
            </div>
          </div>
        )}
      </Dialog>

      {/* In-browser Preview Modal */}
      <Dialog
        isOpen={!!previewTarget}
        onClose={closePreview}
        title={previewTarget?.name || "File Preview"}
      >
        <div className="space-y-4 pt-2">
          {previewLoading ? (
            <div className="py-16 flex flex-col items-center justify-center text-slate-400 space-y-3">
              <div className="w-6 h-6 border-2 border-[rgb(240_158_79)] border-t-transparent rounded-full animate-spin" />
              <p className="text-xs font-mono text-slate-500">
                Fetching ciphertext and decrypting in browser...
              </p>
            </div>
          ) : previewUrl ? (
            <div className="rounded-xl overflow-hidden border border-surface-border bg-black/40 flex items-center justify-center max-h-[60vh]">
              <img
                src={previewUrl}
                alt={previewTarget?.name}
                className="max-h-[60vh] max-w-full object-contain"
              />
            </div>
          ) : previewTextContent !== null ? (
            <div className="rounded-xl overflow-hidden border border-surface-border bg-surface-raised p-3.5 max-h-[60vh] overflow-y-auto">
              <pre className="text-xs font-mono text-foreground whitespace-pre-wrap font-sans">
                {previewTextContent}
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

          {previewTarget && (
            <div className="p-3 rounded-xl bg-surface-raised border border-surface-border text-[11px] font-mono space-y-1 text-slate-500">
              <div className="flex justify-between">
                <span>File Size:</span>
                <span className="text-foreground">{formatSize(previewTarget.size)}</span>
              </div>
              <div className="flex justify-between">
                <span>Encryption:</span>
                <span className="text-[rgb(100_215_113)]">AES-256-GCM (Authenticated)</span>
              </div>
              <div className="flex justify-between">
                <span>MIME Type:</span>
                <span className="text-foreground truncate max-w-[200px]">
                  {previewTarget.type || "application/octet-stream"}
                </span>
              </div>
            </div>
          )}

          <div className="flex justify-end gap-2 pt-2 border-t border-surface-border">
            {previewTarget && (
              <Button
                variant="primary"
                size="sm"
                onClick={() => {
                  if (previewTarget) handleDownload(previewTarget);
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
