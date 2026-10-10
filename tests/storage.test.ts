import { describe, it, expect, beforeEach, afterEach } from "vitest";
import fs from "fs";
import path from "path";
import { LocalStorageProvider } from "@/lib/storage/local-storage-provider";

describe("LocalStorageProvider Security & Invariants", () => {
  const testDir = path.join(process.cwd(), "data", "test_objects");
  let provider: LocalStorageProvider;

  beforeEach(() => {
    if (fs.existsSync(testDir)) {
      fs.rmSync(testDir, { recursive: true, force: true });
    }
    provider = new LocalStorageProvider(testDir);
  });

  afterEach(() => {
    if (fs.existsSync(testDir)) {
      fs.rmSync(testDir, { recursive: true, force: true });
    }
  });

  it("stores and retrieves encrypted ciphertext atomically", async () => {
    const opaqueId = "obj_0123456789abcdef0123456789abcdef";
    const sampleCiphertext = Buffer.from("encrypted_bytes_payload_sample");

    const result = await provider.putEncryptedObject(opaqueId, sampleCiphertext);
    expect(result.size).toBe(sampleCiphertext.length);

    const exists = await provider.objectExists(opaqueId);
    expect(exists).toBe(true);

    const retrieved = await provider.getEncryptedObject(opaqueId);
    expect(retrieved).not.toBeNull();
    expect(retrieved?.equals(sampleCiphertext)).toBe(true);
  });

  it("strictly rejects path traversal attacks", async () => {
    const maliciousIds = [
      "../../etc/passwd",
      "../secret_file",
      "obj/../../traversal",
      "obj_123\\..\\windows",
      "obj with spaces 123",
      "short",
      "obj_*&^%$#@!",
    ];

    for (const badId of maliciousIds) {
      await expect(
        provider.putEncryptedObject(badId, Buffer.from("attack"))
      ).rejects.toThrow();

      await expect(provider.getEncryptedObject(badId)).rejects.toThrow();
    }
  });

  it("handles non-existent objects safely", async () => {
    const nonExistentId = "obj_nonexistent0123456789abcdef";
    const exists = await provider.objectExists(nonExistentId);
    expect(exists).toBe(false);

    const data = await provider.getEncryptedObject(nonExistentId);
    expect(data).toBeNull();

    const deleted = await provider.deleteEncryptedObject(nonExistentId);
    expect(deleted).toBe(false);
  });

  it("deletes objects cleanly", async () => {
    const opaqueId = "obj_delete_me_0123456789abcdef01";
    await provider.putEncryptedObject(opaqueId, Buffer.from("delete_me"));

    expect(await provider.objectExists(opaqueId)).toBe(true);

    const deleted = await provider.deleteEncryptedObject(opaqueId);
    expect(deleted).toBe(true);
    expect(await provider.objectExists(opaqueId)).toBe(false);
  });

  it("prevents overwriting existing objects (conflict guard)", async () => {
    const opaqueId = "obj_conflict_test_0123456789abcdef";
    await provider.putEncryptedObject(opaqueId, Buffer.from("original"));

    await expect(
      provider.putEncryptedObject(opaqueId, Buffer.from("overwrite"))
    ).rejects.toThrow(/conflict/i);
  });
});
