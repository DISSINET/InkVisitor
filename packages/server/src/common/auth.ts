import * as bcrypt from "bcrypt";
import { sign as signJwt } from "jsonwebtoken";
import { IUser } from "@shared/types/user";
import jwt, { secretType } from "express-jwt";
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
  return bcrypt.compareSync(rawPassword, storedHash); // true
}

const defaultJwtAlgo = "HS256";

export function generateAccessToken(user: IUser, expDays: number = 30): string {
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

export function validateJwt(): jwt.RequestHandler {
  return jwt({
    secret: process.env.SECRET as secretType,
    algorithms: [defaultJwtAlgo],
    getToken: function fromHeaderOrQuerystring(req: Request) {
      if (
        req.headers.authorization &&
        req.headers.authorization.split(" ")[0] === "Bearer"
      ) {
        return req.headers.authorization.split(" ")[1];
      } else if (req.query && req.query.token) {
        return req.query.token;
      }
      return null;
    },
  });
}
