import React from "react";
import { DotLoader } from "react-spinners";
import theme from "Theme/theme";
import { StyledLoaderWrap } from "./LoaderStyles";

interface Loader {
  show?: boolean;
  size?: number;
}
export const Loader: React.FC<Loader> = ({ show = false, size = 60 }) => {
  return (
    <StyledLoaderWrap show={show}>
      <DotLoader color={theme.color["primary"]} size={size} />
    </StyledLoaderWrap>
  );
};
