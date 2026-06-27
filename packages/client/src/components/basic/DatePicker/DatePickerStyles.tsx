import styled from "styled-components";
import { ThemeColor } from "Theme/theme";

const getWidth = (width?: number | "full") => {
  if (width) {
    return width === "full" ? "100%" : `${width / 10}rem`;
  }
  return "auto";
};

export const StyledWrapper = styled.div<{ width?: number | "full" }>`
  position: relative;
  display: inline-flex;
  width: ${({ width }) => (width === "full" ? "100%" : "auto")};
  flex-grow: ${({ width }) => (width === "full" ? 1 : "")};
`;

interface StyledTrigger {
  $inverted?: boolean;
  $noBorder?: boolean;
  $borderColor?: keyof ThemeColor;
  $open?: boolean;
  width?: number | "full";
  $disabled?: boolean;
}
export const StyledTrigger = styled.div<StyledTrigger>`
  height: ${({ theme }) => theme.space[10]};
  width: ${({ width }) => getWidth(width)};
  min-width: 10.2rem;
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: ${({ theme }) => theme.space[2]};
  text-align: left;
  font-family: inherit;
  font-size: ${({ theme }) => theme.fontSize["xs"]};
  color: ${({ $inverted, theme }) =>
    $inverted ? theme.color["white"] : theme.color["primary"]};
  background-color: ${({ $inverted, theme }) =>
    $inverted ? theme.color["primary"] : theme.color["white"]};
  background: ${({ $disabled, theme }) =>
    $disabled ? theme.background["stripes"] : ""};
  border-style: solid;
  border-width: ${({ theme, $noBorder, $inverted }) =>
    $noBorder || $inverted ? 0 : theme.borderWidth[1]};
  border-color: ${({ theme, $open, $borderColor }) =>
    $open
      ? theme.color["info"]
      : $borderColor
        ? theme.color[$borderColor]
        : theme.color["gray"]["400"]};
  border-radius: ${({ theme }) => theme.borderRadius["input"]};
  padding: 0 ${({ theme }) => theme.space[2]};
  cursor: ${({ $disabled }) => ($disabled ? "not-allowed" : "pointer")};
  box-shadow: ${({ theme, $open }) =>
    $open
      ? `inset 0 0 0 ${theme.borderWidth[1]} ${theme.color["info"]}`
      : "none"};
  transition: border-color 0.12s ease;

  &:hover {
    border-color: ${({ theme, $disabled, $noBorder }) =>
      $disabled || $noBorder ? "" : theme.color["info"]};
  }
  &:focus-visible {
    outline: 0;
    border-color: ${({ theme }) => theme.color["info"]};
    box-shadow: inset 0 0 0 ${({ theme }) => theme.borderWidth[1]} ${({ theme }) => theme.color["info"]};
  }
`;

export const StyledTriggerValue = styled.span<{ $placeholder?: boolean }>`
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
  color: ${({ theme, $placeholder }) =>
    $placeholder ? theme.color["gray"][500] : "inherit"};
  font-weight: ${({ theme, $placeholder }) =>
    $placeholder ? theme.fontWeight["normal"] : theme.fontWeight["medium"]};
`;

export const StyledTriggerIcons = styled.span`
  display: flex;
  align-items: center;
  flex-shrink: 0;
  gap: ${({ theme }) => theme.space[1]};
  color: ${({ theme }) => theme.color["gray"][600]};
`;

export const StyledClearButton = styled.span`
  display: flex;
  align-items: center;
  cursor: pointer;
  opacity: 0.7;
  &:hover {
    opacity: 1;
    color: ${({ theme }) => theme.color["danger"]};
  }
`;

export const StyledCalendar = styled.div`
  z-index: 10000;
  width: 27rem;
  background-color: ${({ theme }) => theme.color["white"]};
  border: ${({ theme }) => theme.borderWidth[1]} solid
    ${({ theme }) => theme.color["gray"][300]};
  border-radius: ${({ theme }) => theme.borderRadius["default"]};
  box-shadow: ${({ theme }) => theme.boxShadow["high"]};
  padding: ${({ theme }) => theme.space[3]};
  color: ${({ theme }) => theme.color["primary"]};
  user-select: none;
`;

export const StyledHeader = styled.div`
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-bottom: ${({ theme }) => theme.space[2]};
`;

export const StyledHeaderNav = styled.div`
  display: flex;
  align-items: center;
  gap: ${({ theme }) => theme.space["px"]};
`;

