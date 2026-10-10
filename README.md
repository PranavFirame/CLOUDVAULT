# CloudVault

> **Your Files. Your Keys. Your Privacy.**  
> Local-First Zero-Knowledge Encrypted Cloud Storage Platform.

CloudVault is a full-featured, zero-knowledge encrypted file storage web application running entirely on local infrastructure. All file encryption, master-key generation, passphrase derivation, and metadata encryption are performed **strictly inside your web browser** using the native Web Crypto API (**AES-256-GCM**) and **Argon2id**. 

The backend application server, PostgreSQL database, and Redis instance only ever process and store opaque ciphertext envelopes, never having access to your plaintext files, vault passphrase, master encryption key, or per-file encryption keys.

---

## 1. Key Architectural Features

- **Zero-Knowledge Client-Side Encryption:** Files are encrypted with AES-256-GCM in the user's browser before transmission.
- **Separate Credentials:** Account Password (server login authentication) is completely decoupled from your Vault Passphrase (browser-only key derivation).
- **Master Key & HKDF File-Key Hierarchy:** A 256-bit Master Key wraps per-file 256-bit AES-GCM keys using purpose-specific wrapping keys derived via HKDF-SHA256 bound to unique file identifiers.
- **Encrypted Metadata & Folder Hierarchy:** Original filenames, folder names, MIME types, and file sizes are stored as encrypted envelopes. The server sees only opaque UUID identifiers.
- **Offline High-Entropy Recovery Secret:** A 128-bit emergency recovery code enables vault restoration and passphrase rotation without data loss.
- **Local Storage Provider:** Ciphertext is saved under opaque server-generated identifiers in `./data/objects/` using atomic `.tmp` writes and strict path-traversal guards.
- **Fail-Safe Rate Limiting:** Redis sliding-window rate limiting with seamless in-memory fallback protecting authentication endpoints.
- **₹0 Cloud Cost:** No paid cloud services, no remote database hosting, no AWS/S3 dependencies, and no remote font/telemetry trackers.

---

## 2. Technology Stack

- **Frontend:** Next.js 14 (App Router), React 18, TypeScript (strict mode), Tailwind CSS, Lucide React icons.
- **Backend:** Next.js Route Handlers, Node.js runtime, Prisma ORM, PostgreSQL, Redis.
- **Local Infrastructure:** Docker & Docker Compose (`compose.yaml`) with named volumes bound to `127.0.0.1`.
- **Cryptography:** Web Crypto API (`SubtleCrypto`), AES-256-GCM (128-bit tags), Argon2id (`hash-wasm`), HKDF-SHA256, scrypt password hashing.
- **Testing:** Vitest with 100% passing test coverage for cryptography, storage invariants, and authentication security.

---

## 3. Project Directory Structure

```text
CLOUDVAULT/
├── app/
│   ├── (auth)/
│   │   ├── login/page.tsx           # Account authentication
│   │   ├── register/page.tsx        # Account registration & vault initialization
│   │   ├── unlock/page.tsx          # Local browser vault unlock
│   │   └── recover/page.tsx         # Disaster recovery with recovery secret
│   ├── dashboard/
│   │   ├── page.tsx                 # Storage analytics, quick upload, recent files
│   │   ├── files/page.tsx           # Full file manager, nested folders, search, grid/list
│   │   ├── security/page.tsx        # Key lifecycle, session management, audit log
│   │   └── settings/page.tsx        # Account settings, storage info, backup guide
│   ├── api/
│   │   ├── auth/                    # Register, Login, Logout, Me, Change Password
│   │   ├── vault/                   # Envelope storage, initialization, update
│   │   ├── files/                   # Initiate upload, binary upload, download, metadata
│   │   ├── folders/                 # Encrypted folders CRUD
│   │   ├── storage/                 # Storage quota and metrics
│   │   └── security/                # Sessions and audit logs
│   ├── globals.css
│   ├── layout.tsx                   # Offline root layout (no CDN fonts)
│   └── page.tsx                     # Zero-knowledge marketing & architecture page
├── components/
│   ├── layout/                      # Navbar, Sidebar, AppLayout
│   └── ui/                          # Button, Card, Input, Badge, Progress, Dialog
├── lib/
│   ├── auth/                        # Server sessions and scrypt password hashing
│   ├── crypto/                      # Client-side WebCrypto AES-GCM & Argon2id engine
│   ├── db/                          # Prisma PostgreSQL client + local fallback store
│   ├── redis/                       # Fail-safe Redis sliding window rate limiter
│   ├── storage/                     # LocalStorageProvider with atomic writes
│   └── validation/                  # Zod validation schemas
├── prisma/
│   └── schema.prisma                # Relational PostgreSQL schema
├── data/
│   └── objects/                     # Local storage directory for encrypted files (.gitignore)
├── tests/
│   ├── crypto.test.ts               # Cryptographic round-trip and tamper tests
│   ├── storage.test.ts              # Atomic write and path-traversal tests
│   └── auth.test.ts                 # Password hashing and timing-safe tests
├── compose.yaml                     # Production-ready Docker Compose for Postgres & Redis
├── .env.example                     # Documented configuration template
├── COST_ANALYSIS.md                 # Detailed ₹0 infrastructure cost audit
├── SECURITY.md                      # Security architecture & threat model
└── README.md                        # Complete developer & operator documentation
```

