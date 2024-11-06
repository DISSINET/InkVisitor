import * as React from "react";
import * as ReactDOM from "react-dom/client";
import { Provider } from "react-redux";

import { App } from "app";
import store from "redux/store";
import { ensureBasename } from "ensure-basename";

ensureBasename();

const root = ReactDOM.createRoot(
  document.getElementById("root") as HTMLElement
);

if (module.hot) {
  module.hot.accept();
}

root.render(
  <Provider store={store}>
    <App />
  </Provider>
);
