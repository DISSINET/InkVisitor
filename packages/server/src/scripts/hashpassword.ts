import { hashPassword } from "@common/auth";
import { question } from "../../../database/scripts/import/prompts";

(async () => {
  const raw = await question<string>(
    "Enter raw password:",
    (something: string) => something,
    ""
  );
  if (!raw) {
    throw new Error("Empty raw password");
  }
  console.log(`Hashed password is: "${hashPassword(raw)}"`);
})();
