import { animated } from "@react-spring/web";
import { ThemeColor } from "Theme/theme";
import styled from "styled-components";

interface StyledContainer {
  $color: keyof ThemeColor;
  arrowoffset: number;
}
export const StyledContainer = styled(animated.div)<StyledContainer>`
  color: ${({ theme }) => theme.color.tooltipColor};
  background-color: ${({ theme, $color }) => theme.color[$color]};
  min-width: ${({ theme }) => theme.space[8]};
  font-size: ${({ theme }) => theme.fontSize["xxs"]};

  box-shadow: 0 0 5px ${({ theme }) => theme.color.tooltipBoxShadow};
  border-radius: ${({ theme }) => theme.borderRadius["sm"]};
  z-index: 888;

  display: flex;
  justify-content: center;
  align-items: center;
  max-width: 40rem;

  &[data-popper-placement^="bottom"] > #arrow {
    top: ${({ arrowoffset }) => `${arrowoffset + 2}px`};
    :after {
      box-shadow: -1px -1px 1px ${({ theme }) => theme.color.tooltipArrowBoxShadow};
    }
  }
  &[data-popper-placement^="top"] > #arrow {
    bottom: ${({ arrowoffset }) => `${arrowoffset + 2}px`};
    :after {
      box-shadow: 1px 1px 1px
        ${({ theme }) => theme.color.tooltipArrowBoxShadow};
    }
  }
  &[data-popper-placement^="left"] > #arrow {
    right: ${({ arrowoffset }) => `${arrowoffset + 2}px`};
    :after {
      box-shadow: 1px 1px 1px
        ${({ theme }) => theme.color.tooltipArrowBoxShadow};
    }
  }
  &[data-popper-placement^="right"] > #arrow {
    left: ${({ arrowoffset }) => `${arrowoffset + 2}px`};
    :after {
      box-shadow: 1px 1px 1px
        ${({ theme }) => theme.color.tooltipArrowBoxShadow};
    }
  }
`;
export const StyledArrow = styled.div`
  position: absolute;
  width: 10px;
  height: 10px;
  &:after {
    content: "";
    /* background-color: ${({ theme }) => theme.color["black"]}; */
    background-color: black;
    position: absolute;
    left: 0;
    transform: rotate(45deg);
    width: 10px;
    height: 10px;
  }
`;

interface StyledContent {
  tagGroup?: boolean;
  $color: keyof ThemeColor;
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
