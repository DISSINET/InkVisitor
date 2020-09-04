import * as React from "react";
import { Arrow } from "components";

export default {
  title: "Arrow",
  parameters: {
    info: { inline: true },
  },
};

export const DefaultArrow = () => {
  return <Arrow />;
};
export const TopArrow = () => {
  return <Arrow rotation="top" />;
};
export const BottomArrow = () => {
  return <Arrow rotation="bottom" />;
};
export const LeftArrow = () => {
  return <Arrow rotation="left" />;
};
export const RightArrow = () => {
  return <Arrow rotation="right" />;
};
