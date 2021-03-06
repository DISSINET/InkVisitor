import * as React from "react";
import { Footer } from "components";

export default {
  title: "Footer",
  parameters: {
    info: { inline: true },
  },
};

export const DefaultFooter = () => {
  return <Footer />;
};
export const SuccessFooter = () => {
  return <Footer color={"success"} />;
};
export const BigDangerFooter = () => {
  return <Footer height={80} color={"danger"} />;
};
