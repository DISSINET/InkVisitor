import { hashPassword } from "@common/auth";
import readline from "readline";

const question = async <T>(
  questionString: string,
  predicate: (input: string) => T | undefined,
  defaultVal: T
): Promise<T> => {
  const rl = readline.createInterface({
    input: process.stdin,
    output: process.stdout,
  });

  let questionText = questionString + "\n";

  const poll = async (): Promise<T> => {
    return new Promise((resolve, reject) => {
      rl.question(questionText, (result) => {
        const out = predicate(result);
        if (out !== undefined) {
          rl.close();
          resolve(out);
        } else {
          reject("Bad answer.\n");
        }
      });
    });
  };

  do {
    try {
      defaultVal = await poll();
      break;
    } catch (e) {
      questionText = e as string;
      continue;
    }
  } while (1);

  return defaultVal;
};

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
