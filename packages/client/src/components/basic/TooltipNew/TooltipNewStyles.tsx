import { animated } from "react-spring";
import styled from "styled-components";
import { Colors } from "types";

interface StyledPopperContainer {
  color: typeof Colors[number];
}
export const StyledPopperContainer = styled(
  animated.div
)<StyledPopperContainer>`
  box-shadow: 0 0 5px rgba(0, 0, 0, 0.3);
  border-radius: 6px;
  background-color: ${({ theme, color }) => theme.color[color]};
  color: ${({ theme }) => theme.color["white"]};
  padding: 10px 18px;
  text-align: center;
  z-index: 1000;
  font-size: ${({ theme }) => theme.fontSize["sm"]};

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
    top: -5px;
    :after {
      box-shadow: -1px -1px 1px rgba(0, 0, 0, 0.1);
    }
  }
  &[data-popper-placement^="top"] > #arrow {
    bottom: -7px;
    :after {
      box-shadow: 1px 1px 1px rgba(0, 0, 0, 0.1);
    }
  }
  &[data-popper-placement^="left"] > #arrow {
    right: -7px;
    :after {
      box-shadow: 1px 1px 1px rgba(0, 0, 0, 0.1);
    }
  }
  &[data-popper-placement^="right"] > #arrow {
    left: -7px;
    :after {
      box-shadow: 1px 1px 1px rgba(0, 0, 0, 0.1);
    }
  }
`;

export const StyledTooltipContent = styled.div`
  display: flex;
`;
