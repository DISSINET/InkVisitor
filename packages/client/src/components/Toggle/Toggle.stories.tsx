import * as React from "react";
import { Toggle } from "components";

export default {
  title: "Toggle",
  parameters: {
    info: { inline: true },
  },
};

export const PrimaryToggle = () => {
  return (
    <Toggle optionList={["I", "n", "k", "V", "i", "s", "i", "t", "o", "r"]} />
  );
};
export const InfoInvertedToggle = () => {
  return <Toggle optionList={["M", "U", "N", "I"]} color="info" inverted />;
};
