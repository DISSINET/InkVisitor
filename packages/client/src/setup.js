import "./Theme/theme";
import "./Theme/global";
import "./Theme/constants";

import { App } from "app";

export const createStore = () => {
  return; /* store */
};

export const createRouter = () => {
  return; /* router */
};

export const createApp = () => {
  return <App router={createRouter()} store={createStore()} />;
};
