import fs from "fs";
import path from "path";
import crypto from "crypto";
import { StorageProvider } from "./storage-provider";

const SAFE_ID_REGEX = /^[a-zA-Z0-9_-]{16,64}$/;

export class LocalStorageProvider implements StorageProvider {
  private baseDir: string;

  constructor(customBaseDir?: string) {
    const rawPath =
      customBaseDir ||
      process.env.LOCAL_STORAGE_PATH ||
      path.join(process.cwd(), "data", "objects");

    this.baseDir = path.resolve(rawPath);
    this.ensureDirectoryExists();
  }

  private ensureDirectoryExists(): void {
    if (!fs.existsSync(this.baseDir)) {
      fs.mkdirSync(this.baseDir, { recursive: true, mode: 0o700 });
    }
  }

  private resolveSafePath(opaqueId: string): string {
    if (!SAFE_ID_REGEX.test(opaqueId)) {
      throw new Error(`Invalid storage object identifier: '${opaqueId}'. Path traversal rejected.`);
    }

    const resolved = path.resolve(this.baseDir, opaqueId);

    // Prevent any directory traversal escaping baseDir
    if (!resolved.startsWith(this.baseDir) || path.dirname(resolved) !== this.baseDir) {
      throw new Error("Security violation: Attempted directory traversal outside storage root.");
    }

    return resolved;
  }

  public async putEncryptedObject(
    opaqueId: string,
    data: Buffer
  ): Promise<{ size: number }> {
    const targetPath = this.resolveSafePath(opaqueId);

    if (fs.existsSync(targetPath)) {
      throw new Error(`Storage conflict: Object with ID '${opaqueId}' already exists.`);
    }

    // Atomic write pattern: write to temporary file with unique random suffix, flush, then rename
    const tmpSuffix = crypto.randomBytes(8).toString("hex");
    const tmpPath = path.join(this.baseDir, `${opaqueId}.${tmpSuffix}.tmp`);

    try {
      await fs.promises.writeFile(tmpPath, data, { mode: 0o600 });
      const stats = await fs.promises.stat(tmpPath);

      if (stats.size !== data.length) {
        throw new Error(
          `Integrity verification failure: Written byte count (${stats.size}) did not match buffer size (${data.length}).`
        );
      }

      await fs.promises.rename(tmpPath, targetPath);
      return { size: stats.size };
    } catch (error) {
      if (fs.existsSync(tmpPath)) {
        try {
          await fs.promises.unlink(tmpPath);
        } catch {
          // ignore tmp cleanup error
        }
      }
      throw error;
    }
  }

  public async getEncryptedObject(opaqueId: string): Promise<Buffer | null> {
    const targetPath = this.resolveSafePath(opaqueId);

    if (!fs.existsSync(targetPath)) {
      return null;
    }

    return await fs.promises.readFile(targetPath);
  }

  public async getEncryptedObjectStream(
    opaqueId: string
  ): Promise<fs.ReadStream | null> {
    const targetPath = this.resolveSafePath(opaqueId);

    if (!fs.existsSync(targetPath)) {
      return null;
    }

    return fs.createReadStream(targetPath);
  }

  public async deleteEncryptedObject(opaqueId: string): Promise<boolean> {
    const targetPath = this.resolveSafePath(opaqueId);

    if (!fs.existsSync(targetPath)) {
      return false;
    }

    await fs.promises.unlink(targetPath);
    return true;
  }

  public async objectExists(opaqueId: string): Promise<boolean> {
    try {
      const targetPath = this.resolveSafePath(opaqueId);
      return fs.existsSync(targetPath);
    } catch {
      return false;
    }
  }

  public async getObjectSize(opaqueId: string): Promise<number> {
    const targetPath = this.resolveSafePath(opaqueId);

    if (!fs.existsSync(targetPath)) {
      throw new Error(`Object not found: '${opaqueId}'.`);
    }

    const stats = await fs.promises.stat(targetPath);
    return stats.size;
  }
}

export const defaultLocalStorageProvider = new LocalStorageProvider();