export const StyledNavButton = styled.button`
  display: flex;
  align-items: center;
  justify-content: center;
  width: ${({ theme }) => theme.space[8]};
  height: ${({ theme }) => theme.space[8]};
  border: none;
  background: transparent;
  border-radius: ${({ theme }) => theme.borderRadius["sm"]};
  color: ${({ theme }) => theme.color["gray"][700]};
  cursor: pointer;
  transition: background-color 0.12s ease, color 0.12s ease;

  &:hover {
    background-color: ${({ theme }) => theme.color["gray"][200]};
    color: ${({ theme }) => theme.color["primary"]};
  }
  &:focus-visible {
    outline: 0;
    background-color: ${({ theme }) => theme.color["gray"][200]};
  }
`;

export const StyledMonthLabel = styled.button`
  flex: 1;
  display: flex;
  align-items: center;
  justify-content: center;
  height: ${({ theme }) => theme.space[8]};
  border: none;
  background: transparent;
  font-family: inherit;
  text-align: center;
  font-size: ${({ theme }) => theme.fontSize["sm"]};
  font-weight: ${({ theme }) => theme.fontWeight["bold"]};
  color: ${({ theme }) => theme.color["primary"]};
  letter-spacing: 0.02em;
  border-radius: ${({ theme }) => theme.borderRadius["sm"]};
  cursor: pointer;
  transition: background-color 0.12s ease, color 0.12s ease;
  text-transform: capitalize;

  &:hover {
    background-color: ${({ theme }) => theme.color["gray"][200]};
    color: ${({ theme }) => theme.color["info"]};
  }
  &:focus-visible {
    outline: 0;
    background-color: ${({ theme }) => theme.color["gray"][200]};
  }
`;

export const StyledGrid = styled.div`
  display: grid;
  grid-template-columns: repeat(3, 1fr);
  gap: ${({ theme }) => theme.space[1]};
  padding: ${({ theme }) => theme.space[1]} 0;
`;

interface StyledGridCell {
  $selected?: boolean;
  $current?: boolean;
}
export const StyledGridCell = styled.button<StyledGridCell>`
  height: ${({ theme }) => theme.space[12]};
  display: flex;
  align-items: center;
  justify-content: center;
  border: none;
  border-radius: ${({ theme }) => theme.borderRadius["sm"]};
  background: ${({ theme, $selected }) =>
    $selected ? theme.color["primary"] : "transparent"};
  color: ${({ theme, $selected }) =>
    $selected ? theme.color["white"] : theme.color["text"]};
  font-size: ${({ theme }) => theme.fontSize["xs"]};
  font-weight: ${({ theme, $selected, $current }) =>
    $selected || $current
      ? theme.fontWeight["bold"]
      : theme.fontWeight["normal"]};
  text-transform: capitalize;
  cursor: pointer;
  transition: background-color 0.12s ease, color 0.12s ease;
  box-shadow: ${({ theme, $current, $selected }) =>
    $current && !$selected
      ? `inset 0 0 0 ${theme.borderWidth[1]} ${theme.color["info"]}`
      : "none"};

  &:hover {
    background-color: ${({ theme, $selected }) =>
      $selected ? theme.color["primary"] : theme.color["gray"][200]};
  }
  &:focus-visible {
    outline: 0;
    box-shadow: 0 0 0 2px ${({ theme }) => theme.color["info"]};
  }
`;

export const StyledWeekRow = styled.div`
  display: grid;
  grid-template-columns: repeat(7, 1fr);
  margin-bottom: ${({ theme }) => theme.space[1]};
`;

export const StyledWeekday = styled.div<{ $weekend?: boolean }>`
  text-align: center;
  font-size: ${({ theme }) => theme.fontSize["xxs"]};
  font-weight: ${({ theme }) => theme.fontWeight["bold"]};
  text-transform: uppercase;
  letter-spacing: 0.04em;
  color: ${({ theme, $weekend }) =>
    $weekend ? theme.color["gray"][450] : theme.color["gray"][600]};
  padding: ${({ theme }) => theme.space[1]} 0;
`;

export const StyledDayGrid = styled.div`
  display: grid;
  grid-template-columns: repeat(7, 1fr);
  gap: ${({ theme }) => theme.space["px"]};
`;

