import * as React from "react";
import { Button } from "components";
import { FaTrashAlt } from "react-icons/fa";

export default {
  title: "Button",
  component: Button,
  parameters: {
    info: { inline: true },
  },
  argTypes: {
    color: {
      options: ["primary", "info", "success", "danger", "warning", "black"],
      control: { type: "select" },
    },
  },
};

export const DefaultButton = ({ ...args }) => {
  return <Button {...args} />;
};
DefaultButton.args = {
  color: "primary",
  label: "Default",
  inverted: false,
};

export const IconOnlyButton = ({ ...args }) => {
  return <Button {...args} icon={<FaTrashAlt />} />;
};
IconOnlyButton.args = {
  color: "danger",
  inverted: false,
};

export const IconTextButton = ({ ...args }) => {
  return <Button {...args} icon={<FaTrashAlt />} />;
};
IconTextButton.args = {
  label: "Icon text",
  inverted: true,
};
