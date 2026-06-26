import styled from "styled-components";

export const StyledContentWrapper = styled.div`
  display: flex;
  flex-direction: column;
  align-items: stretch;
  overflow: auto;
  width: 100%;
  background-color: ${({ theme }) => theme.color["gray"][150]};
`;

export const StyledContent = styled.div`
  display: flex;
  flex-direction: column;
  width: 75%;
  max-width: 96rem;
  margin: ${({ theme }) => `${theme.space[8]} auto`};
  background-color: ${({ theme }) => theme.color["white"]};
  border-radius: ${({ theme }) => theme.borderRadius["lg"]};
  box-shadow: ${({ theme }) => theme.boxShadow["subtle"]};
  font-size: ${({ theme }) => theme.fontSize["sm"]};

  @media (max-width: 700px) {
    padding: ${({ theme }) => `${theme.space[6]} ${theme.space[5]}`};
    margin: ${({ theme }) => `${theme.space[4]} ${theme.space[3]}`};
  }
`;

export const StyledLogo = styled.div`
  display: flex;
  justify-content: center;
  background-color: ${({ theme }) => theme.color.muni};
  padding: ${({ theme }) => `${theme.space[9]} ${theme.space[8]}`};
  border-radius: ${({ theme }) => theme.borderRadius["md"]};
  border-bottom-left-radius: 0;
  border-bottom-right-radius: 0;
  overflow: hidden;
  margin-bottom: ${({ theme }) => theme.space[4]};

  img {
    max-width: 48rem;
  }
`;
export const StyledContentSection = styled.div`
  display: flex;
  flex-direction: column;
  padding: ${({ theme }) => `${theme.space[9]} ${theme.space[8]}`};
`;
export const StyledTitle = styled.div`
  font-size: ${({ theme }) => theme.fontSize["3xl"]};
  font-weight: ${({ theme }) => theme.fontWeight["bold"]};
`;
export const StyledSubTitle = styled.div`
  font-size: ${({ theme }) => theme.fontSize["xl"]};
  font-weight: ${({ theme }) => theme.fontWeight["normal"]};
`;
export const StyledHeader = styled.div`
  font-family: Muni;
  font-size: ${({ theme }) => theme.fontSize["xl"]};
  color: ${({ theme }) => theme.color["primary"]};
  padding: ${({ theme }) => `0 0 ${theme.space[2]} ${theme.space[3]}`};
  margin-top: ${({ theme }) => theme.space[8]};
  border-left: ${({ theme }) => `3px solid ${theme.color["success"]}`};
  border-bottom: ${({ theme }) => `1px solid ${theme.color["gray"][300]}`};
  line-height: 1.2;
`;

export const StyledTextList = styled.ul`
  list-style: none;
  margin: 0;
  padding: 0;
  color: ${({ theme }) => theme.color["text"]};
  padding-bottom: ${({ theme }) => theme.space[2]};
`;

export const StyledTextListItem = styled.li`
  position: relative;
  padding-left: ${({ theme }) => theme.space[5]};
  padding-top: ${({ theme }) => theme.space[3]};
  line-height: 1.6;

  &::before {
    content: "";
    position: absolute;
    left: 0;
    top: 1.65rem;
    width: ${({ theme }) => theme.space[2]};
    height: ${({ theme }) => theme.borderWidth[2]};
    background-color: ${({ theme }) => theme.color["success"]};
    border-radius: ${({ theme }) => theme.borderRadius["full"]};
  }
`;

export const StyledPerson = styled.div``;
export const StyledLink = styled.span`
  display: inline;
  margin-left: ${({ theme }) => theme.space[1]};
  a {
    display: inline-flex;
    align-items: center;
    white-space: nowrap;
    color: ${({ theme }) => theme.color["success"]};
    font-weight: ${({ theme }) => theme.fontWeight["bold"]};
    text-decoration: none;
    svg {
      margin-right: ${({ theme }) => theme.space[1]};
      flex-shrink: 0;
    }
    &:hover {
      text-decoration: underline;
    }
  }
`;

export const StyledAcknowledgement = styled.div`
  display: flex;
  flex-wrap: wrap;
  align-items: center;
  justify-content: center;
  gap: ${({ theme }) => theme.space[6]};
  margin-top: ${({ theme }) => theme.space[10]};
  padding-top: ${({ theme }) => theme.space[8]};
  border-top: ${({ theme }) => `1px solid ${theme.color["gray"][300]}`};
`;

export const StyledAcknowledgementLogo = styled.img`
  height: 5rem;
  width: auto;
  filter: grayscale(1);
  opacity: 0.65;
  transition:
    filter 0.2s ease,
    opacity 0.2s ease;

  &:hover {
    filter: grayscale(0);
    opacity: 1;
  }
`;
