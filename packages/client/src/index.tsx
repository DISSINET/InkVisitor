import * as ReactDOM from "react-dom/client";
import { Provider } from "react-redux";

import { App } from "app";
import { ensureBasename } from "ensure-basename";
import { HelmetProvider } from "react-helmet-async";
import store from "redux/store";

ensureBasename();

const root = ReactDOM.createRoot(
  document.getElementById("root") as HTMLElement
);

const helmetContext = {};

root.render(
  <Provider store={store}>
    <HelmetProvider context={helmetContext}>
      <App />
    </HelmetProvider>
  </Provider>
);
