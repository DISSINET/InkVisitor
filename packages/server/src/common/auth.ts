import * as bcrypt from "bcrypt";
import { sign as signJwt } from "jsonwebtoken";
import { User } from "../../../shared/types/user";
import jwt, { secretType } from "express-jwt";

export function hashPassword(rawPassword: string): string {
  return bcrypt.hashSync(rawPassword, 10);
}

export function checkPassword(
  rawPassword: string,
  storedHash: string
): boolean {
  return bcrypt.compareSync(rawPassword, storedHash); // true
}

const defaultJwtAlgo = "HS256";

export function generateAccessToken(user: User) {
  return signJwt(
    {
      user,
      exp: Math.floor(Date.now() / 1000) + 10 * 60 * 60,
    },
    process.env.SECRET as string,
    {
      algorithm: defaultJwtAlgo,
    }
  );
}

export function validateJwt() {
  return jwt({
    secret: process.env.SECRET as secretType,
    algorithms: [defaultJwtAlgo],
    getToken: function fromHeaderOrQuerystring(req: any) {
      console.log(req.headers);
      if (
        req.headers.authorization &&
        req.headers.authorization.split(" ")[0] === "Bearer"
      ) {
        return req.headers.authorization.split(" ")[1];
      } else if (req.query && req.query.token) {
        console.log("is ok");
        return req.query.token;
      }
      return null;
    },
  });
}
