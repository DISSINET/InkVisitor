import styled from "styled-components";

export const StyledDocumentTag = styled.div<{
  $size: "sm" | "md" | "lg";
  $width?: string;
}>`
  display: flex;
  flex-shrink: 1;
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
  min-width: 0;
  max-width: ${({ $width }) => $width || "100%"};
  overflow: hidden !important;
`;

export const StyledDocumentTitle = styled.div`
  display: block;
  overflow: hidden !important;
  white-space: nowrap;
  text-overflow: ellipsis;
  min-width: 0;

  flex-shrink: 1;
`;
