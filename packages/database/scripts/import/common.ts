export function parseArgs(): [datasetId: string, env: string] {
    const datasetId: string = process.argv[2];
    const env = process.argv[3];

    return [datasetId, env];
}

const [datasetId, env] = parseArgs();
const envData = require("dotenv").config({ path: `env/.env.${env}` }).parsed;

if (!envData) {
    throw new Error(`Cannot load env file env/.env.${env}`);
}

export function getEnv(envName: string): string {
    if (envData[envName] !== undefined) {
        return envData[envName] as string;
    }

    throw new Error(`ENV variable '${envName}' is required`);
}