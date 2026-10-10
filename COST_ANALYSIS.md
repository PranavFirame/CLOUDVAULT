# CloudVault: Infrastructure Cost Analysis

## 1. Executive Summary

**Total Required Cloud Infrastructure Cost:** **₹0 / $0.00**

CloudVault is engineered strictly as a **Local-First, Zero-Knowledge Encrypted Platform**. All core architectural components—the application server, cryptographic operations, relational database, caching and rate-limiting tier, and encrypted file object storage—execute directly on the user's local workstation.

---

## 2. Component Cost Breakdown

| Component | Standard Cloud Alternative | CloudVault Architecture | Recurring Cost |
| :--- | :--- | :--- | :--- |
| **Object Storage** | AWS S3, Cloudflare R2, Google Cloud Storage | Local Filesystem (`./data/objects/`) with atomic write patterns | **₹0** |
| **Relational Database** | AWS Aurora, Supabase, Neon, RDS PostgreSQL | Local PostgreSQL 16 container running in Docker | **₹0** |
| **Cache & Rate Limiting** | Upstash, Redis Cloud, AWS ElastiCache | Local Redis 7 container running in Docker with in-memory fallback | **₹0** |
| **Application Hosting** | Vercel Pro, AWS ECS, Google Cloud Run | Local Next.js 14 Node.js runtime (`localhost:3000`) | **₹0** |
| **Cryptographic Derivation** | AWS KMS, HashiCorp Cloud Vault, Azure Key Vault | Native Browser Web Crypto API (AES-256-GCM) + Argon2id | **₹0** |
| **AI / Auxiliary APIs** | OpenAI, Anthropic, Google Cloud API | None required | **₹0** |
| **Remote Font & Asset CDNs** | Google Fonts, Cloudflare cdnjs | Zero external network calls; system UI fonts | **₹0** |
| **Telemetry & Analytics** | Datadog, Mixpanel, Google Analytics | Safe local PostgreSQL audit trail | **₹0** |

---

## 3. Operational Realities & Non-Cloud Considerations

While CloudVault requires **₹0 in cloud service subscriptions**:
1. **Local Electricity & Hardware:** The user's computer consumes local electric power and CPU cycles during cryptographic derivation (Argon2id and AES-256-GCM).
2. **Initial Package Installation:** Internet connectivity is required once during `npm install` to download dependencies from npm, after which the application runs entirely offline.
3. **Local Storage Capacity:** File storage is bounded by the available space on the developer's local hard drive or solid-state drive.
4. **Physical Backups:** Optional physical backup drives (e.g., external SSDs, USB storage) purchased for disaster recovery exist outside the infrastructure software cost.

---

## 4. Preservation of Zero-Knowledge Local Architecture

To maintain the ₹0 cost and privacy guarantees:
* Do not introduce AWS SDKs, Google Cloud libraries, or Azure client packages.
* Do not configure remote database strings or cloud Redis endpoints.
* Never add third-party tracking scripts, external pixel tags, or external font stylesheets.
