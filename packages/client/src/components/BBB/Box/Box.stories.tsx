import * as React from "react";
import { Box } from "components";

export default {
  title: "Box",
  parameters: {
    info: { inline: true },
  },
  args: {
    color: "primary",
    label: "Default box",
    height: 400,
  },
  argTypes: {
    color: {
      options: ["primary", "info", "success", "danger", "warning"],
      control: { type: "select" },
    },
  },
};

export const DefaultBox = ({ ...args }) => {
  return <Box {...args}>{<div>box content</div>}</Box>;
};
