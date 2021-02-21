import * as React from "react";
import { Button } from "components";
import { FaTrashAlt } from "react-icons/fa";

export default {
  title: "Button",
  parameters: {
    info: { inline: true },
  },
};

export const DefaultButton = () => {
  return <Button label="default" />;
};

export const IconButton = () => {
  return <Button icon={<FaTrashAlt />} color="danger" />;
};
export const PrimaryButton = () => {
  return <Button label="Primary" color="primary" />;
};
export const SuccessButton = () => {
  return <Button label="Success" color="success" />;
};

export const WarningButton = () => {
  return <Button label="Warning" color="warning" />;
};

export const DangerButton = () => {
  return <Button label="Danger" color="danger" />;
};

export const InfoButton = () => {
  return <Button label="Info" color="info" />;
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
