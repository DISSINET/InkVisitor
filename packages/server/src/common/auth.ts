import * as bcrypt from "bcrypt";
import { sign as signJwt } from "jsonwebtoken";
import { IUser } from "@shared/types/user";
import jwt, { secretType } from "express-jwt";
import { Request } from "express";
import { v1 as uuid } from "uuid";

/**
 * Wrapper around bcrypt method for password hashing
 * @param rawPassword
 * @returns
 */
export function hashPassword(rawPassword: string): string {
  return bcrypt.hashSync(rawPassword, 10);
}

/**
 * Convenient function which generates random char sequence
 * @param len
 * @returns
 */
export function generateRandomString(len: number): string {
  return Math.random().toString(36).slice(-len);
}

/**
 * Wrapper around library-provided uuid function
 * @returns
 */
export function generateUuid(): string {
  return uuid();
}

/**
 * Wrapper around bcrypt method for checking raw ~ hashed password
 * @param rawPassword
 * @param storedHash
 * @returns
 */
export function checkPassword(
  rawPassword: string,
  storedHash: string
): boolean {
  return bcrypt.compareSync(rawPassword, storedHash); // true
}

const defaultJwtAlgo = "HS256";

/**
 * Function thats creates signed jwt token for user
 * @param user
 * @param expDays
 * @returns
 */
export function generateAccessToken(user: IUser, expDays = 30): string {
  return signJwt(
    {
      user,
      exp: Math.floor(Date.now() / 1000) + 86400 * expDays,
    },
    process.env.SECRET as string,
    {
      algorithm: defaultJwtAlgo,
    }
  );
}

/**
 * Middleware constructor that checks provided jwt token. Token must be valid - must be decodeable/signed and not expired.
 * For db specific task - check for user's properties, see customizeAuthenticatedRequest middleware in ./request.ts
 * @returns middleware
 */
export function validateJwt(): jwt.RequestHandler {
  return jwt({
    secret: process.env.SECRET as secretType,
    algorithms: [defaultJwtAlgo],
    getToken: (req: Request): string | Promise<string> | undefined => {
      if (
        req.headers.authorization &&
        req.headers.authorization.split(" ")[0] === "Bearer"
      ) {
        return req.headers.authorization.split(" ")[1];
      } else if (req.query && req.query.token) {
        return req.query.token as string;
      }
      return undefined;
    },
  });
}
