import styled from "styled-components";

interface ButtonGroup {
  $noMarginRight?: boolean;
  $column?: boolean;
  $marginBottom?: boolean;
  $marginTop?: boolean;
  $height?: number;
}
export const ButtonGroup = styled.div.attrs({
  className: "buttongroup",
})<ButtonGroup>`
  display: flex;
  height: ${({ $height }) => ($height ? `${$height / 10}rem` : "")};
  flex-direction: ${({ $column }) => ($column ? "column" : "row")};
  margin-top: ${({ $marginTop, theme }) => ($marginTop ? theme.space[2] : "")};
  margin-bottom: ${({ $marginBottom, theme }) => ($marginBottom ? theme.space[2] : "")};
  > button:not(:last-child),
  > span:not(:last-child) {
    margin-right: ${({ $noMarginRight }) => ($noMarginRight ? 0 : "0.5rem")};
  }
`;

interface SwitchGroup {
  $column?: boolean;
}
export const SwitchGroup = styled.div<SwitchGroup>`
  display: inline-flex;
  flex-direction: ${({ $column }) => ($column ? "column" : "row")};
  align-items: center;
  gap: 0.15rem;
  padding: 0.25rem;
  background-color: ${({ theme }) => theme.color["gray"][300]};
  border-radius: ${({ theme }) => theme.borderRadius["rounded-md"]};
  overflow: hidden;

  > button {
    margin: 0;
  }
`;

export const ButtonGroups = styled.div`
  display: flex;
  .buttongroup {
    margin-left: ${({ theme }) => theme.space[1]};
  }
`;
