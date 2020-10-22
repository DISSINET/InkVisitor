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

  const onRedirectCallback = (appState: any) => {
    history.push(appState?.returnTo || window.location.pathname);
  };

  return (
    <Auth0Provider
      domain={domain}
      clientId={clientId}
      redirectUri={window.location.origin}
      onRedirectCallback={onRedirectCallback}
      useRefreshTokens={true}
      cacheLocation="localstorage"
    >
      {children}
    </Auth0Provider>
  );
};

export default Auth0ProviderWithHistory;
