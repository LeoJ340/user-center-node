import { createHash } from "crypto";
import bcrypt from "bcryptjs";

export function hashToken(token: string) {
  return createHash("sha256").update(token).digest("hex");
}

export async function hashPassword(plain: string) {
  const saltRounds = 10;
  return bcrypt.hash(plain, saltRounds);
}

export async function verifyPassword(plain: string, hashed: string) {
  return bcrypt.compare(plain, hashed);
}

