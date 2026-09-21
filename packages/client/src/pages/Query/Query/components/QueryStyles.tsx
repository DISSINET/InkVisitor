import { QUERY_GRID_HEIGHT, QUERY_GRID_WIDTH } from "../../constants";
import styled from "styled-components";

export const StyledNodeContainer = styled.div<{ $column?: boolean }>`
  display: flex;
  flex-direction: row;
  align-items: center;
  gap: 0.5rem;
  width: 100%;
  height: 100%;
`;

export const StyledNodeMainRow = styled.div`
  display: flex;
  align-items: center;
  gap: 0.5rem;
  width: 100%;
`;

export const StyledParallelOperator = styled.div`
  display: flex;
  flex-direction: column;
  gap: ${({ theme }) => theme.space[4]};
  padding-left: ${({ theme }) => theme.space[2]};
`;

export const StyledGraphNode = styled.div`
  position: relative;
  border-radius: 25px;
  height: ${({ theme }) => theme.space[18]};
  padding: ${({ theme }) => `${theme.space[4]} ${theme.space[7]}`};
  font-weight: bold;
  display: flex;
  align-items: center;
  gap: ${({ theme }) => theme.space[4]};

  .react-select__input-container {
    color: ${({ theme }) => theme.color.white};
  }
`;

// per-node EQ / SUB expansion checkboxes: a small pill straddling the node's
// bottom border. The page background behind the row keeps the border line from
// striking through the checkbox labels.
export const StyledNodeExpansionToggles = styled.div`
  position: absolute;
  bottom: ${({ theme }) => theme.space["-3"]};
  left: 50%;
  transform: translateX(-50%);
  z-index: 1;
  display: flex;
  align-items: center;
  gap: ${({ theme }) => theme.space[2]};
  padding: 0 ${({ theme }) => theme.space[1]};
  background-color: ${({ theme }) => theme.color.pageBg};
  border-radius: ${({ theme }) => theme.borderRadius["sm"]};
  white-space: nowrap;

  label {
    font-size: ${({ theme }) => theme.fontSize["xxs"]};
    font-weight: ${({ theme }) => theme.fontWeight["normal"]};
    color: ${({ theme }) => theme.color["black"]};
  }
`;

export const StyledNodeTypeSelect = styled.div`
  .react-select__control {
    background-color: transparent;
    border: none;
    text-align: center;
  }
  .react-select__single-value {
    color: ${({ theme }) => theme.color.primary};
    font-weight: 900 !important;
    font-size: large;
  }
`;

export const StyledEdgeContainer = styled.div`
  position: relative;
`;

export const StyledEdgeSvg = styled.svg.attrs({
  width: QUERY_GRID_WIDTH,
  height: QUERY_GRID_HEIGHT,
})`
  position: absolute;
  top: 0;
  left: 0;
  pointer-events: none;
`;

export const StyledEdgeControlsLayer = styled.div`
  display: flex;
  align-items: center;
  gap: 5px;
  width: 100%;
  height: 100%;
  justify-content: center;
  position: relative;
  z-index: 1;
`;

export const StyledEdgeBox = styled.div<{ $color: string }>`
  display: flex;
  flex-direction: row;
  align-items: center;
  gap: 0.5rem;
  background-color: ${({ $color }) => $color};
  border-radius: ${({ theme }) => theme.borderRadius["default"]};
  padding: ${({ theme }) => theme.space[1]};
  padding-left: ${({ theme }) => theme.space[3]};
  margin-top: 1.4rem;
`;

export const StyledTooltipList = styled.ul`
  margin: 0;
  padding-left: ${({ theme }) => theme.space[4]};
  display: flex;
  flex-direction: column;
  gap: ${({ theme }) => theme.space[2]};
  list-style-type: disc;
`;

export const StyledTooltipListItem = styled.li`
  b {
    font-weight: ${({ theme }) => theme.fontWeight["bold"]};
  }
`;

// the count beside a checked EQ / SUB toggle; opens the expansion popover
export const StyledExpansionCountButton = styled.button`
  border: none;
  background: none;
  padding: 0;
  margin-left: ${({ theme }) => theme.space[1]};
  font-size: ${({ theme }) => theme.fontSize["xxs"]};
  font-weight: ${({ theme }) => theme.fontWeight["bold"]};
  color: ${({ theme }) => theme.color["black"]};
  cursor: pointer;
  text-decoration: underline;
  text-underline-offset: 2px;
`;

export const StyledExpansionPopover = styled.div`
  z-index: 100;
  display: flex;
  flex-direction: column;
  gap: ${({ theme }) => theme.space[2]};
  max-height: 22rem;
  max-width: 24rem;
  overflow-y: auto;
  padding: ${({ theme }) => theme.space[3]};
  background-color: ${({ theme }) => theme.color["white"]};
  border: 1px solid ${({ theme }) => theme.color["gray"][400]};
  border-radius: ${({ theme }) => theme.borderRadius["sm"]};
  box-shadow: ${({ theme }) => theme.boxShadow["normal"]};
`;

// reserved for the label filter; renders empty until that lands
export const StyledExpansionPopoverHeader = styled.div`
  display: flex;
  align-items: center;
  gap: ${({ theme }) => theme.space[2]};
  min-height: 0;
`;

interface StyledExpansionSectionHeading {
  $variant: "equivalent" | "subordinate";
}
export const StyledExpansionSectionHeading = styled.div<StyledExpansionSectionHeading>`
  font-size: ${({ theme }) => theme.fontSize["xxs"]};
  font-weight: ${({ theme }) => theme.fontWeight["bold"]};
  color: ${({ theme }) => theme.color["black"]};
  padding: ${({ theme }) => theme.space[1]} ${({ theme }) => theme.space[2]};
  border-radius: ${({ theme }) => theme.borderRadius["sm"]};
  background-color: ${({ theme, $variant }) =>
    theme.color["invertedBg"][$variant === "equivalent" ? "info" : "warning"]};
  border-left: 3px solid
    ${({ theme, $variant }) =>
      theme.color[$variant === "equivalent" ? "info" : "warning"]};
`;

export const StyledExpansionSectionTags = styled.div`
  display: flex;
  flex-wrap: wrap;
  gap: ${({ theme }) => theme.space[1]};
  padding-top: ${({ theme }) => theme.space[1]};
`;

export const StyledExpansionPopoverMessage = styled.div`
  font-size: ${({ theme }) => theme.fontSize["xxs"]};
  color: ${({ theme }) => theme.color["mutedText"]};
`;
