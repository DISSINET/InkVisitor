import styled from "styled-components";

interface StyledBorderLeftProps {
  $active: boolean;
}
export const StyledBorderLeft = styled.div<StyledBorderLeftProps>`
  border-left: ${({ theme, $active }) => {
    if ($active) {
      return `${theme.borderWidth[4]} solid`;
    } else if (!$active) {
      return `${theme.borderWidth[2]} solid`;
    }
  }};
  border-left-color: ${({ theme, $active }) => {
    if ($active) {
      return theme.color.primary;
    } else if (!$active) {
      return theme.color.greyer;
    }
  }};
  padding-left: 1rem;
  padding-right: 2rem;
`;
export const StyledNotActiveTag = styled.div`
  color: ${({ theme }) => theme.color["white"]};
  font-size: ${({ theme }) => theme.fontSize["xs"]};
  font-weight: ${({ theme }) => theme.fontWeight["light"]};
  background-color: ${({ theme }) => theme.color["greyer"]};
  padding: ${({ theme }) => `${theme.space[1]} ${theme.space[2]}`};
  margin-bottom: ${({ theme }) => theme.space[2]};
  border-radius: ${({ theme }) => theme.borderRadius["sm"]};
  width: fit-content;
`;
export const StyledGrid = styled.div`
  display: grid;
  grid-template-columns: auto 1fr;
  grid-gap: 1rem;
`;
interface StyledSentenceProps {
  $active: boolean;
}
export const StyledSentence = styled.p<StyledSentenceProps>`
  margin-top: 0.1rem;
  font-size: ${({ theme }) => theme.fontSize["xs"]};
  color: ${({ theme, $active }) => ($active ? theme.color.primary : theme.color.greyer)};
  &::before {
    content: '"';
  }
  &::after {
    content: '"';
  }
`;
export const StyledSentenceEntity = styled.span`
  font-weight: bold;
`;

export const StyledLabel = styled.div`
  display: flex;
  justify-content: right;
  text-align: right;
  align-items: start;
  margin-top: 0.2rem;
  white-space: pre-wrap;
  color: ${({ theme }) => theme.color["info"]};
  font-size: ${({ theme }) => theme.fontSize["xs"]};
`;
export const StyledValue = styled.div`
  display: flex;
  flex-wrap: wrap;
  gap: ${({ theme }) => theme.space[4]};
`;

export const StyledLanguageList = styled.div`
  display: flex;
  flex-wrap: wrap;
  gap: ${({ theme }) => theme.space[2]};
  margin-bottom: ${({ theme }) => theme.space[2]};
`;