interface StyledDay {
  $selected?: boolean;
  $today?: boolean;
  $outside?: boolean;
  $weekend?: boolean;
}
export const StyledDay = styled.button<StyledDay>`
  position: relative;
  aspect-ratio: 1 / 1;
  display: flex;
  align-items: center;
  justify-content: center;
  border: none;
  background: ${({ theme, $selected }) =>
    $selected ? theme.color["primary"] : "transparent"};
  border-radius: ${({ theme }) => theme.borderRadius["sm"]};
  font-size: ${({ theme }) => theme.fontSize["xs"]};
  font-weight: ${({ theme, $selected, $today }) =>
    $selected || $today
      ? theme.fontWeight["bold"]
      : theme.fontWeight["normal"]};
  cursor: pointer;
  transition: background-color 0.12s ease, color 0.12s ease;
  color: ${({ theme, $selected, $outside, $weekend }) => {
    if ($selected) return theme.color["white"];
    if ($outside) return theme.color["gray"][400];
    if ($weekend) return theme.color["gray"][600];
    return theme.color["text"];
  }};

  &:hover {
    background-color: ${({ theme, $selected }) =>
      $selected ? theme.color["primary"] : theme.color["gray"][200]};
  }
  &:focus-visible {
    outline: 0;
    box-shadow: 0 0 0 2px ${({ theme }) => theme.color["info"]};
  }

  /* today marker */
  &::after {
    content: "";
    position: absolute;
    bottom: 0.4rem;
    left: 50%;
    transform: translateX(-50%);
    width: 0.5rem;
    height: 0.5rem;
    border-radius: ${({ theme }) => theme.borderRadius["full"]};
    background-color: ${({ theme, $today, $selected }) =>
      $today ? ($selected ? theme.color["white"] : theme.color["info"]) : "transparent"};
  }
`;

export const StyledTimeRow = styled.div`
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: ${({ theme }) => theme.space[2]};
  margin-top: ${({ theme }) => theme.space[3]};
  padding-top: ${({ theme }) => theme.space[3]};
  border-top: ${({ theme }) => theme.borderWidth[1]} solid
    ${({ theme }) => theme.color["gray"][200]};
`;

export const StyledTimeLabel = styled.span`
  display: flex;
  align-items: center;
  gap: ${({ theme }) => theme.space[1]};
  font-size: ${({ theme }) => theme.fontSize["xs"]};
  font-weight: ${({ theme }) => theme.fontWeight["medium"]};
  color: ${({ theme }) => theme.color["gray"][600]};

  svg {
    color: ${({ theme }) => theme.color["info"]};
  }
`;

export const StyledTimeControlWrap = styled.div`
  position: relative;
  display: inline-flex;
`;

export const StyledTimeControl = styled.div`
  display: inline-flex;
  align-items: center;
  padding: ${({ theme }) => theme.space["px"]} ${({ theme }) => theme.space["px"]}
    ${({ theme }) => theme.space["px"]} ${({ theme }) => theme.space[2]};
  border: ${({ theme }) => theme.borderWidth[1]} solid
    ${({ theme }) => theme.color["gray"][300]};
  border-radius: ${({ theme }) => theme.borderRadius["sm"]};
  background-color: ${({ theme }) => theme.color["white"]};
  transition: border-color 0.12s ease;

  &:hover,
  &:focus-within {
    border-color: ${({ theme }) => theme.color["info"]};
  }
`;

export const StyledTimeSegment = styled.div`
  display: flex;
  align-items: center;
`;

export const StyledTimeValueInput = styled.input`
  width: 2.6rem;
  height: ${({ theme }) => theme.space[7]};
  border: none;
  background: transparent;
  text-align: center;
  font-family: inherit;
  font-size: ${({ theme }) => theme.fontSize["sm"]};
  font-weight: ${({ theme }) => theme.fontWeight["bold"]};
  color: ${({ theme }) => theme.color["primary"]};
  font-variant-numeric: tabular-nums;
  border-radius: ${({ theme }) => theme.borderRadius["xs"]};
  -moz-appearance: textfield;

  &::-webkit-outer-spin-button,
  &::-webkit-inner-spin-button {
    -webkit-appearance: none;
    margin: 0;
  }
  &:hover {
    background-color: ${({ theme }) => theme.color["gray"][200]};
  }
  &:focus {
    outline: 0;
    background-color: ${({ theme }) => theme.color["gray"][200]};
  }
`;

export const StyledTimeStepper = styled.div`
  display: flex;
  flex-direction: column;
  margin-left: ${({ theme }) => theme.space["px"]};
`;

export const StyledStepButton = styled.button`
  display: flex;
  align-items: center;
  justify-content: center;
  width: ${({ theme }) => theme.space[6]};
  height: ${({ theme }) => theme.space[4]};
  border: none;
  background: transparent;
  border-radius: ${({ theme }) => theme.borderRadius["xs"]};
  color: ${({ theme }) => theme.color["gray"][600]};
  cursor: pointer;
  transition: background-color 0.12s ease, color 0.12s ease;

  &:hover {
    background-color: ${({ theme }) => theme.color["gray"][200]};
    color: ${({ theme }) => theme.color["info"]};
  }
  &:focus-visible {
    outline: 0;
    color: ${({ theme }) => theme.color["info"]};
  }
`;

