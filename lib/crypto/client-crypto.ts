import { argon2id } from "hash-wasm";

export interface KdfParameters {
  algorithm: "argon2id";
  memorySize: number; // in KB
  iterations: number;
  parallelism: number;
  hashLength: number;
}

export const DEFAULT_KDF_PARAMS: KdfParameters = {
  algorithm: "argon2id",
  memorySize: 65536, // 64 MB
  iterations: 3,
  parallelism: 4,
  hashLength: 32, // 256 bits
};

// Helper for TypeScript DOM BufferSource compatibility
const toBS = (b: any): any => b;

// Utilities for ArrayBuffer, Base64, and Hex encoding/decoding
export function bufferToBase64(buffer: ArrayBuffer | Uint8Array): string {
  const bytes = buffer instanceof Uint8Array ? buffer : new Uint8Array(buffer);
  let binary = "";
  for (let i = 0; i < bytes.byteLength; i++) {
    binary += String.fromCharCode(bytes[i]);
  }
  return btoa(binary);
}

export function base64ToBuffer(base64: string): Uint8Array {
  const binary = atob(base64);
  const bytes = new Uint8Array(binary.length);
  for (let i = 0; i < binary.length; i++) {
    bytes[i] = binary.charCodeAt(i);
  }
  return bytes;
}

export function bufferToHex(buffer: ArrayBuffer | Uint8Array): string {
  const bytes = buffer instanceof Uint8Array ? buffer : new Uint8Array(buffer);
  return Array.from(bytes)
    .map((b) => b.toString(16).padStart(2, "0"))
    .join("");
}

export function hexToBuffer(hex: string): Uint8Array {
  const cleanHex = hex.replace(/[^0-9a-fA-F]/g, "");
  const bytes = new Uint8Array(cleanHex.length / 2);
  for (let i = 0; i < cleanHex.length; i += 2) {
    bytes[i / 2] = parseInt(cleanHex.substring(i, i + 2), 16);
  }
  return bytes;
}

export function generateSecureRandomBytes(length: number): Uint8Array {
  const bytes = new Uint8Array(length);
  crypto.getRandomValues(bytes);
  return bytes;
}

/**
 * Derives a 256-bit Key-Encryption Key (KEK) using browser-compatible Argon2id.
 */
export async function deriveKeyEncryptionKey(
  passphrase: string,
  salt: Uint8Array,
  params: KdfParameters = DEFAULT_KDF_PARAMS
): Promise<Uint8Array> {
  const derivedHex = await argon2id({
    password: passphrase,
    salt,
    iterations: params.iterations,
    memorySize: params.memorySize,
    parallelism: params.parallelism,
    hashLength: params.hashLength,
    outputType: "hex",
  });
  return hexToBuffer(derivedHex);
}

/**
 * Derives a 256-bit Recovery Encryption Key from a recovery secret string.
 */
export async function deriveRecoveryKey(recoverySecret: string): Promise<Uint8Array> {
  const encoder = new TextEncoder();
  const secretBytes = encoder.encode(recoverySecret.trim().toUpperCase().replace(/-/g, ""));
  const hash = await crypto.subtle.digest("SHA-256", toBS(secretBytes));
  return new Uint8Array(hash);
}

/**
 * Generates an independent, high-entropy 256-bit recovery secret formatted with grouped chunks.
 */
export function generateRecoverySecret(): string {
  const bytes = generateSecureRandomBytes(16); // 128 bits of true entropy
  const hex = bufferToHex(bytes).toUpperCase();
  const chunks = hex.match(/.{1,4}/g) || [];
  return `CV-${chunks.join("-")}`;
}

/**
 * Generates a fresh 256-bit master encryption key.
 */
export function generateMasterKey(): Uint8Array {
  return generateSecureRandomBytes(32);
}

/**
 * Encrypts the raw master key with a KEK (derived from passphrase) using AES-256-GCM.
 */
