import { ThemeColor } from "Theme/theme";
import { useTheme } from "hooks";
import React from "react";
import { BeatLoader, DotLoader } from "react-spinners";
import { StyledLoaderWrap } from "./LoaderStyles";

interface Loader {
  show?: boolean;
  size?: number;
  noBackground?: boolean;
  color?: keyof ThemeColor;
  loaderStyle?: "default" | "beat";
}
export const Loader: React.FC<Loader> = ({
  show = false,
  size = 50,
  noBackground = false,
  color = "primary",
  loaderStyle = "default",
}) => {
  const theme = useTheme();

  return (
    <StyledLoaderWrap $show={show} $noBackground={noBackground}>
      {loaderStyle === "default" && (
        <DotLoader color={theme.color[color] as string} size={size} />
      )}
      {loaderStyle === "beat" && (
        <BeatLoader color={theme.color[color] as string} size={size} />
      )}
    </StyledLoaderWrap>
  );
};
