import * as bcrypt from "bcryptjs";
import { sign as signJwt, verify as verifyJwtRaw, JwtPayload } from "jsonwebtoken";
import { IUser } from "@inkvisitor/shared/types/user";
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

const defaultJwtAlgo = "HS256";

let secret = (process.env.SECRET as string) || "";
if (process.env.NODE_ENV !== "test") {
  if (process.argv.length > 3) {
    secret += process.argv[3];
  } else if (process.env.BUILD_TIMESTAMP) {
    secret += process.env.BUILD_TIMESTAMP;
  }
}

if (secret) {
  console.log(`SECRET set to ${secret}`);
}

function signDownloadToken(userId: string, expSeconds: number): string {
  return signJwt(
    { userId, exp: Math.floor(Date.now() / 1000) + expSeconds },
    secret,
    { algorithm: defaultJwtAlgo }
  );
}

export const generateShortLivedToken = (user: IUser, expSeconds: number): string =>
  signDownloadToken(user.id, expSeconds);

export function verifyDownloadToken(token: string): { id: string } | null {
  if (!token) return null;
  try {
    const decoded = verifyJwtRaw(token, secret, {
      algorithms: [defaultJwtAlgo],
    }) as JwtPayload & { userId?: string };
    // Only accept the new short-lived { userId } download-token shape. Legacy
    // long-lived JWTs ({ user: { id } }) issued before the cookie migration are
    // no longer honored - cookie sessions are the only general auth now.
    const userId = decoded?.userId;
    return userId ? { id: userId } : null;
  } catch {
    return null;
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
