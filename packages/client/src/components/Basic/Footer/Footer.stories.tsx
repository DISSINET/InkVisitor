import * as React from "react";
import { Footer } from "components";

export default {
  title: "Footer",
  component: Footer,
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

export const DefaultFooter = ({ ...args }) => {
  return <Footer {...args} />;
};
DefaultFooter.args = {
  color: "primary",
};