export async function encryptMasterKey(
  masterKeyBytes: Uint8Array,
  kekBytes: Uint8Array
): Promise<{ ciphertext: Uint8Array; nonce: Uint8Array }> {
  const nonce = generateSecureRandomBytes(12); // 96-bit nonce
  const kekCryptoKey = await crypto.subtle.importKey(
    "raw",
    toBS(kekBytes),
    { name: "AES-GCM" },
    false,
    ["encrypt"]
  );

  const aad = new TextEncoder().encode("CloudVault-MasterKey-v1");
  const ciphertextBuffer = await crypto.subtle.encrypt(
    {
      name: "AES-GCM",
      iv: toBS(nonce),
      additionalData: toBS(aad),
      tagLength: 128,
    },
    kekCryptoKey,
    toBS(masterKeyBytes)
  );

  return {
    ciphertext: new Uint8Array(ciphertextBuffer),
    nonce,
  };
}

/**
 * Decrypts the master key envelope using the KEK. Throws if passphrase is wrong or data tampered.
 */
export async function decryptMasterKey(
  ciphertextBytes: Uint8Array,
  kekBytes: Uint8Array,
  nonce: Uint8Array
): Promise<Uint8Array> {
  const kekCryptoKey = await crypto.subtle.importKey(
    "raw",
    toBS(kekBytes),
    { name: "AES-GCM" },
    false,
    ["decrypt"]
  );

  const aad = new TextEncoder().encode("CloudVault-MasterKey-v1");

  try {
    const decrypted = await crypto.subtle.decrypt(
      {
        name: "AES-GCM",
        iv: toBS(nonce),
        additionalData: toBS(aad),
        tagLength: 128,
      },
      kekCryptoKey,
      toBS(ciphertextBytes)
    );
    return new Uint8Array(decrypted);
  } catch {
    throw new Error("Vault unlocking failed: Incorrect passphrase or corrupted key envelope.");
  }
}

/**
 * Encrypts a copy of the master key under a recovery key.
 */
export async function encryptRecoveryEnvelope(
  masterKeyBytes: Uint8Array,
  recoveryKeyBytes: Uint8Array
): Promise<{ ciphertext: Uint8Array; nonce: Uint8Array }> {
  const nonce = generateSecureRandomBytes(12);
  const cryptoKey = await crypto.subtle.importKey(
    "raw",
    toBS(recoveryKeyBytes),
    { name: "AES-GCM" },
    false,
    ["encrypt"]
  );

  const aad = new TextEncoder().encode("CloudVault-RecoveryKey-v1");
  const ciphertextBuffer = await crypto.subtle.encrypt(
    {
      name: "AES-GCM",
      iv: toBS(nonce),
      additionalData: toBS(aad),
      tagLength: 128,
    },
    cryptoKey,
    toBS(masterKeyBytes)
  );

  return {
    ciphertext: new Uint8Array(ciphertextBuffer),
    nonce,
  };
}

/**
 * Decrypts the master key from the recovery envelope.
 */
export async function decryptRecoveryEnvelope(
  ciphertextBytes: Uint8Array,
  recoveryKeyBytes: Uint8Array,
  nonce: Uint8Array
): Promise<Uint8Array> {
  const cryptoKey = await crypto.subtle.importKey(
    "raw",
    toBS(recoveryKeyBytes),
    { name: "AES-GCM" },
    false,
    ["decrypt"]
  );

  const aad = new TextEncoder().encode("CloudVault-RecoveryKey-v1");

  try {
    const decrypted = await crypto.subtle.decrypt(
      {
        name: "AES-GCM",
        iv: toBS(nonce),
        additionalData: toBS(aad),
        tagLength: 128,
      },
      cryptoKey,
      toBS(ciphertextBytes)
    );
    return new Uint8Array(decrypted);
  } catch {
    throw new Error("Recovery failed: Invalid recovery secret or corrupted recovery envelope.");
  }
}

/**
 * Derives a purpose-specific wrapping key from the Master Key via HKDF using the fileId context.
 */
export async function deriveFileWrappingKey(
  masterKeyBytes: Uint8Array,
  fileId: string
): Promise<CryptoKey> {
  const baseKey = await crypto.subtle.importKey(
    "raw",
    toBS(masterKeyBytes),
    { name: "HKDF" },
    false,
    ["deriveKey"]
  );

  const info = new TextEncoder().encode(`CloudVault-FEK-Wrap-v1:${fileId}`);
  const salt = new TextEncoder().encode("CloudVault-HKDF-Salt-v1");

  return await crypto.subtle.deriveKey(
    {
      name: "HKDF",
      hash: "SHA-256",
      salt: toBS(salt),
      info: toBS(info),
    },
    baseKey,
    { name: "AES-GCM", length: 256 },
    false,
    ["encrypt", "decrypt"]
  );
}

