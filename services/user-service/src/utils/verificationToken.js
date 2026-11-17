import { randomBytes, createHash } from "node:crypto";

export function createVerificationToken() {
  const token = randomBytes(32).toString("hex");

  const tokenHash = createHash("sha256").update(token).digest("hex");

  const expiresAt = new Date(Date.now() + 15 * 60 * 1000);

  return {
    token,
    tokenHash,
    expiresAt,
  };
}

export function hashVerificationToken(token) {
  return createHash("sha256").update(token).digest("hex");
}
