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
  Image,
  Archive,
  FileSpreadsheet,
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
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Modals state
  const [isCreateFolderOpen, setIsCreateFolderOpen] = useState(false);
  const [newFolderName, setNewFolderName] = useState("");

  const [activeFileDetails, setActiveFileDetails] = useState<DecryptedFileInfo | null>(null);
  const [renameTarget, setRenameTarget] = useState<DecryptedFileInfo | null>(null);
  const [newRenameValue, setNewRenameValue] = useState("");

  const [moveTarget, setMoveTarget] = useState<DecryptedFileInfo | null>(null);
  const [selectedDestinationFolder, setSelectedDestinationFolder] = useState<string>("root");

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
      return <Image className="w-4 h-4 text-purple-400 shrink-0" />;
    }
    if (["ts", "tsx", "js", "jsx", "py", "rs", "go", "json", "html", "css", "sql"].includes(ext || "")) {
      return <FileCode className="w-4 h-4 text-emerald-400 shrink-0" />;
    }
    if (["zip", "tar", "gz", "7z", "rar"].includes(ext || "")) {
      return <Archive className="w-4 h-4 text-amber-400 shrink-0" />;
    }
    if (["csv", "xlsx", "xls"].includes(ext || "")) {
      return <FileSpreadsheet className="w-4 h-4 text-teal-400 shrink-0" />;
    }
    if (["pdf", "txt", "md", "doc", "docx"].includes(ext || "")) {
      return <FileText className="w-4 h-4 text-sky-400 shrink-0" />;
    }
    return <FileIcon className="w-4 h-4 text-brand-400 shrink-0" />;
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

        // Decrypt files metadata
        const decFiles = await Promise.all(
          (fData.files || []).map((f: any) => decryptFileMetadataItem(f))
        );

        // Decrypt folder names
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
    <div className="max-w-7xl mx-auto space-y-6">
        {/* Header with Breadcrumbs & Action Buttons */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <h1 className="text-2xl font-bold text-white tracking-tight">My Files</h1>
            {/* Breadcrumb Trail */}
            <div className="flex items-center gap-1.5 text-xs text-slate-400 mt-1 font-mono">
              {folderBreadcrumbs.map((bc, idx) => (
                <React.Fragment key={bc.id || "root"}>
                  {idx > 0 && <ChevronRight className="w-3.5 h-3.5 text-slate-600" />}
                  <button
                    onClick={() => navigateBreadcrumb(idx)}
                    className={`hover:text-brand-400 transition-colors ${
                      idx === folderBreadcrumbs.length - 1 ? "text-slate-200 font-semibold" : ""
                    }`}
                  >
                    {bc.name}
                  </button>
                </React.Fragment>
              ))}
            </div>
          </div>

          <div className="flex items-center gap-3">
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
              <FolderPlus className="w-4 h-4 mr-1.5 text-brand-400" /> New Folder
            </Button>

            <Button
              variant="primary"
              size="sm"
              disabled={!isUnlocked}
              onClick={() => fileInputRef.current?.click()}
            >
              <Upload className="w-4 h-4 mr-1.5" /> Upload Files
            </Button>
          </div>
        </div>

        {errorMessage && (
          <div className="p-3.5 rounded-lg bg-red-500/10 border border-red-500/30 text-xs text-red-400">
            {errorMessage}
          </div>
        )}

        {/* Upload Progress Bar if active */}
        {uploading && (
          <Card className="p-4 bg-slate-900 border-brand-500/40 space-y-2">
            <div className="flex items-center justify-between text-xs font-mono text-brand-400">
              <span>{uploadStatus}</span>
              <span>{uploadProgress}%</span>
            </div>
            <Progress value={uploadProgress} />
          </Card>
        )}

        {/* Filter and View Controls Toolbar */}
        <div className="flex flex-col sm:flex-row items-center justify-between gap-3 bg-surface/40 p-3 rounded-xl border border-surface-border">
          <div className="relative w-full sm:w-72">
            <Search className="w-4 h-4 text-slate-500 absolute left-3 top-2.5" />
            <input
              type="text"
              placeholder="Search decrypted files..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full bg-slate-900/80 border border-surface-border rounded-lg pl-9 pr-3 py-1.5 text-xs text-slate-100 placeholder-slate-500 focus:outline-none focus:border-brand-500"
            />
          </div>

          <div className="flex items-center gap-2 self-end sm:self-auto">
            {/* Sort Dropdown */}
            <div className="flex items-center gap-1 bg-slate-900 border border-surface-border rounded-lg px-2 py-1 text-xs text-slate-400">
              <ArrowUpDown className="w-3.5 h-3.5 mr-1" />
              <select
                value={sortBy}
                onChange={(e) => setSortBy(e.target.value as any)}
                className="bg-transparent text-slate-200 focus:outline-none cursor-pointer"
              >
                <option value="name" className="bg-slate-900">Name</option>
                <option value="size" className="bg-slate-900">Size</option>
                <option value="date" className="bg-slate-900">Date</option>
              </select>
              <button
                onClick={() => setSortOrder(sortOrder === "asc" ? "desc" : "asc")}
                className="ml-1 text-[11px] font-mono hover:text-white"
              >
                {sortOrder.toUpperCase()}
              </button>
            </div>

            {/* View Toggle */}
            <div className="flex items-center bg-slate-900 border border-surface-border rounded-lg p-0.5">
              <button
                onClick={() => setViewMode("list")}
                className={`p-1.5 rounded ${viewMode === "list" ? "bg-slate-800 text-brand-400" : "text-slate-500 hover:text-slate-300"}`}
              >
                <List className="w-4 h-4" />
              </button>
              <button
                onClick={() => setViewMode("grid")}
                className={`p-1.5 rounded ${viewMode === "grid" ? "bg-slate-800 text-brand-400" : "text-slate-500 hover:text-slate-300"}`}
              >
                <Grid className="w-4 h-4" />
              </button>
            </div>
          </div>
        </div>

        {/* Folders Section */}
        {folders.length > 0 && (
          <div className="space-y-3">
            <h2 className="text-xs font-semibold uppercase tracking-wider text-slate-400">
              Folders
            </h2>
            <div className="grid grid-cols-2 sm:grid-cols-4 md:grid-cols-6 gap-3">
              {folders.map((folder) => (
                <div
                  key={folder.id}
                  className="group bg-surface/70 hover:bg-slate-800/80 border border-surface-border rounded-xl p-3 flex items-center justify-between cursor-pointer transition-all shadow-sm"
                  onClick={() => enterFolder(folder)}
                >
                  <div className="flex items-center gap-2.5 min-w-0">
                    <Folder className="w-5 h-5 text-brand-400 shrink-0" />
                    <span className="text-xs font-medium text-slate-200 truncate">
                      {folder.name}
                    </span>
                  </div>
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      handleDeleteFolder(folder.id);
                    }}
                    className="opacity-0 group-hover:opacity-100 p-1 text-slate-500 hover:text-rose-400 transition-opacity"
                    title="Delete folder"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Files Content Section */}
        <div className="space-y-3">
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
              <FileIcon className="w-10 h-10 text-slate-600 mx-auto" />
              <p className="text-sm text-slate-400">No encrypted files found in this folder.</p>
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
                <table className="w-full text-left text-xs text-slate-300">
                  <thead className="bg-slate-900/80 text-slate-400 border-b border-surface-border uppercase font-mono text-[11px]">
                    <tr>
                      <th className="px-4 py-3">File Name</th>
                      <th className="px-4 py-3">Size</th>
                      <th className="px-4 py-3">Type</th>
                      <th className="px-4 py-3">Encrypted At</th>
                      <th className="px-4 py-3 text-right">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-surface-border/40">
                    {filteredFiles.map((file) => (
                      <tr key={file.id} className="hover:bg-slate-800/40 transition-colors group">
                        <td className="px-4 py-3.5 font-medium text-slate-100 flex items-center gap-2.5">
                          {getFileTypeIcon(file.name, file.type)}
                          <span className="truncate max-w-xs group-hover:text-brand-300 transition-colors">{file.name}</span>
                        </td>
                        <td className="px-4 py-3 font-mono text-slate-400">
                          {formatSize(file.size || file.ciphertextSize)}
                        </td>
                        <td className="px-4 py-3 text-slate-500 font-mono text-[11px] truncate max-w-[120px]">
                          {file.type}
                        </td>
                        <td className="px-4 py-3 text-slate-500 font-mono text-[11px]">
                          {new Date(file.createdAt).toLocaleDateString()}
                        </td>
                        <td className="px-4 py-3 text-right">
                          <div className="flex items-center justify-end gap-1">
                            <button
                              onClick={() => handleDownload(file)}
                              className="p-1.5 text-slate-400 hover:text-brand-400 transition-colors"
                              title="Decrypt & Download"
                            >
                              <Download className="w-4 h-4" />
                            </button>
                            <button
                              onClick={() => setMoveTarget(file)}
                              className="p-1.5 text-slate-400 hover:text-slate-200 transition-colors"
                              title="Move to folder"
                            >
                              <MoveRight className="w-4 h-4" />
                            </button>
                            <button
                              onClick={() => setActiveFileDetails(file)}
                              className="p-1.5 text-slate-400 hover:text-sky-400 transition-colors"
                              title="Cryptographic Details"
                            >
                              <Info className="w-4 h-4" />
                            </button>
                            <button
                              onClick={() => handleDeleteFile(file.id)}
                              className="p-1.5 text-slate-400 hover:text-rose-400 transition-colors"
                              title="Delete Object"
                            >
                              <Trash2 className="w-4 h-4" />
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
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
              {filteredFiles.map((file) => (
                <Card key={file.id} className="p-4 space-y-3 hover:border-brand-500/40 hover:-translate-y-0.5 transition-all flex flex-col justify-between group">
                  <div className="flex items-start justify-between gap-2">
                    <div className="w-10 h-10 rounded-xl bg-slate-800/80 border border-slate-700/80 flex items-center justify-center shrink-0 group-hover:border-brand-500/30 transition-colors">
                      {getFileTypeIcon(file.name, file.type)}
                    </div>
                    <div className="flex items-center gap-1">
                      <button
                        onClick={() => handleDownload(file)}
                        className="p-1 text-slate-400 hover:text-brand-400"
                        title="Download"
                      >
                        <Download className="w-4 h-4" />
                      </button>
                      <button
                        onClick={() => handleDeleteFile(file.id)}
                        className="p-1 text-slate-400 hover:text-rose-400"
                        title="Delete"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </div>

                  <div className="space-y-1">
                    <div className="text-sm font-semibold text-slate-100 truncate" title={file.name}>
                      {file.name}
                    </div>
                    <div className="text-xs text-slate-400 font-mono">
                      {formatSize(file.size || file.ciphertextSize)}
                    </div>
                  </div>

                  <div className="pt-2 border-t border-surface-border/60 flex items-center justify-between text-[11px] text-slate-500 font-mono">
                    <span>{new Date(file.createdAt).toLocaleDateString()}</span>
                    <button
                      onClick={() => setActiveFileDetails(file)}
                      className="text-brand-400 hover:underline flex items-center gap-1"
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

        {/* Dialog: Move File */}
        <Dialog
          isOpen={!!moveTarget}
          onClose={() => setMoveTarget(null)}
          title={`Move "${moveTarget?.name}"`}
        >
          <form onSubmit={handleMoveFile} className="space-y-4">
            <div className="space-y-1.5">
              <label className="block text-xs font-medium text-slate-300">
                Destination Folder
              </label>
              <select
                value={selectedDestinationFolder}
                onChange={(e) => setSelectedDestinationFolder(e.target.value)}
                className="w-full bg-slate-900 border border-surface-border text-slate-100 rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-brand-500"
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

        {/* Dialog: Cryptographic Details */}
        <Dialog
          isOpen={!!activeFileDetails}
          onClose={() => setActiveFileDetails(null)}
          title="Cryptographic File Details"
        >
          {activeFileDetails && (
            <div className="space-y-4 text-xs">
              <div className="p-3 bg-slate-900 rounded-lg border border-surface-border font-mono space-y-2">
                <div>
                  <span className="text-slate-500">File ID: </span>
                  <span className="text-slate-200">{activeFileDetails.id}</span>
                </div>
                <div>
                  <span className="text-slate-500">Ciphertext Size: </span>
                  <span className="text-slate-200">
                    {activeFileDetails.ciphertextSize} bytes
                  </span>
                </div>
                <div>
                  <span className="text-slate-500">Wrapping Nonce (Base64): </span>
                  <span className="text-brand-300 break-all">
                    {activeFileDetails.fileKeyWrappingNonce}
                  </span>
                </div>
                <div>
                  <span className="text-slate-500">File AES-GCM Nonce: </span>
                  <span className="text-brand-300 break-all">
                    {activeFileDetails.fileEncryptionNonce}
                  </span>
                </div>
                <div>
                  <span className="text-slate-500">Metadata Nonce: </span>
                  <span className="text-brand-300 break-all">
                    {activeFileDetails.metadataNonce}
                  </span>
                </div>
              </div>

              <div className="p-3 bg-emerald-500/10 border border-emerald-500/20 rounded-lg text-emerald-400 flex items-start gap-2">
                <CheckCircle2 className="w-4 h-4 shrink-0 mt-0.5" />
                <span>
                  The server stores only ciphertext and the wrapped key envelope. The plaintext key exists only in browser memory during download.
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
