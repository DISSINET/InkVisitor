import * as bcrypt from "bcrypt";
import { sign as signJwt } from "jsonwebtoken";

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

export function generateAccessToken(username: string, id: string) {
  return signJwt(
    {
      username,
      id,
      exp: Math.floor(Date.now() / 1000) + 10 * 60 * 60,
    },
    process.env.SECRET as string,
    {
      algorithm: defaultJwtAlgo,
    }
  );
}
