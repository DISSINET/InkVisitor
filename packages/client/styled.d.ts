import "styled-components";
import { ThemeType } from "./src/Theme/theme";

declare module "styled-components" {
  export interface DefaultTheme extends ThemeType {}
}
