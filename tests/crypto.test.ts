import { describe, it, expect } from "vitest";
import {
  generateMasterKey,
  generateRecoverySecret,
  deriveKeyEncryptionKey,
  deriveRecoveryKey,
  encryptMasterKey,
  decryptMasterKey,
  encryptRecoveryEnvelope,
  decryptRecoveryEnvelope,
  deriveFileWrappingKey,
  wrapFileKey,
  unwrapFileKey,
  encryptFileData,
  decryptFileData,
  encryptMetadata,
  decryptMetadata,
  generateSecureRandomBytes,
  DEFAULT_KDF_PARAMS,
} from "../lib/crypto/client-crypto";

describe("CloudVault Zero-Knowledge Cryptographic Engine", () => {
  it("generates a fresh 256-bit (32-byte) master key", () => {
    const key1 = generateMasterKey();
    const key2 = generateMasterKey();

    expect(key1.byteLength).toBe(32);
    expect(key2.byteLength).toBe(32);
    expect(Buffer.from(key1).equals(Buffer.from(key2))).toBe(false);
  });

  it("generates formatted high-entropy recovery secrets", () => {
    const secret = generateRecoverySecret();
    expect(secret.startsWith("CV-")).toBe(true);
    expect(secret.length).toBeGreaterThanOrEqual(35);
  });

  it("encrypts and decrypts master key with passphrase-derived KEK", async () => {
    const masterKey = generateMasterKey();
    const passphrase = "TestSuperSecurePassphrase2026!";
    const salt = generateSecureRandomBytes(16);

    const kek = await deriveKeyEncryptionKey(passphrase, salt, DEFAULT_KDF_PARAMS);
    const { ciphertext, nonce } = await encryptMasterKey(masterKey, kek);

    // Ensure ciphertext does not match plaintext
    expect(Buffer.from(ciphertext).equals(Buffer.from(masterKey))).toBe(false);

    // Decrypt
    const decrypted = await decryptMasterKey(ciphertext, kek, nonce);
    expect(Buffer.from(decrypted).equals(Buffer.from(masterKey))).toBe(true);
  });

  it("fails to decrypt master key when given wrong passphrase", async () => {
    const masterKey = generateMasterKey();
    const salt = generateSecureRandomBytes(16);

    const kek = await deriveKeyEncryptionKey("CorrectPassphrase123!", salt, DEFAULT_KDF_PARAMS);
    const wrongKek = await deriveKeyEncryptionKey("WrongPassphrase456!", salt, DEFAULT_KDF_PARAMS);

    const { ciphertext, nonce } = await encryptMasterKey(masterKey, kek);

    await expect(decryptMasterKey(ciphertext, wrongKek, nonce)).rejects.toThrow(
      /Vault unlocking failed/
    );
  });

  it("detects ciphertext tampering and fails AES-GCM verification", async () => {
    const masterKey = generateMasterKey();
    const salt = generateSecureRandomBytes(16);
    const kek = await deriveKeyEncryptionKey("Passphrase123!", salt, DEFAULT_KDF_PARAMS);

    const { ciphertext, nonce } = await encryptMasterKey(masterKey, kek);

    // Tamper with one single byte of the ciphertext
    const tampered = new Uint8Array(ciphertext);
    tampered[0] ^= 0xff;

    await expect(decryptMasterKey(tampered, kek, nonce)).rejects.toThrow(
      /Vault unlocking failed/
    );
  });

  it("encrypts and decrypts recovery envelope successfully", async () => {
    const masterKey = generateMasterKey();
    const secret = generateRecoverySecret();

    const recoveryKey = await deriveRecoveryKey(secret);
    const { ciphertext, nonce } = await encryptRecoveryEnvelope(masterKey, recoveryKey);

    const recovered = await decryptRecoveryEnvelope(ciphertext, recoveryKey, nonce);
    expect(Buffer.from(recovered).equals(Buffer.from(masterKey))).toBe(true);
  });

  it("rejects invalid recovery secret", async () => {
    const masterKey = generateMasterKey();
    const validSecret = generateRecoverySecret();
    const invalidSecret = generateRecoverySecret();

    const recoveryKey = await deriveRecoveryKey(validSecret);
    const wrongRecoveryKey = await deriveRecoveryKey(invalidSecret);

    const { ciphertext, nonce } = await encryptRecoveryEnvelope(masterKey, recoveryKey);

    await expect(
      decryptRecoveryEnvelope(ciphertext, wrongRecoveryKey, nonce)
    ).rejects.toThrow(/Recovery failed/);
  });

  it("performs file-key wrapping, file encryption, and round-trip decryption", async () => {
    const masterKey = generateMasterKey();
    const fileId = "test-uuid-0001";
    const fek = generateSecureRandomBytes(32);

    // 1. Wrap FEK
    const wrappingKey = await deriveFileWrappingKey(masterKey, fileId);
    const { wrappedKey, nonce: wrapNonce } = await wrapFileKey(fek, wrappingKey, fileId);

    // 2. Encrypt plaintext payload
    const plaintext = new TextEncoder().encode("Hello CloudVault Zero-Knowledge Cryptography!").buffer;
    const { ciphertext, nonce: fileNonce } = await encryptFileData(plaintext, fek, fileId);

    expect(Buffer.from(ciphertext).equals(Buffer.from(plaintext))).toBe(false);

    // 3. Unwrap FEK
    const unwrappedFek = await unwrapFileKey(wrappedKey, wrappingKey, wrapNonce, fileId);
    expect(Buffer.from(unwrappedFek).equals(Buffer.from(fek))).toBe(true);

    // 4. Decrypt payload
    const decryptedBuffer = await decryptFileData(ciphertext, unwrappedFek, fileNonce, fileId);
    const decryptedText = new TextDecoder().decode(decryptedBuffer);

    expect(decryptedText).toBe("Hello CloudVault Zero-Knowledge Cryptography!");
  });

  it("rejects unwrapping when fileId context is altered (AAD binding check)", async () => {
    const masterKey = generateMasterKey();
    const fileId = "file-id-A";
    const alteredFileId = "file-id-B";
    const fek = generateSecureRandomBytes(32);

    const wrappingKey = await deriveFileWrappingKey(masterKey, fileId);
    const { wrappedKey, nonce } = await wrapFileKey(fek, wrappingKey, fileId);

    // Unwrapping under different file context must fail
    await expect(
      unwrapFileKey(wrappedKey, wrappingKey, nonce, alteredFileId)
    ).rejects.toThrow();
  });

  it("encrypts and decrypts file metadata without leaking original name", async () => {
    const masterKey = generateMasterKey();
    const meta = {
      name: "top-secret-financials.pdf",
      size: 1048576,
      type: "application/pdf",
    };

    const { encryptedMetadata, metadataNonce } = await encryptMetadata(meta, masterKey);

    // Verify plaintext name is not in the base64 string
    expect(encryptedMetadata.includes("top-secret-financials")).toBe(false);

    const decrypted = await decryptMetadata(encryptedMetadata, metadataNonce, masterKey);
    expect(decrypted.name).toBe("top-secret-financials.pdf");
    expect(decrypted.size).toBe(1048576);
    expect(decrypted.type).toBe("application/pdf");
  });

  it("generates unique 96-bit nonces on every encryption", () => {
    const nonces = new Set<string>();
    for (let i = 0; i < 50; i++) {
      const nonce = generateSecureRandomBytes(12);
      const hex = Buffer.from(nonce).toString("hex");
      expect(nonces.has(hex)).toBe(false);
      nonces.add(hex);
    }
  });
});
