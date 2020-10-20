import React, { useState, useLayoutEffect } from "react";
import { Provider } from "react-redux";
import { Switch, Route, BrowserRouter } from "react-router-dom";
import { useAuth0 } from "@auth0/auth0-react";
import Auth0ProviderWithHistory from "auth/Auth0ProviderWithHistory";

import "app.css";
import store from "redux/store";
import MainPage from "pages/MainPage";

interface AppProps {}

export const App: React.FC<AppProps> = () => {
  const { getAccessTokenSilently } = useAuth0();

  const callSecureApi = async () => {
    console.log("calling secure api");
    try {
      const token = await getAccessTokenSilently();

      const response = await fetch(
        `https://dissinet.eu.auth0.com/oauth/token`,
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      );

      const responseData = await response.json();

      console.log(responseData.message);
    } catch (error) {
      console.log(error.message);
    }
  };

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
    // <Auth0ProviderWithHistory>
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
    // </Auth0ProviderWithHistory>
  );
};
