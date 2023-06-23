import store from "redux/store";
import { Provider } from "react-redux";

import { App } from "app";

export const createStore = () => {
  return; /* store */
};

export const createRouter = () => {
  return; /* router */
};

export const createApp = () => {
  return (
    <App
    // router={createRouter()} store={createStore()}
    />
  );
};
