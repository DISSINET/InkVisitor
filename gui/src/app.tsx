import * as React from "react";

import { Button } from "./components";

import "./app.css";

interface AppProps {}

export const App: React.FC<AppProps> = () => {
  return (
    <div>
      <h1>app works</h1>
      <Button />
    </div>
  );
};
