import React from "react";
import { Provider } from "react-redux";
import { Switch, Route, BrowserRouter } from "react-router-dom";

import "app.css";
import store from "redux/store";
import MainPage from "pages/MainPage";

interface AppProps {}

export const App: React.FC<AppProps> = () => {
  return (
    <Provider store={store}>
      <BrowserRouter>
        <Switch>
          <Route exact={true} path="/" component={MainPage} />
        </Switch>
      </BrowserRouter>
    </Provider>
  );
};
