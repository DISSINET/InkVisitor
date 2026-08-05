import styled from "styled-components";

export const StyledPage = styled.div`
  display: flex;
  align-items: center;
  justify-content: center;
  min-height: 100vh;
  padding: ${({ theme }) => theme.space[8]};
  background-color: ${({ theme }) => theme.color["pageBg"]};
`;

export const StyledCard = styled.div`
  width: 100%;
  max-width: 60rem;
  padding: ${({ theme }) => theme.space[8]};
  border: ${({ theme }) => theme.borderWidth[1]} solid ${({ theme }) => theme.color["modalBorder"]};
  border-radius: ${({ theme }) => theme.borderRadius["default"]};
  background-color: ${({ theme }) => theme.color["white"]};
  box-shadow: ${({ theme }) => theme.boxShadow["normal"]};
`;

export const StyledHeading = styled.div`
  color: ${({ theme }) => theme.color["danger"]};
  font-size: ${({ theme }) => theme.fontSize["xl"]};
  font-weight: ${({ theme }) => theme.fontWeight["medium"]};
`;

export const StyledLead = styled.p`
  margin-top: ${({ theme }) => theme.space[4]};
  color: ${({ theme }) => theme.color["black"]};
  font-size: ${({ theme }) => theme.fontSize["base"]};
  line-height: 1.5;
`;

export const StyledDiagnostics = styled.p`
  margin-top: ${({ theme }) => theme.space[3]};
  color: ${({ theme }) => theme.color["greyer"]};
  font-family: monospace;
  font-size: ${({ theme }) => theme.fontSize["xs"]};
  overflow-wrap: anywhere;
`;

export const StyledQuip = styled.p`
  margin-top: ${({ theme }) => theme.space[2]};
  color: ${({ theme }) => theme.color["greyer"]};
  font-size: ${({ theme }) => theme.fontSize["sm"]};
  font-style: italic;
  line-height: 1.5;
`;

export const StyledActions = styled.div`
  display: flex;
  flex-wrap: wrap;
  gap: ${({ theme }) => theme.space[3]};
  margin-top: ${({ theme }) => theme.space[6]};
`;

interface StyledButton {
  $primary?: boolean;
  $pushRight?: boolean;
}
export const StyledButton = styled.button<StyledButton>`
  display: inline-flex;
  margin-left: ${({ $pushRight }) => ($pushRight ? "auto" : "0")};
  align-items: center;
  gap: ${({ theme }) => theme.space[2]};
  padding: ${({ theme }) => `${theme.space[2]} ${theme.space[4]}`};
  border: ${({ theme }) => theme.borderWidth[1]} solid
    ${({ theme, $primary }) => ($primary ? theme.color["primary"] : theme.color["gray"][400])};
  border-radius: ${({ theme }) => theme.borderRadius["rounded-sm"]};
  background-color: ${({ theme, $primary }) =>
    $primary ? theme.color["primary"] : theme.color["transparent"]};
  color: ${({ theme, $primary }) => ($primary ? theme.color["white"] : theme.color["black"])};
  font-size: ${({ theme }) => theme.fontSize["sm"]};
  cursor: pointer;

  &:hover {
    opacity: 0.85;
  }
`;

export const StyledDetails = styled.details`
  margin-top: ${({ theme }) => theme.space[6]};
  border-top: ${({ theme }) => theme.borderWidth[1]} solid
    ${({ theme }) => theme.color["modalBorder"]};
  padding-top: ${({ theme }) => theme.space[4]};
`;

export const StyledSummary = styled.summary`
  color: ${({ theme }) => theme.color["greyer"]};
  font-size: ${({ theme }) => theme.fontSize["sm"]};
  cursor: pointer;

  &:hover {
    color: ${({ theme }) => theme.color["black"]};
  }
`;

export const StyledErrorMessage = styled.p`
  margin-top: ${({ theme }) => theme.space[3]};
  color: ${({ theme }) => theme.color["danger"]};
  font-family: monospace;
  font-size: ${({ theme }) => theme.fontSize["sm"]};
  overflow-wrap: anywhere;
`;

export const StyledStack = styled.pre`
  max-height: 30rem;
  margin-top: ${({ theme }) => theme.space[3]};
  padding: ${({ theme }) => theme.space[3]};
  border-radius: ${({ theme }) => theme.borderRadius["sm"]};
  background-color: ${({ theme }) => theme.color["gray"][200]};
  color: ${({ theme }) => theme.color["gray"][700]};
  font-family: monospace;
  font-size: ${({ theme }) => theme.fontSize["xs"]};
  line-height: 1.5;
  white-space: pre-wrap;
  overflow: auto;
`;
