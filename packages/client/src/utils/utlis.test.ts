import { isSafePassword } from "./utils";

test("isSafePassword should return true for a safe password", () => {
  const safePassword = "SafePassword123!";
  const result = isSafePassword(safePassword);
  expect(result).toBe(true);
});

test("isSafePassword should return false for a password shorter than 12 characters", () => {
  const shortPassword = "ShortPwd1!"; // Less than 12 characters
  const result = isSafePassword(shortPassword);
  expect(result).toBe(false);
});

test("isSafePassword should return false for a password without an uppercase letter", () => {
  const passwordWithoutUppercase = "password123!"; // No uppercase letter
  const result = isSafePassword(passwordWithoutUppercase);
  expect(result).toBe(false);
});

test("isSafePassword should return false for a password without an lowercase letter", () => {
  const passwordWithoutUppercase = "PASSWORD123!"; // No lowercase letter
  const result = isSafePassword(passwordWithoutUppercase);
  expect(result).toBe(false);
});

test("isSafePassword should return false for a password without digits", () => {
  const passwordWithoutUppercase = "SafePassword!"; // No digits
  const result = isSafePassword(passwordWithoutUppercase);
  expect(result).toBe(false);
});

test("isSafePassword should return false for a password without symbols", () => {
  const passwordWithoutUppercase = "SafePassword123"; // No symbols
  const result = isSafePassword(passwordWithoutUppercase);
  expect(result).toBe(false);
});
