import { styled } from "styled-components";

export const StyledGithubBody = styled.div`
  display: flex;
  flex-direction: column;
  gap: ${({ theme }) => theme.space[4]};
  width: 100%;
  color: ${({ theme }) => theme.color["black"]};
  font-size: ${({ theme }) => theme.fontSize["sm"]};
`;

export const StyledGithubRow = styled.div`
  display: flex;
  align-items: center;
  gap: ${({ theme }) => theme.space[2]};
  min-width: 0;
`;

/** Repository, branch and path of the file; a long path wraps instead of widening the dialog */
export const StyledGithubTarget = styled.div`
  flex: 1 1 auto;
  min-width: 0;
  overflow-wrap: anywhere;
`;

export const StyledGithubLink = styled.a`
  color: ${({ theme }) => theme.color["info"]};
  text-decoration: underline;
  overflow-wrap: anywhere;
`;

/** Label column, then the InkVisitor copy and the GitHub copy side by side */
export const StyledCompareGrid = styled.div`
  display: grid;
  grid-template-columns: max-content minmax(0, 1fr) minmax(0, 1fr);
  column-gap: ${({ theme }) => theme.space[4]};
  row-gap: ${({ theme }) => theme.space[1]};
  align-items: baseline;
`;

export const StyledCompareHead = styled.div`
  font-weight: ${({ theme }) => theme.fontWeight["bold"]};
  padding-bottom: ${({ theme }) => theme.space[1]};
  border-bottom: 1px solid ${({ theme }) => theme.color["gray"][400]};
`;

export const StyledCompareLabel = styled.div`
  color: ${({ theme }) => theme.color["gray"][700]};
  white-space: nowrap;
`;

export const StyledCompareCell = styled.div`
  min-width: 0;
  overflow-wrap: anywhere;
`;

interface StyledGithubNotice {
  $warning: boolean;
}
export const StyledGithubNotice = styled.div<StyledGithubNotice>`
  display: flex;
  align-items: flex-start;
  gap: ${({ theme }) => theme.space[2]};
  padding: ${({ theme }) => theme.space[3]};
  border-radius: ${({ theme }) => theme.borderRadius["default"]};
  border: 1px solid
    ${({ theme, $warning }) => ($warning ? theme.color["warning"] : theme.color["gray"][400])};
  background-color: ${({ theme, $warning }) =>
    $warning ? theme.color["invertedBg"]["warning"] : theme.color["invertedBg"]["plain"]};
  color: ${({ theme }) => theme.color["black"]};
`;

export const StyledGithubNoticeIcon = styled.span`
  flex: 0 0 auto;
  display: inline-flex;
  padding-top: 0.2rem;
  color: ${({ theme }) => theme.color["warning"]};
`;

export const StyledGithubField = styled.label`
  display: flex;
  flex-direction: column;
  gap: ${({ theme }) => theme.space[1]};
`;

export const StyledGithubFieldLabel = styled.span`
  font-weight: ${({ theme }) => theme.fontWeight["bold"]};
`;

export const StyledGithubHint = styled.div`
  color: ${({ theme }) => theme.color["gray"][700]};
  font-size: ${({ theme }) => theme.fontSize["xs"]};
`;

export const StyledGithubError = styled.div`
  color: ${({ theme }) => theme.color["danger"]};
  overflow-wrap: anywhere;
`;

/** The one-time code the user types on github.com */
export const StyledDeviceCode = styled.div`
  font-family: monospace;
  font-size: ${({ theme }) => theme.fontSize["2xl"]};
  font-weight: ${({ theme }) => theme.fontWeight["bold"]};
  letter-spacing: 0.2rem;
  padding: ${({ theme }) => `${theme.space[2]} ${theme.space[4]}`};
  border-radius: ${({ theme }) => theme.borderRadius["default"]};
  border: 1px solid ${({ theme }) => theme.color["gray"][400]};
  background-color: ${({ theme }) => theme.color["invertedBg"]["plain"]};
  color: ${({ theme }) => theme.color["black"]};
  user-select: all;
`;

export const StyledGithubFooterNote = styled.div`
  color: ${({ theme }) => theme.color["gray"][700]};
  font-size: ${({ theme }) => theme.fontSize["xs"]};
`;

export const StyledGithubFooterActions = styled.div`
  display: flex;
  align-items: center;
  margin-left: auto;
`;
