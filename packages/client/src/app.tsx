import React, { useEffect, useState, useLayoutEffect } from "react";
import { Provider } from "react-redux";
import { Switch, Route, BrowserRouter } from "react-router-dom";

import "app.css";
import store from "redux/store";
import MainPage from "pages/MainPage";

interface AppProps {}

export const App: React.FC<AppProps> = () => {
  const [size, setSize] = useState([0, 0]);

  useLayoutEffect(() => {
    const handleResize = () => {
      setSize([window.innerWidth, window.innerHeight]);
      console.log(
        console.log("resized to: ", window.innerWidth, "x", window.innerHeight)
      );
    };
    window.addEventListener("resize", handleResize);
    handleResize();
    return () => window.removeEventListener("resize", handleResize);
  }, []);

  return (
    <Provider store={store}>
      <BrowserRouter>
        <Switch>
          <Route
            exact={true}
            render={(props) => <MainPage {...props} size={size} />}
          />
        </Switch>
      </BrowserRouter>
    </Provider>
  );
};
