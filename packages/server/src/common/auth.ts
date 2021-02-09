import * as bcrypt from "bcrypt";

export function hashPassword(rawPassword: string): string {
  return bcrypt.hashSync(rawPassword, 10);
}

export function checkPassword(
  rawPassword: string,
  storedHash: string
): boolean {
  return bcrypt.compareSync(rawPassword, storedHash); // true
}
