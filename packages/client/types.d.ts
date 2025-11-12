declare namespace NodeJS {
  interface Module {
    hot?: {
      accept(path?: string, callback?: () => void): void;
    };
  }
}

interface Window {
  appConfig: {
    env: string;
  };
}
