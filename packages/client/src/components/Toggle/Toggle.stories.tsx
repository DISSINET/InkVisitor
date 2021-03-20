import * as React from "react";
import { Toggle } from "components";
import { FaInfo, FaPencilAlt, FaTrashAlt } from "react-icons/fa";

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
export const DangerLongTextToggle = () => {
  return (
    <Toggle
      optionList={[
        "This text is too long to handle",
        "Another long which is too long to handle",
        "Masarykova",
        "Univerzita",
      ]}
      color="danger"
    />
  );
};
export const SuccessIconToggle = () => {
  return (
    <Toggle
      optionList={[<FaPencilAlt />, <FaTrashAlt />, <FaInfo />]}
      color="success"
    />
  );
};
