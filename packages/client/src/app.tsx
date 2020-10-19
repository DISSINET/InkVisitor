import React, { useEffect, useState, useLayoutEffect } from "react";
import { Provider } from "react-redux";
import { Switch, Route, BrowserRouter, Redirect } from "react-router-dom";
import { useAuth0 } from "@auth0/auth0-react";

import "app.css";
import store from "redux/store";
import MainPage from "pages/MainPage";

interface AppProps {}

export const App: React.FC<AppProps> = () => {
  const { isAuthenticated, loginWithRedirect } = useAuth0();

  const [size, setSize] = useState([0, 0]);

  useLayoutEffect(() => {
    const handleResize = () => {
      setSize([window.innerWidth, window.innerHeight]);
    };
    window.addEventListener("resize", handleResize);
    handleResize();
    return () => window.removeEventListener("resize", handleResize);
  }, []);

  return (
    <Provider store={store}>
      <BrowserRouter>
        <Switch>
          {/* {isAuthenticated ? ( */}
          <Route
            exact={true}
            render={(props) => <MainPage {...props} size={size} />}
          />
          {/* ) : (
             loginWithRedirect()
           )} */}
        </Switch>
      </BrowserRouter>
    </Provider>
  );
};
