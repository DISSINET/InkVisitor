import React from "react";
import { useHistory } from "react-router-dom";
import { Auth0Provider, useAuth0 } from "@auth0/auth0-react";

interface Auth0ProviderWithHistory {
  children: JSX.Element;
}
const Auth0ProviderWithHistory: React.FC<Auth0ProviderWithHistory> = ({
  children,
}) => {
  const domain = "dissinet.eu.auth0.com";
  const clientId = "d8OXU8e5BLiOG9UDF0iW15aY00dKWLK1";

  const history = useHistory();
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

  const onRedirectCallback = (appState: any) => {
    console.log("Redirect callback");
    callSecureApi();
    history.push(appState?.returnTo || window.location.pathname);
  };

  return (
    <Auth0Provider
      domain={domain}
      clientId={clientId}
      redirectUri={window.location.origin}
      onRedirectCallback={onRedirectCallback}
    >
      {children}
    </Auth0Provider>
  );
};

export default Auth0ProviderWithHistory;
