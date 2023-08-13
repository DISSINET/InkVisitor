import * as React from "react";
import * as ReactDOM from "react-dom/client";
import { Provider } from "react-redux";
import store from "redux/store";

import { App } from "app";

import "./ensure-basename";
import theme from "Theme/theme";

const root = ReactDOM.createRoot(
  document.getElementById("root") as HTMLElement
);
root.render(
  <Provider store={store}>
    <App />
  </Provider>
);

declare global {
  interface Window {
    appTheme: typeof theme;
  }
}

window.appTheme = theme;
