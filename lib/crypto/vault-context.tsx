"use client";

import React, { createContext, useContext, useState, useCallback, useEffect } from "react";
import {
  generateMasterKey,
  generateRecoverySecret,
  deriveKeyEncryptionKey,
  deriveRecoveryKey,
  encryptMasterKey,
  decryptMasterKey,
  encryptRecoveryEnvelope,
  decryptRecoveryEnvelope,
  generateSecureRandomBytes,
  bufferToBase64,
  base64ToBuffer,
  DEFAULT_KDF_PARAMS,
  KdfParameters,
  wrapFileKey,
  unwrapFileKey,
  deriveFileWrappingKey,
  encryptFileData,
  decryptFileData,
  encryptMetadata,
  decryptMetadata,
  encryptFolderName,
  decryptFolderName,
} from "./client-crypto";

export type VaultStatus = "LOADING" | "UNINITIALIZED" | "LOCKED" | "UNLOCKED";

export interface DecryptedFileInfo {
  id: string;
  name: string;
  size: number;
  type: string;
  ciphertextSize: number;
  folderId?: string | null;
  createdAt: string;
  updatedAt: string;
  encryptedFileKey: string;
  fileKeyWrappingNonce: string;
  fileEncryptionNonce: string;
  encryptedMetadata: string;
  metadataNonce: string;
}

export interface DecryptedFolderInfo {
  id: string;
  name: string;
  parentFolderId?: string | null;
  createdAt: string;
  updatedAt: string;
}

interface VaultContextType {
  status: VaultStatus;
  isUnlocked: boolean;
  masterKey: Uint8Array | null;
  hasVaultKey: boolean;
  refreshVaultStatus: () => Promise<void>;
  initializeVault: (passphrase: string) => Promise<{ recoverySecret: string }>;
  unlockVault: (passphrase: string) => Promise<boolean>;
  lockVault: () => void;
  recoverVault: (recoverySecret: string, newPassphrase: string) => Promise<boolean>;
  changePassphrase: (currentPassphrase: string, newPassphrase: string) => Promise<boolean>;
  // Cryptographic file operations
  prepareEncryptedUpload: (
    file: File,
    folderId?: string | null
  ) => Promise<{
    fileId: string;
    ciphertext: Uint8Array;
    encryptedFileKey: string;
    fileKeyWrappingNonce: string;
    fileEncryptionNonce: string;
    encryptedMetadata: string;
    metadataNonce: string;
    ciphertextSize: number;
    folderId?: string | null;
  }>;
  decryptDownloadedFile: (
    fileRecord: {
      id: string;
      encryptedFileKey: string;
      fileKeyWrappingNonce: string;
      fileEncryptionNonce: string;
      encryptedMetadata: string;
      metadataNonce: string;
    },
    ciphertext: ArrayBuffer
  ) => Promise<{ decryptedBlob: Blob; metadata: { name: string; type: string; size: number } }>;
  decryptFileMetadataItem: (fileRecord: {
    id: string;
    encryptedMetadata: string;
    metadataNonce: string;
    ciphertextSizeBytes: number;
    folderId?: string | null;
    createdAt: string;
    updatedAt: string;
    encryptedFileKey: string;
    fileKeyWrappingNonce: string;
    fileEncryptionNonce: string;
  }) => Promise<DecryptedFileInfo>;
  decryptFolderItem: (folderRecord: {
    id: string;
    encryptedFolderName: string;
    nameNonce: string;
    parentFolderId?: string | null;
    createdAt: string;
    updatedAt: string;
  }) => Promise<DecryptedFolderInfo>;
  createEncryptedFolderPayload: (folderName: string) => Promise<{
    encryptedFolderName: string;
    nameNonce: string;
  }>;
  createEncryptedFileRenamePayload: (
    file: DecryptedFileInfo,
    newName: string
  ) => Promise<{
    encryptedMetadata: string;
    metadataNonce: string;
  }>;
}

const VaultContext = createContext<VaultContextType | null>(null);

// Transient in-memory key buffer for the active tab (scrubbed on lock/logout, never persisted to disk or storage)
let transientInMemoryMasterKey: Uint8Array | null = null;

