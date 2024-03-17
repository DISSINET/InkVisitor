import React, { useContext } from "react";
import { DotLoader } from "react-spinners";
import { ThemeContext } from "styled-components";
import { StyledLoaderWrap } from "./LoaderStyles";

interface Loader {
  show?: boolean;
  size?: number;
}
export const Loader: React.FC<Loader> = ({ show = false, size = 60 }) => {
  const themeContext = useContext(ThemeContext);

  return (
    <StyledLoaderWrap $show={show}>
      <DotLoader color={themeContext?.color["primary"]} size={size} />
    </StyledLoaderWrap>
  );
};
