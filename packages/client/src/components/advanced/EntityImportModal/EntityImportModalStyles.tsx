import styled from "styled-components";

export const StyledStep = styled.div`
  display: flex;
  flex-direction: column;
  gap: ${({ theme }) => theme.space[3]};
  width: 100%;
`;

export const StyledHint = styled.p`
  font-size: ${({ theme }) => theme.fontSize["xs"]};
  color: ${({ theme }) => theme.color["mutedText"]};
`;

// JSON reads best with aligned columns. The field grows with its content up to
// the height the modal leaves for it (the viewport minus the modal's margins,
// header, hint and footer) and scrolls from there.
export const StyledJsonInput = styled.div`
  width: 100%;
  textarea {
    font-family: monospace;
    max-height: calc(100vh - 26rem);
  }
`;

export const StyledHiddenFileInput = styled.input`
  display: none;
`;

export const StyledProgress = styled.p`
  font-size: ${({ theme }) => theme.fontSize["sm"]};
  color: ${({ theme }) => theme.color["black"]};
`;

export const StyledResult = styled.div`
  display: flex;
  flex-direction: column;
  gap: ${({ theme }) => theme.space[2]};
  font-size: ${({ theme }) => theme.fontSize["sm"]};
  color: ${({ theme }) => theme.color["black"]};
`;

export const StyledResultFailure = styled.p`
  color: ${({ theme }) => theme.color["danger"]};
`;

export const StyledIssueSection = styled.div`
  display: flex;
  flex-direction: column;
  gap: ${({ theme }) => theme.space[1]};
`;

export const StyledIssueTitle = styled.p<{ $error: boolean }>`
  font-size: ${({ theme }) => theme.fontSize["sm"]};
  font-weight: ${({ theme }) => theme.fontWeight.bold};
  color: ${({ theme, $error }) => ($error ? theme.color["danger"] : theme.color["black"])};
`;

export const StyledIssueList = styled.ul`
  display: flex;
  flex-direction: column;
  gap: ${({ theme }) => theme.space[1]};
  padding-left: ${({ theme }) => theme.space[4]};
  list-style: disc;
`;

// loop errors span several lines, one per edge
export const StyledIssue = styled.li<{ $error: boolean }>`
  font-size: ${({ theme }) => theme.fontSize["xs"]};
  color: ${({ theme, $error }) => ($error ? theme.color["danger"] : theme.color["greyer"])};
  white-space: pre-wrap;
  word-break: break-word;
`;
