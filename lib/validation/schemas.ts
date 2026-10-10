import { z } from "zod";

export const RegisterSchema = z.object({
  email: z.string().email("Invalid email address"),
  password: z
    .string()
    .min(10, "Account password must be at least 10 characters")
    .max(128, "Password too long"),
});

export const LoginSchema = z.object({
  email: z.string().email("Invalid email address"),
  password: z.string().min(1, "Password is required"),
});

export const ChangePasswordSchema = z.object({
  currentPassword: z.string().min(1, "Current password is required"),
  newPassword: z
    .string()
    .min(10, "New password must be at least 10 characters")
    .max(128, "Password too long"),
});

export const VaultInitializeSchema = z.object({
  encryptedMasterKey: z.string().min(16),
  keyEncryptionNonce: z.string().min(10),
  kdfSalt: z.string().min(10),
  kdfParams: z.string().min(10),
  formatVersion: z.number().int().default(1),
  encryptedRecoveryKey: z.string().min(16),
  recoveryNonce: z.string().min(10),
});

export const VaultUpdateSchema = z.object({
  encryptedMasterKey: z.string().min(16),
  keyEncryptionNonce: z.string().min(10),
  kdfSalt: z.string().min(10),
  kdfParams: z.string().min(10),
});

export const InitiateUploadSchema = z.object({
  fileId: z.string().uuid("Invalid file ID format"),
  declaredCiphertextSize: z.number().int().positive().max(104857600, "File exceeds 100 MiB limit"),
  encryptedFileKey: z.string().min(16),
  fileKeyWrappingNonce: z.string().min(10),
  fileEncryptionNonce: z.string().min(10),
  encryptedMetadata: z.string().min(10),
  metadataNonce: z.string().min(10),
  folderId: z.string().uuid().nullable().optional(),
});

export const CreateFolderSchema = z.object({
  encryptedFolderName: z.string().min(10),
  nameNonce: z.string().min(10),
  parentFolderId: z.string().uuid().nullable().optional(),
});

export const UpdateFileMetadataSchema = z.object({
  encryptedMetadata: z.string().min(10).optional(),
  metadataNonce: z.string().min(10).optional(),
  folderId: z.string().uuid().nullable().optional(),
});

export const RenameFolderSchema = z.object({
  encryptedFolderName: z.string().min(10),
  nameNonce: z.string().min(10),
});
