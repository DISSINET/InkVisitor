import styled from "styled-components";

export const StyledScrollerViewport = styled.div`
  background: #ccc;
  position: relative;
  width: 10px;
`;

export const StyledScrollerCursor = styled.div`
  cursor: move;
  position: absolute;
  width: 10px;
  background-color: blue;
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
`;

export const StyledMainCanvas = styled.canvas`
  outline: none;
  &.raw {
    cursor: text;
  }
  &.highlight {
    cursor: hand;
  }
`;

export const StyledLinesCanvas = styled.canvas`
  outline: none;
`;

export const StyledAnnotatorMenu = styled.div`
  position: absolute;
  background: white;
  border: 1px solid black;
  padding: 10px;
  z-index: 100;
`;

export const StyledAnnotatorItem = styled.div`
  padding: 5px;
  &:hover {
    background: #ccc;
  }
`;
export const StyledAnnotatorItemOption = styled.div`
  cursor: pointer;
`;
