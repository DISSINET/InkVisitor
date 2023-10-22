import { space5, space7 } from "Theme/constants";
import styled from "styled-components";

export const StyledContentWrapper = styled.div`
  display: flex;
  align-items: center;
  flex-direction: column;
  overflow: auto;
  width: 100%;
`;
export const StyledContent = styled.div`
  display: flex;
  flex-direction: column;
  height: 100%;
  padding: ${space5} ${space7};
  font-size: ${({ theme }) => theme.fontSize["sm"]};
`;

export const StyledLogo = styled.div`
  background-color: ${({ theme }) => theme.color.primary};
  padding: ${({ theme }) => theme.space[8]};
`;
export const StyledTitle = styled.div`
  font-size: ${({ theme }) => theme.fontSize["3xl"]};
  font-weight: ${({ theme }) => theme.fontWeight["bold"]};
`;
export const StyledSubTitle = styled.div`
  font-size: ${({ theme }) => theme.fontSize["xl"]};
  font-weight: ${({ theme }) => theme.fontWeight["italic"]};
`;
export const StyledHeader = styled.div`
  font-family: Muni;
  font-size: ${({ theme }) => theme.fontSize["xl"]};
  color: ${({ theme }) => theme.color["primary"]};
  padding-top: ${({ theme }) => theme.space[4]};
`;

export const StyledText = styled.div`
  padding-bottom: ${({ theme }) => theme.space[2]};
`;

export const StyledTextList = styled.ul`
  padding-left: ${({ theme }) => theme.space[10]};
`;

export const StyledTextListItem = styled.li`
  padding-top: ${({ theme }) => theme.space[2]};
`;

export const StyledPerson = styled.div``;
export const StyledLink = styled.span`
  display: inline;
  margin-left: ${({ theme }) => theme.space[1]};
  margin-right: ${({ theme }) => theme.space[0]};
  a {
    color: ${({ theme }) => theme.color["success"]};
    font-weight: ${({ theme }) => theme.fontWeight["bold"]};
    text-decoration: none;
    svg {
      margin-right: ${({ theme }) => theme.space[1]};
    }
  }
`;

export const StyledAcknowledgement = styled.div``;

export const StyledAcknowledgementLogo = styled.img`
  margin: ${({ theme }) => theme.space[4]};
  padding: ${({ theme }) => theme.space[2]};
`;
