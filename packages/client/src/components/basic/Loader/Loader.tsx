import React from "react";
import { DotLoader } from "react-spinners";
import theme from "Theme/theme";
import { Colors } from "types";
import { StyledLoaderWrap } from "./LoaderStyles";

interface Loader {
  show?: boolean;
  size?: number;
  inverted?: boolean;
}
export const Loader: React.FC<Loader> = ({
  show = false,
  size = 60,
  inverted = false,
}) => {
  return (
    <StyledLoaderWrap show={show}>
      <DotLoader
        color={inverted ? theme.color["white"] : theme.color["primary"]}
        size={size}
      />
    </StyledLoaderWrap>
  );
};