/**
 * Wraps a 256-bit File Encryption Key (FEK) under the derived wrapping key.
 */
export async function wrapFileKey(
  fekBytes: Uint8Array,
  wrappingKey: CryptoKey,
  fileId: string
): Promise<{ wrappedKey: Uint8Array; nonce: Uint8Array }> {
  const nonce = generateSecureRandomBytes(12);
  const aad = new TextEncoder().encode(`CloudVault-FEK-AAD-v1:${fileId}`);

  const ciphertext = await crypto.subtle.encrypt(
    {
      name: "AES-GCM",
      iv: toBS(nonce),
      additionalData: toBS(aad),
      tagLength: 128,
    },
    wrappingKey,
    toBS(fekBytes)
  );

  return {
    wrappedKey: new Uint8Array(ciphertext),
    nonce,
  };
}

/**
 * Unwraps a File Encryption Key (FEK) using the derived wrapping key.
 */
export async function unwrapFileKey(
  wrappedKeyBytes: Uint8Array,
  wrappingKey: CryptoKey,
  nonce: Uint8Array,
  fileId: string
): Promise<Uint8Array> {
  const aad = new TextEncoder().encode(`CloudVault-FEK-AAD-v1:${fileId}`);

  try {
    const decrypted = await crypto.subtle.decrypt(
      {
        name: "AES-GCM",
        iv: toBS(nonce),
        additionalData: toBS(aad),
        tagLength: 128,
      },
      wrappingKey,
      toBS(wrappedKeyBytes)
    );
    return new Uint8Array(decrypted);
  } catch {
    throw new Error("Failed to unwrap file key: Corrupted key envelope or tampered file ID.");
  }
}

/**
 * Encrypts an ArrayBuffer of file data using AES-256-GCM.
 */
export async function encryptFileData(
  fileData: ArrayBuffer,
  fekBytes: Uint8Array,
  fileId: string
): Promise<{ ciphertext: Uint8Array; nonce: Uint8Array }> {
  const nonce = generateSecureRandomBytes(12);
  const fekCryptoKey = await crypto.subtle.importKey(
    "raw",
    toBS(fekBytes),
    { name: "AES-GCM" },
    false,
    ["encrypt"]
  );

  const aad = new TextEncoder().encode(`CloudVault-FileContent-v1:${fileId}`);
  const ciphertextBuffer = await crypto.subtle.encrypt(
    {
      name: "AES-GCM",
      iv: toBS(nonce),
      additionalData: toBS(aad),
      tagLength: 128,
    },
    fekCryptoKey,
    toBS(fileData)
  );

  return {
    ciphertext: new Uint8Array(ciphertextBuffer),
    nonce,
  };
}

/**
 * Decrypts file ciphertext using AES-256-GCM.
 */
export async function decryptFileData(
  ciphertextBytes: Uint8Array,
  fekBytes: Uint8Array,
  nonce: Uint8Array,
  fileId: string
): Promise<ArrayBuffer> {
  const fekCryptoKey = await crypto.subtle.importKey(
    "raw",
    toBS(fekBytes),
    { name: "AES-GCM" },
    false,
    ["decrypt"]
  );

  const aad = new TextEncoder().encode(`CloudVault-FileContent-v1:${fileId}`);

  try {
    return await crypto.subtle.decrypt(
      {
        name: "AES-GCM",
        iv: toBS(nonce),
        additionalData: toBS(aad),
        tagLength: 128,
      },
      fekCryptoKey,
      toBS(ciphertextBytes)
    );
  } catch {
    throw new Error("File decryption failed: Invalid ciphertext or authentication tag mismatch.");
  }
}

/**
 * Encrypts metadata (filename, mimeType, size) using the Master Key.
 */
