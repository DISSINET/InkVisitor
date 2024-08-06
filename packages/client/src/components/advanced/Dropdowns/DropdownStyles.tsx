import { ThemeColor } from "Theme/theme";
import styled from "styled-components";

interface StyledEntityValue {
  color?: keyof ThemeColor;
}
export const StyledEntityValue = styled.div<StyledEntityValue>`
  display: flex;
  align-items: center;
  height: 100%;
  padding: 5px;
  border-left-style: solid;
  border-left-width: 4px;
  border-left-color: ${({ theme, color }) => (color ? theme.color[color] : "")};
`;
interface StyledEntityMultiValue {
  $color?: keyof ThemeColor;
}
export const StyledEntityMultiValue = styled.div<StyledEntityMultiValue>`
  padding: 0.2rem 0.2rem 0.2rem;
  padding-left: 0.3rem;
  border-left-style: solid;
  border-left-width: 4px;
  border-left-color: ${({ theme, $color }) =>
    $color ? theme.color[$color] : ""};
  border-radius: 0px;
`;

export const StyledOptionRow = styled.div`
  display: flex;
  align-items: center;
  height: 2.5rem;
`;
export const StyledOptionIconWrap = styled.div`
  margin: 0 0.2rem;
`;
export const StyledEntityOptionClass = styled.div`
  display: flex;
  justify-content: center;
  align-items: center;
  width: 1.5rem;
`;
