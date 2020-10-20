import React from "react";
import { useHistory } from "react-router-dom";
import { Auth0Provider } from "@auth0/auth0-react";

interface Auth0ProviderWithHistory {
  children: JSX.Element;
}
const Auth0ProviderWithHistory: React.FC<Auth0ProviderWithHistory> = ({
  children,
}) => {
  const domain = "dissinet.eu.auth0.com";
  const clientId = "AxtRU4O7TgwDd0JeUWxHm2s8HgoJzhWF";

  const history = useHistory();

  const onRedirectCallback = (appState: any) => {
    history.push(appState?.returnTo || window.location.pathname);
  };

  return (
    <Auth0Provider
      domain={domain}
      clientId={clientId}
      redirectUri="http://localhost:8081"
      onRedirectCallback={onRedirectCallback}
      // redirectUri={window.location.origin}
    >
      {children}
    </Auth0Provider>
  );
};

export default Auth0ProviderWithHistory;
