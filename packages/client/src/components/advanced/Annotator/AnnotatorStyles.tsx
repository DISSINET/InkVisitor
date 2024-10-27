import styled from "styled-components";

export const StyledScrollerViewport = styled.div`
  background: #ccc;
  position: relative;
  width: 16px;
  border-radius: ${({ theme }) => theme.borderRadius["default"]};
`;

export const StyledScrollerCursor = styled.div`
  cursor: move;
  position: absolute;
  width: 10px;
  margin-left: ${({ theme }) => theme.space[1]};
  border-radius: ${({ theme }) => theme.borderRadius["default"]};
`;

export const StyledHightlightedText = styled.pre`
  padding: 10px;
  border: 1px solid black;
  margin-top: 10px;
`;

export const StyledCanvasWrapper = styled.div`
  border: 1px solid black;
  padding: 2px;
  display: flex;
  flex-direction: row;
`;

export const StyledMainCanvas = styled.canvas`
  outline: none;
  cursor: text;
`;

export const StyledLinesCanvas = styled.canvas`
  outline: none;
`;

interface StyledAnnotatorMenuProps {
  $top: number;
  $left: number;
  $translateY: string;
}
export const StyledAnnotatorMenu = styled.div<StyledAnnotatorMenuProps>`
  position: absolute;
  transform: translate(0%, ${({ $translateY }) => $translateY});
  width: 400px;
  left: ${({ $left }) => $left + "px"};
  top: ${({ $top }) => $top + "px"};
  background: ${({ theme }) => theme.color.gray["300"]};
  border: ${({ theme }) =>
    theme.borderWidth["default"] + " solid " + theme.color.gray["300"]};
  padding: ${({ theme }) => theme.space[2]};
  z-index: 100;
  border-radius: ${({ theme }) => theme.borderRadius["default"]};
  box-shadow: 4px 4px 4px rgba(0, 0, 0, 0.4);
  opacity: 0.9;
  &:hover {
    opacity: 1;
  }
  transition: opacity 0.5s;
`;

export const StyledAnnotatorItem = styled.div`
  padding: ${({ theme }) => theme.space[2]};
  background: ${({ theme }) => theme.color.gray["300"]};
  border: 2px solid ${({ theme }) => theme.color.gray["300"]};
  &:hover {
    background: ${({ theme }) => theme.color.gray["200"]};
  }
`;
export const StyledAnnotatorItemContent = styled.div`
  display: inline-flex;
  gap: ${({ theme }) => theme.space[2]};
  margin-top: ${({ theme }) => theme.space[2]};
  margin-bottom: ${({ theme }) => theme.space[2]};
  flex-wrap: wrap;
`;
export const StyledAnnotatorItemTitle = styled.div`
  color: ${({ theme }) => theme.color.gray["700"]};
  font-size: ${({ theme }) => theme.fontSize["md"]};
  font-weight: ${({ theme }) => theme.fontWeight["medium"]};
`;

export const StyledAnnotatorAnchorList = styled.div`
  display: flex;
  gap: ${({ theme }) => theme.space[2]};
  flex-wrap: wrap;
`;
