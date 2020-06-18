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

export const PrimaryButton = () => {
  return <Button label="primary" color="primary" />;
};

export const WarningButton = () => {
  return <Button label="warning" color="warning" />;
};

export const DangerButton = () => {
  return <Button label="danger" color="danger" />;
};

export const InfoButton = () => {
  return <Button label="info" color="info" />;
};

export const PrimaryInvertedButton = () => {
  return <Button label="primary" inverted color="primary" />;
};

export const WarningInvertedButton = () => {
  return <Button label="warning" inverted color="warning" />;
};

export const DangerInvertedButton = () => {
  return <Button label="danger" inverted color="danger" />;
};

export const InfoInvertedButton = () => {
  return <Button label="info" inverted color="info" />;
};
