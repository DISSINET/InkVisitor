export const getAppEnv = (): string => process.env.ENV || "default";

export const ensureAppConfig = (): void => {
  window.appConfig = { env: getAppEnv() };
};
