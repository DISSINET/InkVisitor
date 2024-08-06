import React, { useContext } from "react";
import { DotLoader } from "react-spinners";
import { ThemeContext } from "styled-components";
import { StyledLoaderWrap } from "./LoaderStyles";
import { ThemeColor } from "Theme/theme";

interface Loader {
  show?: boolean;
  size?: number;
  noBackground?: boolean;
  color?: keyof ThemeColor;
}
export const Loader: React.FC<Loader> = ({
  show = false,
  size = 60,
  noBackground = false,
  color = "primary",
}) => {
  const themeContext = useContext(ThemeContext);

  return (
    <StyledLoaderWrap $show={show} $noBackground={noBackground}>
      <DotLoader color={themeContext?.color[color]} size={size} />
    </StyledLoaderWrap>
  );
};
