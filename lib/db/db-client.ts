import { PrismaClient } from "@prisma/client";

// Global Prisma instance for standard PostgreSQL operation
const globalForPrisma = global as unknown as { prisma: PrismaClient };

export const prisma =
  globalForPrisma.prisma ||
  new PrismaClient({
    log: process.env.NODE_ENV === "development" ? ["warn", "error"] : ["error"],
  });

if (process.env.NODE_ENV !== "production") globalForPrisma.prisma = prisma;

// In production (Render + Neon), always use Prisma/PostgreSQL directly.
// The local JSON fallback is only for local dev when Docker Postgres is offline.
const USE_LOCAL_FALLBACK =
  process.env.NODE_ENV !== "production" && !process.env.DATABASE_URL;

// ─── Local JSON fallback (dev-only, no DATABASE_URL) ─────────────────────────
import fs from "fs";
import path from "path";
import crypto from "crypto";

interface LocalStore {
  users: Array<{
    id: string;
    email: string;
    passwordHash: string;
    accountStatus: string;
    createdAt: string;
    updatedAt: string;
  }>;
  sessions: Array<{
    id: string;
    userId: string;
    sessionTokenHash: string;
    createdAt: string;
    expiresAt: string;
    revokedAt?: string | null;
  }>;
  vaultKeys: Array<{
    id: string;
    userId: string;
    encryptedMasterKey: string;
    keyEncryptionNonce: string;
    kdfSalt: string;
    kdfParams: string;
    formatVersion: number;
    encryptedRecoveryKey: string;
    recoveryNonce: string;
    createdAt: string;
    updatedAt: string;
  }>;
  folders: Array<{
    id: string;
    ownerId: string;
    parentFolderId?: string | null;
    encryptedFolderName: string;
    nameNonce: string;
    createdAt: string;
    updatedAt: string;
  }>;
  files: Array<{
    id: string;
    ownerId: string;
    opaqueObjectId: string;
    encryptedFileKey: string;
    fileKeyWrappingNonce: string;
    fileEncryptionNonce: string;
    encryptedMetadata: string;
    metadataNonce: string;
    encryptionFormatVersion: number;
    ciphertextSizeBytes: string;
    uploadStatus: string;
    folderId?: string | null;
    createdAt: string;
    updatedAt: string;
  }>;
  auditEvents: Array<{
    id: string;
    userId?: string | null;
    eventType: string;
    details: string;
    ipAddress?: string | null;
    createdAt: string;
  }>;
}

const LOCAL_DB_PATH = path.join(process.cwd(), "data", "local_vault_db.json");

function getLocalStore(): LocalStore {
  const dir = path.dirname(LOCAL_DB_PATH);
  if (!fs.existsSync(dir)) {
    fs.mkdirSync(dir, { recursive: true, mode: 0o700 });
  }

  if (!fs.existsSync(LOCAL_DB_PATH)) {
    const initial: LocalStore = {
      users: [],
      sessions: [],
      vaultKeys: [],
      folders: [],
      files: [],
      auditEvents: [],
    };
    fs.writeFileSync(LOCAL_DB_PATH, JSON.stringify(initial, null, 2), "utf-8");
    return initial;
  }

  try {
    const raw = fs.readFileSync(LOCAL_DB_PATH, "utf-8");
    return JSON.parse(raw);
  } catch {
    return {
      users: [],
      sessions: [],
      vaultKeys: [],
      folders: [],
      files: [],
      auditEvents: [],
    };
  }
}

function saveLocalStore(store: LocalStore): void {
  const dir = path.dirname(LOCAL_DB_PATH);
  if (!fs.existsSync(dir)) {
    fs.mkdirSync(dir, { recursive: true, mode: 0o700 });
  }
  fs.writeFileSync(LOCAL_DB_PATH, JSON.stringify(store, null, 2), "utf-8");
}

// ─── Unified db interface ─────────────────────────────────────────────────────

