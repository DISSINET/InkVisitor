import * as React from "react";
import { Button } from "./button";

export default {
  title: "Button",
  parameters: {
    info: { inline: true },
  },
};

export const DefaultButton = () => {
  return <Button label="default" />;
};
