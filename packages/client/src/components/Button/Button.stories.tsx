import * as React from "react";
import { Button } from "components";

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
export const SuccessButton = () => {
  return <Button label="success" color="success" />;
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
  return <Button label="primary inverted" inverted color="primary" />;
};

export const SuccessInvertedButton = () => {
  return <Button label="success inverted" inverted color="success" />;
};

export const WarningInvertedButton = () => {
  return <Button label="warning inverted" inverted color="warning" />;
};

export const DangerInvertedButton = () => {
  return <Button label="danger inverted" inverted color="danger" />;
};

export const InfoInvertedButton = () => {
  return <Button label="info inverted" inverted color="info" />;
};
