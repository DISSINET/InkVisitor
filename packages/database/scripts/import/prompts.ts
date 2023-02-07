import readline from "readline";

export const question = async (questionString: string): Promise<string> => {
    const rl = readline.createInterface({
        input: process.stdin,
        output: process.stdout,
    });

    return new Promise((resolve) => {
        rl.question(questionString + "\n", function (result) {
            rl.close();
            resolve(result);
        });
    });
};

export const confirm = async (questionString: string): Promise<boolean> => {
    const rl = readline.createInterface({
        input: process.stdin,
        output: process.stdout,
    });

    let questionText = questionString + " (y/n)\n";

    const poll = async (): Promise<boolean> => {
        return new Promise((resolve, reject) => {
            rl.question(questionText, function (result) {
                if (result.toLowerCase() === 'y') {
                    rl.close();
                    resolve(true);
                } else if (result.toLowerCase() === 'n') {
                    rl.close();
                    resolve(false);
                } else {
                    reject("Bad answer. Use only y/n.\n");
                }
            });
        });
    };

    let result: boolean = false;

    while (1) {
        try {
            result = await poll();
            break;
        } catch (e) {
            questionText = e as string;
            continue;
        }
    }

    return result;
};
