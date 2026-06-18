import * as bcrypt from "bcryptjs";
import { v1 as uuid } from "uuid";

export function hashPassword(rawPassword: string): string {
  return bcrypt.hashSync(rawPassword, 10);
}

export function generateRandomString(len: number): string {
  return Math.random().toString(36).slice(-len);
}

export function generateUuid(): string {
  return uuid();
}

export function checkPassword(
  rawPassword: string,
  storedHash: string
): boolean {
  const isBcryptHash = /^\$2[ayb]\$\d{2}\$/.test(storedHash);

  if (isBcryptHash) {
    return bcrypt.compareSync(rawPassword, storedHash);
  } else {
    return rawPassword === storedHash;
  }
}
