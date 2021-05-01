import React from "react";
import { DotLoader } from "react-spinners";

import theme from "Theme/theme";
import { StyledLoaderWrap } from "./LoaderStyles";

interface Loader {
  show: boolean;
}
export const Loader: React.FC<Loader> = ({ show }) => {
  return (
    <StyledLoaderWrap show={show}>
      <DotLoader color={theme.color["primary"]} />
    </StyledLoaderWrap>
  );
};
