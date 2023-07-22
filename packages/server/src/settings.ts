import dotenv from "dotenv";

// will load .env.${ENV_FILE} if set
if (process.env.ENV_FILE) {
  console.log(`[Settings] loading .env file: .env.${process.env.ENV_FILE}`);

  const result = dotenv.config({
    path: `./env/.env.${process.env.ENV_FILE}`,
  });

  if (result.error) {
    throw result.error;
  }
} else if (!process.env.PORT) {
  throw new Error(
    "ENV variables not properly set - either use ENV_FILE to specify the file or provide variables from running environment"
  );
}
