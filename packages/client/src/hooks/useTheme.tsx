import { useContext } from "react";
import { ThemeContext } from "styled-components";
import { ThemeType } from "Theme/theme";

export const useTheme = (): ThemeType => {
  const theme = useContext(ThemeContext);

  if (!theme) {
    throw new Error("useTheme must be used within a ThemeProvider.");
  }

  return theme as ThemeType;
};
