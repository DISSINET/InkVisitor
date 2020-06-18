import React from "react";
import { Provider } from "react-redux";

import "app.css";
import store from "redux/store";
import MainPage from "pages/MainPage";

interface AppProps {}

export const App: React.FC<AppProps> = () => {
  return (
    <Provider store={store}>
      <MainPage />
    </Provider>
  );
};