---

## 4. Local Quickstart Guide

### Prerequisites
1. **Node.js**: v18.18+ or v20+ (tested on Node v22).
2. **Docker Desktop** (optional for production database, automatic local fallback included for development).

### Step-by-Step Setup

1. **Clone or Open the Repository:**
   ```bash
   cd d:\antigravity\CLOUDVAULT
   ```

2. **Configure Environment Variables:**
   ```bash
   cp .env.example .env
   ```

3. **Start PostgreSQL and Redis in Docker:**
   ```bash
   docker compose up -d
   ```
   *(Note: If Docker is not installed on your development machine, CloudVault automatically activates its resilient local storage fallback in `./data/`, allowing complete development and testing out-of-the-box!)*

4. **Install Dependencies:**
   ```bash
   npm install
   ```

5. **Generate Prisma Client:**
   ```bash
   npx prisma generate
   ```

6. **Run Database Migrations (when Docker Postgres is running):**
   ```bash
   npx prisma migrate dev --name init
   ```

7. **Start the Development Server:**
   ```bash
   npm run dev
   ```

8. **Open CloudVault:**
   Open your browser to `http://localhost:3000`.

---

## 5. Verification & Testing Workflow

### Automated Security & Cryptography Tests
Run the comprehensive Vitest test suite:
```bash
npm test
```
This executes 20 automated tests validating:
- AES-256-GCM file encryption and round-trip decryption.
- Passphrase derivation with Argon2id.
- 1-byte ciphertext tampering detection & GCM authentication tag verification.
- Additional Authenticated Data (AAD) context binding.
- Emergency recovery key derivation and envelope decryption.
- Nonce freshness and 96-bit CSPRNG uniqueness.
- Path traversal attack rejection in `LocalStorageProvider`.
- Atomic `.tmp` writes and verified byte lengths.
- Server-side salted scrypt password hashing.

### Manual Verification Steps
1. Navigate to `http://localhost:3000/register`.
2. Register an account with an email, account password, and vault passphrase.
3. Download and save the displayed emergency recovery secret document (`.txt`).
4. Upload any document or image. Notice the live encryption indicator: bytes are encrypted before upload.
5. Inspect the local storage directory `./data/objects/`:
   Verify that the stored object contains random binary ciphertext rather than the original plaintext.
6. Click **Decrypt & Download**: The browser retrieves the ciphertext, unwraps the file key, verifies the AES-GCM tag, and delivers the decrypted original file.
7. Click **Lock Vault**: Master key is cleared from browser memory. All file and folder names switch to encrypted status until unlocked.

---

## 6. Disaster Backup & Restoration

Because CloudVault stores encrypted files locally, a complete recoverable backup requires **both** the PostgreSQL database and the ciphertext directory.

### Backup Commands
```bash
# 1. Backup PostgreSQL schema and encrypted envelopes
docker exec -t cloudvault-postgres pg_dump -U cloudvault cloudvault > backup_$(date +%Y%m%d).sql

# 2. Backup local encrypted object files
tar -czvf cloudvault_objects_$(date +%Y%m%d).tar.gz ./data/objects/
```

### Restoration Commands
```bash
# 1. Restore PostgreSQL database
cat backup_YYYYMMDD.sql | docker exec -i cloudvault-postgres psql -U cloudvault -d cloudvault

# 2. Extract encrypted object files
tar -xzvf cloudvault_objects_YYYYMMDD.tar.gz -C ./
```

> **IMPORTANT:** Always keep your emergency recovery secret stored in a separate physical or offline location away from the computer hosting the vault.

---

## 7. Troubleshooting & Environment Reset

- **Port 5432 or 6379 already in use:** Modify the port mappings in `compose.yaml` (e.g., `127.0.0.1:5433:5432`) and update `DATABASE_URL` in `.env`.
- **Reset Development Environment (CAUTION: Deletes local data):**
  ```bash
  # Stop containers and erase database volume
  docker compose down -v
  
  # Remove local encrypted files
  rm -rf ./data/objects/*
  rm -f ./data/local_vault_db.json
  ```

---

## 8. License

@Pranav Firame License. Designed with highest-standard cryptographic engineering.
