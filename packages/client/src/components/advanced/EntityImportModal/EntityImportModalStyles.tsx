import styled from "styled-components";

// fills the full-height modal, so the JSON field gets all the room left
export const StyledStep = styled.div`
  display: flex;
  flex: 1;
  flex-direction: column;
  gap: ${({ theme }) => theme.space[3]};
  width: 100%;
  min-height: 0;
`;

export const StyledHint = styled.p`
  font-size: ${({ theme }) => theme.fontSize["xs"]};
  color: ${({ theme }) => theme.color["mutedText"]};
`;

// The field takes all the height the modal leaves (keeping a usable minimum
// when a long error list sits below it) and scrolls from there. The editor
// lays a highlighted <pre> under a transparent textarea; both take their font
// from this wrapper, so they stay aligned.
export const StyledJsonEditor = styled.div`
  flex: 1;
  width: 100%;
  min-height: ${({ theme }) => theme.space[48]};
  overflow: auto;
  font-family: monospace;
  font-size: ${({ theme }) => theme.fontSize["xs"]};
  line-height: 1.4;
  color: ${({ theme }) => theme.color["primary"]};
  background-color: ${({ theme }) => theme.color["white"]};
  border: ${({ theme }) => theme.borderWidth[1]} solid ${({ theme }) => theme.color["gray"]["400"]};
  border-radius: ${({ theme }) => theme.borderRadius.input};

  &:hover {
    border-color: ${({ theme }) => theme.color["info"]};
  }
  &:focus-within {
    border-color: ${({ theme }) => theme.color["info"]};
    box-shadow: inset 0 0 0 0.1rem ${({ theme }) => theme.color["info"]};
  }

  /* the editor's own box; its textarea covers it whole, so a click anywhere
     in the empty field lands in the textarea */
  & > div {
    min-height: 100%;
  }
  textarea {
    outline: 0;
  }
  textarea::placeholder {
    color: ${({ theme }) => theme.color["gray"][500]};
  }

  /* the Annotator XML view palette: keys and values sit in hue families far
     apart, so they are told apart at a glance */
  .token.property {
    color: ${({ theme }) => theme.color["xmlAttr"]};
  }
  .token.string {
    color: ${({ theme }) => theme.color["xmlValue"]};
  }
  .token.number,
  .token.boolean,
  .token.null {
    color: ${({ theme }) => theme.color["xmlTag"]};
  }
  .token.punctuation,
  .token.operator {
    color: ${({ theme }) => theme.color["xmlQuote"]};
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
