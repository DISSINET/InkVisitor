import { animated } from "react-spring";
import styled from "styled-components";
import { Colors } from "types";

interface StyledContainer {
  color: typeof Colors[number];
  arrowoffset: number;
}
export const StyledContainer = styled(animated.div)<StyledContainer>`
  color: ${({ theme }) => theme.color["white"]};
  background-color: ${({ theme, color }) => theme.color[color]};
  min-width: ${({ theme }) => theme.space[8]};
  font-size: ${({ theme }) => theme.fontSize["xxs"]};

  box-shadow: 0 0 5px rgba(0, 0, 0, 0.3);
  border-radius: ${({ theme }) => theme.borderRadius["sm"]};
  z-index: 1000;

  display: flex;
  justify-content: center;
  align-items: center;
  max-width: 40rem;

  cursor: crosshair;

  border: 2px dotted black;

  #arrow {
    position: absolute;
    width: 10px;
    height: 10px;
    z-index: 1000;
    &:after {
      content: "";
      background-color: black;
      position: absolute;
      left: 0;
      transform: rotate(45deg);
      width: 10px;
      height: 10px;
    }
  }

  &[data-popper-placement^="bottom"] > #arrow {
    top: ${({ arrowoffset }) => `${arrowoffset}px`};
    :after {
      box-shadow: -1px -1px 1px rgba(0, 0, 0, 0.1);
    }
  }
  &[data-popper-placement^="top"] > #arrow {
    bottom: ${({ arrowoffset }) => `${arrowoffset}px`};
    :after {
      box-shadow: 1px 1px 1px rgba(0, 0, 0, 0.1);
    }
  }
  &[data-popper-placement^="left"] > #arrow {
    right: ${({ arrowoffset }) => `${arrowoffset}px`};
    :after {
      box-shadow: 1px 1px 1px rgba(0, 0, 0, 0.1);
    }
  }
  &[data-popper-placement^="right"] > #arrow {
    left: ${({ arrowoffset }) => `${arrowoffset}px`};
    :after {
      box-shadow: 1px 1px 1px rgba(0, 0, 0, 0.1);
    }
  }
`;

interface StyledContent {
  tagGroup?: boolean;
}
export const StyledContent = styled.div<StyledContent>`
  margin: ${({ theme, tagGroup }) =>
    `${theme.space[2]} ${tagGroup ? theme.space[2] : theme.space[3]}`};
`;

export const StyledRow = styled.div`
  display: flex;
`;
export const StyledLabel = styled.p`
  max-width: 35rem;
  font-weight: ${({ theme }) => theme.fontWeight["bold"]};
  word-wrap: break-word;
`;