export const StyledTimeColon = styled.span`
  font-size: ${({ theme }) => theme.fontSize["sm"]};
  font-weight: ${({ theme }) => theme.fontWeight["bold"]};
  color: ${({ theme }) => theme.color["gray"][500]};
  padding: 0 ${({ theme }) => theme.space["px"]};
`;

export const StyledTimeIconButton = styled.button<{ $active?: boolean }>`
  display: flex;
  align-items: center;
  justify-content: center;
  width: ${({ theme }) => theme.space[8]};
  height: ${({ theme }) => theme.space[7]};
  margin-left: ${({ theme }) => theme.space["px"]};
  border: none;
  border-left: ${({ theme }) => theme.borderWidth[1]} solid
    ${({ theme }) => theme.color["gray"][200]};
  background: transparent;
  border-radius: 0 ${({ theme }) => theme.borderRadius["xs"]}
    ${({ theme }) => theme.borderRadius["xs"]} 0;
  color: ${({ theme, $active }) =>
    $active ? theme.color["info"] : theme.color["gray"][600]};
  cursor: pointer;
  transition: background-color 0.12s ease, color 0.12s ease;

  &:hover {
    background-color: ${({ theme }) => theme.color["gray"][200]};
    color: ${({ theme }) => theme.color["info"]};
  }
  &:focus-visible {
    outline: 0;
    color: ${({ theme }) => theme.color["info"]};
  }
`;

export const StyledTimeScroller = styled.div`
  position: absolute;
  bottom: calc(100% + ${({ theme }) => theme.space[1]});
  right: 0;
  z-index: 1;
  display: flex;
  gap: ${({ theme }) => theme.space[1]};
  padding: ${({ theme }) => theme.space[1]};
  background-color: ${({ theme }) => theme.color["white"]};
  border: ${({ theme }) => theme.borderWidth[1]} solid
    ${({ theme }) => theme.color["gray"][300]};
  border-radius: ${({ theme }) => theme.borderRadius["sm"]};
  box-shadow: ${({ theme }) => theme.boxShadow["normal"]};
`;

export const StyledScrollColumn = styled.div`
  position: relative;
  width: 4rem;
  height: 16rem;
  overflow-y: auto;
  scrollbar-width: thin;
  display: flex;
  flex-direction: column;
  gap: ${({ theme }) => theme.space["px"]};

  &::-webkit-scrollbar {
    width: 6px;
  }
  &::-webkit-scrollbar-thumb {
    background-color: ${({ theme }) => theme.color["gray"][400]};
    border-radius: ${({ theme }) => theme.borderRadius["full"]};
  }
`;

export const StyledScrollItem = styled.button<{ $selected?: boolean }>`
  flex: 0 0 auto;
  height: 2.8rem;
  display: flex;
  align-items: center;
  justify-content: center;
  border: none;
  border-radius: ${({ theme }) => theme.borderRadius["xs"]};
  background: ${({ theme, $selected }) =>
    $selected ? theme.color["primary"] : "transparent"};
  color: ${({ theme, $selected }) =>
    $selected ? theme.color["white"] : theme.color["text"]};
  font-size: ${({ theme }) => theme.fontSize["xs"]};
  font-weight: ${({ theme, $selected }) =>
    $selected ? theme.fontWeight["bold"] : theme.fontWeight["normal"]};
  font-variant-numeric: tabular-nums;
  cursor: pointer;
  transition: background-color 0.12s ease, color 0.12s ease;

  &:hover {
    background-color: ${({ theme, $selected }) =>
      $selected ? theme.color["primary"] : theme.color["gray"][200]};
  }
`;

export const StyledFooter = styled.div`
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-top: ${({ theme }) => theme.space[3]};
`;

export const StyledFooterButton = styled.button<{ $variant?: "muted" }>`
  border: none;
  background: transparent;
  font-family: inherit;
  font-size: ${({ theme }) => theme.fontSize["xs"]};
  font-weight: ${({ theme }) => theme.fontWeight["medium"]};
  cursor: pointer;
  padding: ${({ theme }) => theme.space[1]} ${({ theme }) => theme.space[2]};
  border-radius: ${({ theme }) => theme.borderRadius["sm"]};
  color: ${({ theme, $variant }) =>
    $variant === "muted" ? theme.color["gray"][600] : theme.color["info"]};
  transition: background-color 0.12s ease, color 0.12s ease;

  &:hover {
    background-color: ${({ theme }) => theme.color["gray"][200]};
    color: ${({ theme, $variant }) =>
      $variant === "muted" ? theme.color["danger"] : theme.color["primary"]};
  }
  &:focus-visible {
    outline: 0;
    box-shadow: 0 0 0 2px ${({ theme }) => theme.color["info"]};
  }
`;
