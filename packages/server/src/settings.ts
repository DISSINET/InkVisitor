import dotenv from "dotenv";

console.log("NODE ENV", process.env.NODE_ENV);
if (!process.env.NODE_ENV) {
  console.log(
    `[Settings] loading .env file: .env.${
      process.env.NODE_ENV || "development"
    }`
  );

  // Set the env file
  const result = dotenv.config({
    path: `./env/.env.${process.env.NODE_ENV || "development"}`,
  });

  if (result.error) {
    throw result.error;
  }
}
