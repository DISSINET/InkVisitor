import dotenv from "dotenv";

// will load .env.development by default
if (!process.env.NODE_ENV || !!process.env.ENV_FILE) {
  console.log(
    `[Settings] loading .env file: .env.${
      process.env.ENV_FILE || "development"
    }`
  );

  // Set the env file
  const result = dotenv.config({
    path: `./env/.env.${process.env.ENV_FILE || "development"}`,
  });

  if (result.error) {
    throw result.error;
  }
}