export const db = {
  async createUser(data: { email: string; passwordHash: string }) {
    if (!USE_LOCAL_FALLBACK) {
      return await prisma.user.create({ data });
    }
    const store = getLocalStore();
    const existing = store.users.find((u) => u.email.toLowerCase() === data.email.toLowerCase());
    if (existing) throw new Error("User already exists");
    const newUser = {
      id: crypto.randomUUID(),
      email: data.email.toLowerCase(),
      passwordHash: data.passwordHash,
      accountStatus: "ACTIVE",
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };
    store.users.push(newUser);
    saveLocalStore(store);
    return newUser;
  },

  async findUserByEmail(email: string) {
    if (!USE_LOCAL_FALLBACK) {
      return await prisma.user.findUnique({ where: { email: email.toLowerCase() } });
    }
    const store = getLocalStore();
    return store.users.find((u) => u.email.toLowerCase() === email.toLowerCase()) || null;
  },

  async findUserById(id: string) {
    if (!USE_LOCAL_FALLBACK) {
      return await prisma.user.findUnique({ where: { id } });
    }
    const store = getLocalStore();
    return store.users.find((u) => u.id === id) || null;
  },

  async updateUserPassword(id: string, passwordHash: string) {
    if (!USE_LOCAL_FALLBACK) {
      return await prisma.user.update({ where: { id }, data: { passwordHash, updatedAt: new Date() } });
    }
    const store = getLocalStore();
    const user = store.users.find((u) => u.id === id);
    if (!user) throw new Error("User not found");
    user.passwordHash = passwordHash;
    user.updatedAt = new Date().toISOString();
    saveLocalStore(store);
    return user;
  },

  async createSession(data: { userId: string; sessionTokenHash: string; expiresAt: Date }) {
    if (!USE_LOCAL_FALLBACK) {
      return await prisma.session.create({
        data: {
          userId: data.userId,
          sessionTokenHash: data.sessionTokenHash,
          expiresAt: data.expiresAt,
        },
      });
    }
    const store = getLocalStore();
    const newSession = {
      id: crypto.randomUUID(),
      userId: data.userId,
      sessionTokenHash: data.sessionTokenHash,
      createdAt: new Date().toISOString(),
      expiresAt: data.expiresAt.toISOString(),
      revokedAt: null,
    };
    store.sessions.push(newSession);
    saveLocalStore(store);
    return newSession;
  },

  async findSessionByTokenHash(tokenHash: string) {
    if (!USE_LOCAL_FALLBACK) {
      const sess = await prisma.session.findUnique({
        where: { sessionTokenHash: tokenHash },
        include: { user: true },
      });
      if (!sess) return null;
      if (sess.revokedAt || sess.expiresAt < new Date()) return null;
      return sess;
    }
    const store = getLocalStore();
    const sess = store.sessions.find((s) => s.sessionTokenHash === tokenHash);
    if (!sess) return null;
    if (sess.revokedAt || new Date(sess.expiresAt) < new Date()) return null;
    const user = store.users.find((u) => u.id === sess.userId);
    if (!user) return null;
    return { ...sess, expiresAt: new Date(sess.expiresAt), createdAt: new Date(sess.createdAt), user };
  },

  async revokeSession(id: string, userId: string) {
    if (!USE_LOCAL_FALLBACK) {
      return await prisma.session.updateMany({ where: { id, userId }, data: { revokedAt: new Date() } });
    }
    const store = getLocalStore();
    const sess = store.sessions.find((s) => s.id === id && s.userId === userId);
    if (sess) {
      sess.revokedAt = new Date().toISOString();
      saveLocalStore(store);
    }
  },

  async listUserSessions(userId: string) {
    if (!USE_LOCAL_FALLBACK) {
      return await prisma.session.findMany({
        where: { userId, revokedAt: null },
        orderBy: { createdAt: "desc" },
      });
    }
    const store = getLocalStore();
    return store.sessions
      .filter((s) => s.userId === userId && !s.revokedAt && new Date(s.expiresAt) > new Date())
      .map((s) => ({ ...s, createdAt: new Date(s.createdAt), expiresAt: new Date(s.expiresAt) }));
  },

  async saveVaultKey(data: {
    userId: string;
    encryptedMasterKey: string;
    keyEncryptionNonce: string;
    kdfSalt: string;
    kdfParams: string;
    formatVersion?: number;
    encryptedRecoveryKey: string;
    recoveryNonce: string;
  }) {
    if (!USE_LOCAL_FALLBACK) {
      return await prisma.vaultKey.upsert({
        where: { userId: data.userId },
        update: {
          encryptedMasterKey: data.encryptedMasterKey,
          keyEncryptionNonce: data.keyEncryptionNonce,
          kdfSalt: data.kdfSalt,
          kdfParams: data.kdfParams,
          formatVersion: data.formatVersion || 1,
          encryptedRecoveryKey: data.encryptedRecoveryKey,
          recoveryNonce: data.recoveryNonce,
          updatedAt: new Date(),
        },
        create: {
          userId: data.userId,
          encryptedMasterKey: data.encryptedMasterKey,
          keyEncryptionNonce: data.keyEncryptionNonce,
          kdfSalt: data.kdfSalt,
          kdfParams: data.kdfParams,
          formatVersion: data.formatVersion || 1,
          encryptedRecoveryKey: data.encryptedRecoveryKey,
          recoveryNonce: data.recoveryNonce,
        },
      });
    }
    const store = getLocalStore();
    const idx = store.vaultKeys.findIndex((v) => v.userId === data.userId);
    const item = {
      id: idx >= 0 ? store.vaultKeys[idx].id : crypto.randomUUID(),
      userId: data.userId,
      encryptedMasterKey: data.encryptedMasterKey,
      keyEncryptionNonce: data.keyEncryptionNonce,
      kdfSalt: data.kdfSalt,
      kdfParams: data.kdfParams,
      formatVersion: data.formatVersion || 1,
      encryptedRecoveryKey: data.encryptedRecoveryKey,
      recoveryNonce: data.recoveryNonce,
      createdAt: idx >= 0 ? store.vaultKeys[idx].createdAt : new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };
    if (idx >= 0) store.vaultKeys[idx] = item;
    else store.vaultKeys.push(item);
    saveLocalStore(store);
    return item;
  },

  async getVaultKey(userId: string) {
    if (!USE_LOCAL_FALLBACK) {
      return await prisma.vaultKey.findUnique({ where: { userId } });
    }
    const store = getLocalStore();
    return store.vaultKeys.find((v) => v.userId === userId) || null;
  },

  async createFolder(data: {
    ownerId: string;
    parentFolderId?: string | null;
    encryptedFolderName: string;
    nameNonce: string;
  }) {
    if (!USE_LOCAL_FALLBACK) {
      return await prisma.folder.create({ data });
    }
    const store = getLocalStore();
    const newFolder = {
      id: crypto.randomUUID(),
      ownerId: data.ownerId,
      parentFolderId: data.parentFolderId || null,
      encryptedFolderName: data.encryptedFolderName,
      nameNonce: data.nameNonce,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };
    store.folders.push(newFolder);
    saveLocalStore(store);
    return newFolder;
  },

  async listFolders(ownerId: string, parentFolderId?: string | null) {
    if (!USE_LOCAL_FALLBACK) {
      return await prisma.folder.findMany({
        where: {
          ownerId,
          parentFolderId: parentFolderId === undefined ? undefined : parentFolderId,
        },
        orderBy: { createdAt: "asc" },
      });
    }
    const store = getLocalStore();
    return store.folders
      .filter((f) => {
        if (f.ownerId !== ownerId) return false;
        if (parentFolderId === undefined) return true;
        return (f.parentFolderId || null) === (parentFolderId || null);
      })
      .map((f) => ({ ...f, createdAt: new Date(f.createdAt), updatedAt: new Date(f.updatedAt) }));
  },

  async getFolderById(id: string, ownerId: string) {
    if (!USE_LOCAL_FALLBACK) {
      return await prisma.folder.findFirst({ where: { id, ownerId } });
    }
    const store = getLocalStore();
    const f = store.folders.find((x) => x.id === id && x.ownerId === ownerId);
    if (!f) return null;
    return { ...f, createdAt: new Date(f.createdAt), updatedAt: new Date(f.updatedAt) };
  },

  async deleteFolder(id: string, ownerId: string) {
    if (!USE_LOCAL_FALLBACK) {
      return await prisma.folder.deleteMany({ where: { id, ownerId } });
    }
    const store = getLocalStore();
    store.folders = store.folders.filter((f) => !(f.id === id && f.ownerId === ownerId));
    saveLocalStore(store);
  },

  async renameFolder(id: string, ownerId: string, encryptedFolderName: string, nameNonce: string) {
    if (!USE_LOCAL_FALLBACK) {
      return await prisma.folder.updateMany({
        where: { id, ownerId },
        data: { encryptedFolderName, nameNonce, updatedAt: new Date() },
      });
    }
    const store = getLocalStore();
    const f = store.folders.find((x) => x.id === id && x.ownerId === ownerId);
    if (f) {
      f.encryptedFolderName = encryptedFolderName;
      f.nameNonce = nameNonce;
      f.updatedAt = new Date().toISOString();
      saveLocalStore(store);
    }
  },

  async createFile(data: {
    id?: string;
    ownerId: string;
    opaqueObjectId: string;
    encryptedFileKey: string;
    fileKeyWrappingNonce: string;
    fileEncryptionNonce: string;
    encryptedMetadata: string;
    metadataNonce: string;
    ciphertextSizeBytes: number | bigint;
    folderId?: string | null;
  }) {
    const sizeBigInt = BigInt(data.ciphertextSizeBytes);
    const fileId = data.id || crypto.randomUUID();
    if (!USE_LOCAL_FALLBACK) {
      return await prisma.file.create({
        data: {
          id: fileId,
          ownerId: data.ownerId,
          opaqueObjectId: data.opaqueObjectId,
          encryptedFileKey: data.encryptedFileKey,
          fileKeyWrappingNonce: data.fileKeyWrappingNonce,
          fileEncryptionNonce: data.fileEncryptionNonce,
          encryptedMetadata: data.encryptedMetadata,
          metadataNonce: data.metadataNonce,
          ciphertextSizeBytes: sizeBigInt,
          folderId: data.folderId || null,
          uploadStatus: "PENDING",
        },
      });
    }
    const store = getLocalStore();
    const newFile = {
      id: fileId,
      ownerId: data.ownerId,
      opaqueObjectId: data.opaqueObjectId,
      encryptedFileKey: data.encryptedFileKey,
      fileKeyWrappingNonce: data.fileKeyWrappingNonce,
      fileEncryptionNonce: data.fileEncryptionNonce,
      encryptedMetadata: data.encryptedMetadata,
      metadataNonce: data.metadataNonce,
      encryptionFormatVersion: 1,
      ciphertextSizeBytes: sizeBigInt.toString(),
      uploadStatus: "PENDING",
      folderId: data.folderId || null,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };
    store.files.push(newFile);
    saveLocalStore(store);
    return { ...newFile, ciphertextSizeBytes: sizeBigInt };
  },

  async updateFileStatus(id: string, ownerId: string, uploadStatus: string, actualSize?: number | bigint) {
    const sizeUpdate = actualSize !== undefined ? BigInt(actualSize) : undefined;
    if (!USE_LOCAL_FALLBACK) {
      return await prisma.file.updateMany({
        where: { id, ownerId },
        data: {
          uploadStatus,
          ...(sizeUpdate !== undefined ? { ciphertextSizeBytes: sizeUpdate } : {}),
          updatedAt: new Date(),
        },
      });
    }
    const store = getLocalStore();
    const f = store.files.find((x) => x.id === id && x.ownerId === ownerId);
    if (f) {
      f.uploadStatus = uploadStatus;
      if (sizeUpdate !== undefined) f.ciphertextSizeBytes = sizeUpdate.toString();
      f.updatedAt = new Date().toISOString();
      saveLocalStore(store);
    }
  },

  async listFiles(ownerId: string, folderId?: string | null) {
    if (!USE_LOCAL_FALLBACK) {
      const records = await prisma.file.findMany({
        where: {
          ownerId,
          uploadStatus: "COMPLETED",
          folderId: folderId === undefined ? undefined : folderId,
        },
        orderBy: { createdAt: "desc" },
      });
      return records.map((r) => ({ ...r, ciphertextSizeBytes: Number(r.ciphertextSizeBytes) }));
    }
    const store = getLocalStore();
    return store.files
      .filter((f) => {
        if (f.ownerId !== ownerId || f.uploadStatus !== "COMPLETED") return false;
        if (folderId === undefined) return true;
        return (f.folderId || null) === (folderId || null);
      })
      .map((f) => ({
        ...f,
        ciphertextSizeBytes: Number(f.ciphertextSizeBytes),
        createdAt: new Date(f.createdAt),
        updatedAt: new Date(f.updatedAt),
      }));
  },

  async getFileById(id: string, ownerId: string) {
    if (!USE_LOCAL_FALLBACK) {
      const r = await prisma.file.findFirst({ where: { id, ownerId } });
      if (!r) return null;
      return { ...r, ciphertextSizeBytes: Number(r.ciphertextSizeBytes) };
    }
    const store = getLocalStore();
    const f = store.files.find((x) => x.id === id && x.ownerId === ownerId);
    if (!f) return null;
    return {
      ...f,
      ciphertextSizeBytes: Number(f.ciphertextSizeBytes),
      createdAt: new Date(f.createdAt),
      updatedAt: new Date(f.updatedAt),
    };
  },

  async updateFileMetadata(
    id: string,
    ownerId: string,
    data: { encryptedMetadata?: string; metadataNonce?: string; folderId?: string | null }
  ) {
    if (!USE_LOCAL_FALLBACK) {
      return await prisma.file.updateMany({
        where: { id, ownerId },
        data: {
          ...(data.encryptedMetadata ? { encryptedMetadata: data.encryptedMetadata } : {}),
          ...(data.metadataNonce ? { metadataNonce: data.metadataNonce } : {}),
          ...(data.folderId !== undefined ? { folderId: data.folderId } : {}),
          updatedAt: new Date(),
        },
      });
    }
    const store = getLocalStore();
    const f = store.files.find((x) => x.id === id && x.ownerId === ownerId);
    if (f) {
      if (data.encryptedMetadata) f.encryptedMetadata = data.encryptedMetadata;
      if (data.metadataNonce) f.metadataNonce = data.metadataNonce;
      if (data.folderId !== undefined) f.folderId = data.folderId;
      f.updatedAt = new Date().toISOString();
      saveLocalStore(store);
    }
  },

  async deleteFile(id: string, ownerId: string) {
    if (!USE_LOCAL_FALLBACK) {
      return await prisma.file.deleteMany({ where: { id, ownerId } });
    }
    const store = getLocalStore();
    store.files = store.files.filter((f) => !(f.id === id && f.ownerId === ownerId));
    saveLocalStore(store);
  },

  async getUserStorageUsed(ownerId: string): Promise<number> {
    if (!USE_LOCAL_FALLBACK) {
      const agg = await prisma.file.aggregate({
        where: { ownerId, uploadStatus: "COMPLETED" },
        _sum: { ciphertextSizeBytes: true },
      });
      return Number(agg._sum.ciphertextSizeBytes || BigInt(0));
    }
    const store = getLocalStore();
    return store.files
      .filter((f) => f.ownerId === ownerId && f.uploadStatus === "COMPLETED")
      .reduce((sum, f) => sum + Number(f.ciphertextSizeBytes), 0);
  },

  async createAuditEvent(data: {
    userId?: string | null;
    eventType: string;
    details: Record<string, unknown>;
    ipAddress?: string | null;
  }) {
    const detailsStr = JSON.stringify(data.details);
    if (!USE_LOCAL_FALLBACK) {
      return await prisma.auditEvent.create({
        data: {
          userId: data.userId || null,
          eventType: data.eventType,
          details: detailsStr,
          ipAddress: data.ipAddress || null,
        },
      });
    }
    const store = getLocalStore();
    const item = {
      id: crypto.randomUUID(),
      userId: data.userId || null,
      eventType: data.eventType,
      details: detailsStr,
      ipAddress: data.ipAddress || null,
      createdAt: new Date().toISOString(),
    };
    store.auditEvents.push(item);
    saveLocalStore(store);
    return item;
  },

  async listAuditEvents(userId: string) {
    if (!USE_LOCAL_FALLBACK) {
      return await prisma.auditEvent.findMany({
        where: { userId },
        orderBy: { createdAt: "desc" },
        take: 50,
      });
    }
    const store = getLocalStore();
    return store.auditEvents
      .filter((a) => a.userId === userId)
      .slice(-50)
      .reverse()
      .map((a) => ({ ...a, createdAt: new Date(a.createdAt) }));
  },
};
