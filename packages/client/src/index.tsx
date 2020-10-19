import * as React from "react";
import * as ReactDOM from "react-dom";

import { App } from "app";
import { Auth0Provider } from "@auth0/auth0-react";

ReactDOM.render(
  <Auth0Provider
    domain="dissinet.eu.auth0.com"
    clientId="d8OXU8e5BLiOG9UDF0iW15aY00dKWLK1"
    // redirectUri={"http://localhost:8081"}
    redirectUri={window.location.origin}
  >
    <App />
  </Auth0Provider>,
  document.getElementById("root")
);
