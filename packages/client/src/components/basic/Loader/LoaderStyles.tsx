import styled from "styled-components";

interface StyledLoaderWrap {
  $show: boolean;
  $noBackground: boolean;
}
export const StyledLoaderWrap = styled.div<StyledLoaderWrap>`
  height: 100%;
  width: 100%;
  display: ${({ $show }) => ($show ? "flex" : "none")};
  justify-content: center;
  align-items: center;
  position: absolute;
  top: 0;
  left: 0;
  background-color: ${({ theme, $noBackground }) =>
    !$noBackground ? theme.color["primaryTransparent"] : ""};
  z-index: 20;

  /* react-spinners staggers its dots with an animation-delay, but writes an
     inline animation-fill-mode: forwards — a dot still inside its delay holds
     its untransformed size instead of the 0% keyframe. only !important beats
     that inline style */
  /* (Workaround for doubled Loader bug) */
  > span > span {
    animation-fill-mode: both !important;
  }
`;
