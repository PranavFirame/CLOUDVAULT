import { describe, it, expect } from "vitest";
import { hashAccountPassword, verifyAccountPassword } from "../lib/auth/auth-service";

describe("Account Authentication & Hashing Security", () => {
  it("hashes password with scrypt and unique salt", async () => {
    const password = "UserMasterAccountPassword2026!";
    const hash1 = await hashAccountPassword(password);
    const hash2 = await hashAccountPassword(password);

    expect(hash1.startsWith("scrypt:v1:")).toBe(true);
    expect(hash2.startsWith("scrypt:v1:")).toBe(true);

    // Because salts are random, two hashes of the same password must differ
    expect(hash1).not.toBe(hash2);
  });

  it("verifies correct password successfully", async () => {
    const password = "UserMasterAccountPassword2026!";
    const hash = await hashAccountPassword(password);

    const valid = await verifyAccountPassword(password, hash);
    expect(valid).toBe(true);
  });

  it("rejects incorrect password", async () => {
    const password = "UserMasterAccountPassword2026!";
    const hash = await hashAccountPassword(password);

    const valid = await verifyAccountPassword("WrongPassword123!", hash);
    expect(valid).toBe(false);
  });

  it("rejects malformed password hashes safely", async () => {
    const valid = await verifyAccountPassword("password", "invalid_format_string");
    expect(valid).toBe(false);
  });
});
