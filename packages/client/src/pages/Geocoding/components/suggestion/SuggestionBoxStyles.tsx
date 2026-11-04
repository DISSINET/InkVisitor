import styled from "styled-components";

export const StyledSuggestionBox = styled.div<{ $pressable?: boolean }>`
  display: flex;
  align-items: center;
  gap: ${({ theme }) => theme.space[2]};
  width: 100%;
  text-align: left;
  padding: ${({ theme }) => theme.space[1]} ${({ theme }) => theme.space[2]};
  border: 1px solid ${({ theme }) => theme.color["gray"][400]};
  border-radius: ${({ theme }) => theme.borderRadius["sm"]};
  background-color: ${({ theme }) => theme.color["white"]};
  cursor: ${({ $pressable }) => ($pressable ? "pointer" : "default")};

  &:hover {
    background-color: ${({ theme, $pressable }) =>
      $pressable ? theme.color["gray"][100] : theme.color["white"]};
  }

  &:focus-visible {
    outline: 2px solid ${({ theme }) => theme.color["success"]};
    outline-offset: -2px;
  }
`;

export const StyledBoxMain = styled.span`
  display: flex;
  flex-direction: column;
  min-width: 0;
  flex: 1 1 auto;
`;

export const StyledBoxName = styled.span`
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
  font-size: ${({ theme }) => theme.fontSize.xs};
  font-weight: ${({ theme }) => theme.fontWeight["bold"]};
  color: ${({ theme }) => theme.color["black"]};
`;

/** Where it is, in the sources' own words — what tells four places of one name apart. */
export const StyledBoxRegion = styled.span`
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
  font-size: ${({ theme }) => theme.fontSize.xxs};
  color: ${({ theme }) => theme.color["greyer"]};
`;

export const StyledBoxAt = styled.span`
  font-family: monospace;
  font-size: ${({ theme }) => theme.fontSize.xxs};
  color: ${({ theme }) => theme.color["greyer"]};
`;

export const StyledBoxScore = styled.span`
  display: flex;
  flex-direction: column;
  align-items: flex-end;
  flex-shrink: 0;
  font-family: monospace;
  font-size: ${({ theme }) => theme.fontSize.xxs};
  color: ${({ theme }) => theme.color["greyer"]};
`;
