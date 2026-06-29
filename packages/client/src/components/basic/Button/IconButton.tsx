import React from "react";
import { ButtonSize } from "types";
import { Button } from "./Button";

type ButtonProps = React.ComponentProps<typeof Button>;

interface IconButton extends Omit<ButtonProps, "label"> {}

export const IconButton: React.FC<IconButton> = ({
  shape = "square",
  size = ButtonSize.Small,
  inverted = true,
  ...rest
}) => {
  return <Button shape={shape} size={size} inverted={inverted} {...rest} />;
};
