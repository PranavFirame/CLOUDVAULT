import fs from "fs";

export interface StorageProvider {
  putEncryptedObject(
    opaqueId: string,
    data: Buffer
  ): Promise<{ size: number }>;

  getEncryptedObject(opaqueId: string): Promise<Buffer | null>;

  getEncryptedObjectStream(opaqueId: string): Promise<fs.ReadStream | null>;

  deleteEncryptedObject(opaqueId: string): Promise<boolean>;

  objectExists(opaqueId: string): Promise<boolean>;

  getObjectSize(opaqueId: string): Promise<number>;
}