export async function encryptMetadata(
  metadata: { name: string; size: number; type: string; lastModified?: number },
  masterKeyBytes: Uint8Array
): Promise<{ encryptedMetadata: string; metadataNonce: string }> {
  const nonce = generateSecureRandomBytes(12);
  const cryptoKey = await crypto.subtle.importKey(
    "raw",
    toBS(masterKeyBytes),
    { name: "AES-GCM" },
    false,
    ["encrypt"]
  );

  const jsonBytes = new TextEncoder().encode(JSON.stringify(metadata));
  const aad = new TextEncoder().encode("CloudVault-Metadata-v1");

  const encrypted = await crypto.subtle.encrypt(
    {
      name: "AES-GCM",
      iv: toBS(nonce),
      additionalData: toBS(aad),
      tagLength: 128,
    },
    cryptoKey,
    toBS(jsonBytes)
  );

  return {
    encryptedMetadata: bufferToBase64(encrypted),
    metadataNonce: bufferToBase64(nonce),
  };
}

/**
 * Decrypts metadata envelope using the Master Key.
 */
export async function decryptMetadata(
  encryptedMetadataBase64: string,
  metadataNonceBase64: string,
  masterKeyBytes: Uint8Array
): Promise<{ name: string; size: number; type: string; lastModified?: number }> {
  const ciphertext = base64ToBuffer(encryptedMetadataBase64);
  const nonce = base64ToBuffer(metadataNonceBase64);

  const cryptoKey = await crypto.subtle.importKey(
    "raw",
    toBS(masterKeyBytes),
    { name: "AES-GCM" },
    false,
    ["decrypt"]
  );

  const aad = new TextEncoder().encode("CloudVault-Metadata-v1");

  try {
    const decrypted = await crypto.subtle.decrypt(
      {
        name: "AES-GCM",
        iv: toBS(nonce),
        additionalData: toBS(aad),
        tagLength: 128,
      },
      cryptoKey,
      toBS(ciphertext)
    );
    const jsonStr = new TextDecoder().decode(decrypted);
    return JSON.parse(jsonStr);
  } catch {
    return {
      name: "[Corrupted Encrypted Filename]",
      size: 0,
      type: "application/octet-stream",
    };
  }
}

/**
 * Encrypts a folder name using the Master Key.
 */
export async function encryptFolderName(
  folderName: string,
  masterKeyBytes: Uint8Array
): Promise<{ encryptedFolderName: string; nameNonce: string }> {
  const nonce = generateSecureRandomBytes(12);
  const cryptoKey = await crypto.subtle.importKey(
    "raw",
    toBS(masterKeyBytes),
    { name: "AES-GCM" },
    false,
    ["encrypt"]
  );

  const nameBytes = new TextEncoder().encode(folderName);
  const aad = new TextEncoder().encode("CloudVault-FolderName-v1");

  const encrypted = await crypto.subtle.encrypt(
    {
      name: "AES-GCM",
      iv: toBS(nonce),
      additionalData: toBS(aad),
      tagLength: 128,
    },
    cryptoKey,
    toBS(nameBytes)
  );

  return {
    encryptedFolderName: bufferToBase64(encrypted),
    nameNonce: bufferToBase64(nonce),
  };
}

/**
 * Decrypts a folder name using the Master Key.
 */
export async function decryptFolderName(
  encryptedFolderNameBase64: string,
  nameNonceBase64: string,
  masterKeyBytes: Uint8Array
): Promise<string> {
  const ciphertext = base64ToBuffer(encryptedFolderNameBase64);
  const nonce = base64ToBuffer(nameNonceBase64);

  const cryptoKey = await crypto.subtle.importKey(
    "raw",
    toBS(masterKeyBytes),
    { name: "AES-GCM" },
    false,
    ["decrypt"]
  );

  const aad = new TextEncoder().encode("CloudVault-FolderName-v1");

  try {
    const decrypted = await crypto.subtle.decrypt(
      {
        name: "AES-GCM",
        iv: toBS(nonce),
        additionalData: toBS(aad),
        tagLength: 128,
      },
      cryptoKey,
      toBS(ciphertext)
    );
    return new TextDecoder().decode(decrypted);
  } catch {
    return "[Corrupted Folder Name]";
  }
}
