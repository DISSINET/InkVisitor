import theme from "Theme/theme";
import React, { useContext } from "react";
import { DotLoader } from "react-spinners";
import { StyledLoaderWrap } from "./LoaderStyles";
import { ThemeContext } from "styled-components";

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
  const themeContext = useContext(ThemeContext);
  
  return (
    <StyledLoaderWrap show={show}>
      <DotLoader
        color={
          inverted ? themeContext.color["white"] : themeContext.color["primary"]
        }
        size={size}
      />
    </StyledLoaderWrap>
  );
};
