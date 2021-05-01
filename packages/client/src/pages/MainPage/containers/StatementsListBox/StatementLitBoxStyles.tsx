import styled from "styled-components";

export const StyledDots = styled.div`
  display: flex;
  align-items: flex-end;
`;
interface StyledLoaderWrap {
  show: boolean;
}
export const StyledLoaderWrap = styled.div<StyledLoaderWrap>`
  height: 100%;
  width: 100%;
  display: ${({ show }) => (show ? "flex" : "none")};
  justify-content: center;
  align-items: center;
  position: absolute;
  top: 0;
  left: 0;
  background-color: rgba(0, 0, 0, 0.2);
`;