export function VaultProvider({ children }: { children: React.ReactNode }) {
  const [masterKey, setMasterKey] = useState<Uint8Array | null>(() => transientInMemoryMasterKey);
  const [status, setStatus] = useState<VaultStatus>(() =>
    transientInMemoryMasterKey ? "UNLOCKED" : "LOADING"
  );
  const [hasVaultKey, setHasVaultKey] = useState<boolean>(false);

  const refreshVaultStatus = useCallback(async () => {
    try {
      const res = await fetch("/api/vault/envelope");
      if (res.status === 401) {
        setStatus("LOCKED");
        return;
      }
      const data = await res.json();
      if (data.initialized) {
        setHasVaultKey(true);
        setStatus(transientInMemoryMasterKey ? "UNLOCKED" : "LOCKED");
      } else {
        setHasVaultKey(false);
        setStatus("UNINITIALIZED");
      }
    } catch {
      setStatus("LOCKED");
    }
  }, []);

  useEffect(() => {
    refreshVaultStatus();
  }, [refreshVaultStatus]);

  const lockVault = useCallback(() => {
    if (transientInMemoryMasterKey) {
      try {
        transientInMemoryMasterKey.fill(0);
      } catch {
        // ignore
      }
      transientInMemoryMasterKey = null;
    }
    if (masterKey) {
      try {
        masterKey.fill(0);
      } catch {
        // ignore
      }
    }
    setMasterKey(null);
    setStatus("LOCKED");
  }, [masterKey]);

  const initializeVault = useCallback(
    async (passphrase: string): Promise<{ recoverySecret: string }> => {
      // 1. Generate master key
      const generatedMasterKey = generateMasterKey();

      // 2. Derive KEK via Argon2id
      const salt = generateSecureRandomBytes(16);
      const kek = await deriveKeyEncryptionKey(passphrase, salt, DEFAULT_KDF_PARAMS);

      // 3. Encrypt master key
      const masterEnvelope = await encryptMasterKey(generatedMasterKey, kek);

      // 4. Generate recovery secret & derive recovery key
      const recoverySecret = generateRecoverySecret();
      const recoveryKey = await deriveRecoveryKey(recoverySecret);

      // 5. Encrypt master key under recovery key
      const recoveryEnvelope = await encryptRecoveryEnvelope(generatedMasterKey, recoveryKey);

      // 6. Submit to backend
      const res = await fetch("/api/vault/initialize", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          encryptedMasterKey: bufferToBase64(masterEnvelope.ciphertext),
          keyEncryptionNonce: bufferToBase64(masterEnvelope.nonce),
          kdfSalt: bufferToBase64(salt),
          kdfParams: JSON.stringify(DEFAULT_KDF_PARAMS),
          formatVersion: 1,
          encryptedRecoveryKey: bufferToBase64(recoveryEnvelope.ciphertext),
          recoveryNonce: bufferToBase64(recoveryEnvelope.nonce),
        }),
      });

      if (!res.ok) {
        const err = await res.json().catch(() => ({ error: "Initialization failed" }));
        throw new Error(err.error || "Initialization failed");
      }

      transientInMemoryMasterKey = generatedMasterKey;
      setMasterKey(generatedMasterKey);
      setHasVaultKey(true);
      setStatus("UNLOCKED");

      return { recoverySecret };
    },
    []
  );

  const unlockVault = useCallback(async (passphrase: string): Promise<boolean> => {
    const res = await fetch("/api/vault/envelope");
    if (!res.ok) throw new Error("Could not retrieve vault key envelope.");
    const envelope = await res.json();

    if (!envelope.initialized) {
      throw new Error("Vault is not initialized.");
    }

    const salt = base64ToBuffer(envelope.kdfSalt);
    const params: KdfParameters = JSON.parse(envelope.kdfParams);
    const kek = await deriveKeyEncryptionKey(passphrase, salt, params);

    const ciphertext = base64ToBuffer(envelope.encryptedMasterKey);
    const nonce = base64ToBuffer(envelope.keyEncryptionNonce);

    const decryptedMasterKey = await decryptMasterKey(ciphertext, kek, nonce);
    transientInMemoryMasterKey = decryptedMasterKey;
    setMasterKey(decryptedMasterKey);
    setStatus("UNLOCKED");
    return true;
  }, []);

  const recoverVault = useCallback(
    async (recoverySecret: string, newPassphrase: string): Promise<boolean> => {
      const res = await fetch("/api/vault/envelope");
      if (!res.ok) throw new Error("Could not retrieve vault key envelope.");
      const envelope = await res.json();

      const recoveryKey = await deriveRecoveryKey(recoverySecret);
      const ciphertext = base64ToBuffer(envelope.encryptedRecoveryKey);
      const nonce = base64ToBuffer(envelope.recoveryNonce);

      const recoveredMasterKey = await decryptRecoveryEnvelope(ciphertext, recoveryKey, nonce);

      // Re-encrypt under new passphrase
      const newSalt = generateSecureRandomBytes(16);
      const newKek = await deriveKeyEncryptionKey(newPassphrase, newSalt, DEFAULT_KDF_PARAMS);
      const newMasterEnvelope = await encryptMasterKey(recoveredMasterKey, newKek);

      const updateRes = await fetch("/api/vault/update-envelope", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          encryptedMasterKey: bufferToBase64(newMasterEnvelope.ciphertext),
          keyEncryptionNonce: bufferToBase64(newMasterEnvelope.nonce),
          kdfSalt: bufferToBase64(newSalt),
          kdfParams: JSON.stringify(DEFAULT_KDF_PARAMS),
        }),
      });

      if (!updateRes.ok) {
        throw new Error("Failed to save updated vault envelope.");
      }

      transientInMemoryMasterKey = recoveredMasterKey;
      setMasterKey(recoveredMasterKey);
      setStatus("UNLOCKED");
      return true;
    },
    []
  );

  const changePassphrase = useCallback(
    async (currentPassphrase: string, newPassphrase: string): Promise<boolean> => {
      if (!masterKey) throw new Error("Vault must be unlocked to change passphrase.");

      // Verify current passphrase
      const res = await fetch("/api/vault/envelope");
      const envelope = await res.json();
      const salt = base64ToBuffer(envelope.kdfSalt);
      const params: KdfParameters = JSON.parse(envelope.kdfParams);
      const currentKek = await deriveKeyEncryptionKey(currentPassphrase, salt, params);

      // Attempt decrypt to verify correctness
      await decryptMasterKey(
        base64ToBuffer(envelope.encryptedMasterKey),
        currentKek,
        base64ToBuffer(envelope.keyEncryptionNonce)
      );

      // Derive new KEK and encrypt
      const newSalt = generateSecureRandomBytes(16);
      const newKek = await deriveKeyEncryptionKey(newPassphrase, newSalt, DEFAULT_KDF_PARAMS);
      const newEnvelope = await encryptMasterKey(masterKey, newKek);

      const updateRes = await fetch("/api/vault/update-envelope", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          encryptedMasterKey: bufferToBase64(newEnvelope.ciphertext),
          keyEncryptionNonce: bufferToBase64(newEnvelope.nonce),
          kdfSalt: bufferToBase64(newSalt),
          kdfParams: JSON.stringify(DEFAULT_KDF_PARAMS),
        }),
      });

      return updateRes.ok;
    },
    [masterKey]
  );

  const prepareEncryptedUpload = useCallback(
    async (file: File, folderId?: string | null) => {
      if (!masterKey) throw new Error("Vault is locked. Unlock vault to upload files.");

      const fileId = crypto.randomUUID();
      const fekBytes = generateSecureRandomBytes(32);

      // Encrypt file data
      const arrayBuffer = await file.arrayBuffer();
      const fileEncResult = await encryptFileData(arrayBuffer, fekBytes, fileId);

      // Derive HKDF wrapping key and wrap FEK
      const wrappingKey = await deriveFileWrappingKey(masterKey, fileId);
      const wrappedKeyResult = await wrapFileKey(fekBytes, wrappingKey, fileId);

      // Encrypt metadata
      const metaResult = await encryptMetadata(
        {
          name: file.name,
          size: file.size,
          type: file.type || "application/octet-stream",
          lastModified: file.lastModified,
        },
        masterKey
      );

      return {
        fileId,
        ciphertext: fileEncResult.ciphertext,
        encryptedFileKey: bufferToBase64(wrappedKeyResult.wrappedKey),
        fileKeyWrappingNonce: bufferToBase64(wrappedKeyResult.nonce),
        fileEncryptionNonce: bufferToBase64(fileEncResult.nonce),
        encryptedMetadata: metaResult.encryptedMetadata,
        metadataNonce: metaResult.metadataNonce,
        ciphertextSize: fileEncResult.ciphertext.byteLength,
        folderId: folderId || null,
      };
    },
    [masterKey]
  );

  const decryptDownloadedFile = useCallback(
    async (
      fileRecord: {
        id: string;
        encryptedFileKey: string;
        fileKeyWrappingNonce: string;
        fileEncryptionNonce: string;
        encryptedMetadata: string;
        metadataNonce: string;
      },
      ciphertext: ArrayBuffer
    ) => {
      if (!masterKey) throw new Error("Vault is locked. Unlock vault to decrypt files.");

      // 1. Unwrap FEK
      const wrappingKey = await deriveFileWrappingKey(masterKey, fileRecord.id);
      const wrappedKeyBytes = base64ToBuffer(fileRecord.encryptedFileKey);
      const wrappingNonce = base64ToBuffer(fileRecord.fileKeyWrappingNonce);
      const fekBytes = await unwrapFileKey(
        wrappedKeyBytes,
        wrappingKey,
        wrappingNonce,
        fileRecord.id
      );

      // 2. Decrypt metadata
      const metadata = await decryptMetadata(
        fileRecord.encryptedMetadata,
        fileRecord.metadataNonce,
        masterKey
      );

      // 3. Decrypt file data
      const fileNonce = base64ToBuffer(fileRecord.fileEncryptionNonce);
      const decryptedBuffer = await decryptFileData(
        new Uint8Array(ciphertext),
        fekBytes,
        fileNonce,
        fileRecord.id
      );

      const blob = new Blob([decryptedBuffer], { type: metadata.type });
      return { decryptedBlob: blob, metadata };
    },
    [masterKey]
  );

  const decryptFileMetadataItem = useCallback(
    async (fileRecord: {
      id: string;
      encryptedMetadata: string;
      metadataNonce: string;
      ciphertextSizeBytes: number;
      folderId?: string | null;
      createdAt: string;
      updatedAt: string;
      encryptedFileKey: string;
      fileKeyWrappingNonce: string;
      fileEncryptionNonce: string;
    }): Promise<DecryptedFileInfo> => {
      if (!masterKey) {
        return {
          id: fileRecord.id,
          name: "[Locked]",
          size: fileRecord.ciphertextSizeBytes,
          type: "application/octet-stream",
          ciphertextSize: fileRecord.ciphertextSizeBytes,
          folderId: fileRecord.folderId,
          createdAt: fileRecord.createdAt,
          updatedAt: fileRecord.updatedAt,
          encryptedFileKey: fileRecord.encryptedFileKey,
          fileKeyWrappingNonce: fileRecord.fileKeyWrappingNonce,
          fileEncryptionNonce: fileRecord.fileEncryptionNonce,
          encryptedMetadata: fileRecord.encryptedMetadata,
          metadataNonce: fileRecord.metadataNonce,
        };
      }

      const meta = await decryptMetadata(
        fileRecord.encryptedMetadata,
        fileRecord.metadataNonce,
        masterKey
      );

      return {
        id: fileRecord.id,
        name: meta.name,
        size: meta.size,
        type: meta.type,
        ciphertextSize: fileRecord.ciphertextSizeBytes,
        folderId: fileRecord.folderId,
        createdAt: fileRecord.createdAt,
        updatedAt: fileRecord.updatedAt,
        encryptedFileKey: fileRecord.encryptedFileKey,
        fileKeyWrappingNonce: fileRecord.fileKeyWrappingNonce,
        fileEncryptionNonce: fileRecord.fileEncryptionNonce,
        encryptedMetadata: fileRecord.encryptedMetadata,
        metadataNonce: fileRecord.metadataNonce,
      };
    },
    [masterKey]
  );

  const decryptFolderItem = useCallback(
    async (folderRecord: {
      id: string;
      encryptedFolderName: string;
      nameNonce: string;
      parentFolderId?: string | null;
      createdAt: string;
      updatedAt: string;
    }): Promise<DecryptedFolderInfo> => {
      let name = "[Locked]";
      if (masterKey) {
        name = await decryptFolderName(
          folderRecord.encryptedFolderName,
          folderRecord.nameNonce,
          masterKey
        );
      }
      return {
        id: folderRecord.id,
        name,
        parentFolderId: folderRecord.parentFolderId,
        createdAt: folderRecord.createdAt,
        updatedAt: folderRecord.updatedAt,
      };
    },
    [masterKey]
  );

  const createEncryptedFolderPayload = useCallback(
    async (folderName: string) => {
      if (!masterKey) throw new Error("Vault is locked. Unlock vault to create folder.");
      return await encryptFolderName(folderName, masterKey);
    },
    [masterKey]
  );

  const createEncryptedFileRenamePayload = useCallback(
    async (file: DecryptedFileInfo, newName: string) => {
      if (!masterKey) throw new Error("Vault is locked. Unlock vault to rename file.");
      const updatedMetadata = {
        name: newName,
        size: file.size,
        type: file.type,
        lastModified: Date.now(),
      };
      return await encryptMetadata(updatedMetadata, masterKey);
    },
    [masterKey]
  );

  return (
    <VaultContext.Provider
      value={{
        status,
        isUnlocked: status === "UNLOCKED",
        masterKey,
        hasVaultKey,
        refreshVaultStatus,
        initializeVault,
        unlockVault,
        lockVault,
        recoverVault,
        changePassphrase,
        prepareEncryptedUpload,
        decryptDownloadedFile,
        decryptFileMetadataItem,
        decryptFolderItem,
        createEncryptedFolderPayload,
        createEncryptedFileRenamePayload,
      }}
    >
      {children}
    </VaultContext.Provider>
  );
}

export function useVault() {
  const context = useContext(VaultContext);
  if (!context) {
    throw new Error("useVault must be used within a VaultProvider");
  }
  return context;
}
