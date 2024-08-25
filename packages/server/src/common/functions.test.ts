import "ts-jest";
import { generatePassword, sanitizeText } from "./functions";

describe("Test sanitizeText", function () {
  it("should replace nbsp char  normal whitespace", () => {
    const input = "sciens\xa0esse\xa0hereticum/am/\xa0os/as";
    const wanted = "sciens esse hereticum/am/ os/as";
    expect(sanitizeText(input)).toEqual(wanted);
  });
});

function isSafePassword(password: string) {
  // Check if the password is at least 12 characters long
  if (password.length < 12) {
    return false;
  }
  // Check if the password contains at least one uppercase letter
  if (!/[A-Z]/.test(password)) {
    return false;
  }
  // Check if the password contains at least one lowercase letter
  if (!/[a-z]/.test(password)) {
    return false;
  }
  // Check if the password contains at least one digit
  if (!/\d/.test(password)) {
    return false;
  }
  // Check if the password contains at least one symbol
  if (!/[!@#$%^&*()_+{}\[\]:;<>,.?/~\\-]/.test(password)) {
    return false;
  }
  // If all conditions are met, the password is considered safe
  return true;
}

describe("Test generatePassword", function () {
  it("should generate valid safe password", () => {
    expect(isSafePassword(generatePassword(12))).toBeTruthy();
    expect(isSafePassword(generatePassword(13))).toBeTruthy();
    expect(isSafePassword(generatePassword(14))).toBeTruthy();
    expect(isSafePassword(generatePassword(15))).toBeTruthy();
  });

  it("should generate invalid password with length < 12", () => {
    expect(isSafePassword(generatePassword(11))).toBeFalsy();
    expect(isSafePassword(generatePassword(10))).toBeFalsy();
  });
});