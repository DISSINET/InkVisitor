import styled from "styled-components";

export const StyledDocumentTag = styled.div<{ $size: "sm" | "md" | "lg" }>`
  display: inline-flex;
  margin: 0 0.6rem;
  background-color: ${({ theme }) => theme.color["blue"][400]};
  padding: ${({ theme, $size }) =>
    $size === "sm"
      ? theme.space[1] + " " + theme.space[2]
      : $size === "md"
      ? theme.space[1] + " " + theme.space[3]
      : theme.space[1] + " " + theme.space[4]};
  border-radius: ${({ theme }) => theme.borderRadius["md"]};
  color: white;
  font-size: ${({ theme, $size }) =>
    $size === "sm"
      ? theme.fontSize["2xs"]
      : $size === "md"
      ? theme.fontSize["xs"]
      : theme.fontSize["sm"]};
  align-items: center;
`;

export const StyledDocumentTitle = styled.p`
  display: inline-block;
  vertical-align: middle;
  white-space: nowrap;
  overflow: hidden !important;
  text-overflow: ellipsis;
`;
