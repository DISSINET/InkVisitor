import * as bcrypt from "bcryptjs";
import { Request } from "express";
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

export function createSessionUserId(
  req: Request,
  userId: string
): Promise<void> {
  return new Promise((resolve, reject) => {
    const regenerate = req.session.regenerate.bind(req.session);
    regenerate((err) => {
      if (err) {
        reject(err);
        return;
      }
      req.session.userId = userId;
      req.session.save((saveErr) => {
        if (saveErr) {
          reject(saveErr);
          return;
        }
        resolve();
      });
    });
  });
}

export function destroySession(req: Request): Promise<void> {
  return new Promise((resolve, reject) => {
    req.session.destroy((err) => {
      if (err) {
        reject(err);
        return;
      }
      resolve();
    });
  });
}
