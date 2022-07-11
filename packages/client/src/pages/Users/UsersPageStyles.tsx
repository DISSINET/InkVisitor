import styled from "styled-components";

interface StyledContent {
  height?: number;
}
export const StyledContent = styled.div<StyledContent>`
  width: 100%;
  height: ${({ height }) => (height ? height : "")};
  display: flex;
  align-items: center;
  flex-direction: column;
`;
