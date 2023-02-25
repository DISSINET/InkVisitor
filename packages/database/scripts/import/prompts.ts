import readline from "readline";

export const question = async <T>(questionString: string, predicate: (input: string) => T | undefined, defaultVal: T): Promise<T> => {
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

export const confirm = async (questionString: string): Promise<boolean> => {
  return question<boolean>(questionString + " (y/n)", (input: string): boolean | undefined => {
    if (input.toLowerCase() === 'y') {
      return true;
    } else if (input.toLowerCase() === 'n') {
      return false;
    } else {
      return undefined;
    }
  }, false);
};
