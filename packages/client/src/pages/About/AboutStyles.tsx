import styled from "styled-components";
import theme from "Theme/theme";

export const StyledModalContentWrapper = styled.div`
  display: block;
  width: 100%;
  overflow-x: visible;
  overflow-y: visible;
`;

export const StyledModalLogo = styled.div`
  background-color: ${({ theme }) => theme.color.primary};
  padding: ${({ theme }) => theme.space[8]};
`;
export const StyledModalTitle = styled.div`
  font-size: ${({ theme }) => theme.fontSize["3xl"]};
  font-weight: ${({ theme }) => theme.fontWeight["bold"]};
`;
export const StyledModalSubTitle = styled.div`
  font-size: ${({ theme }) => theme.fontSize["xl"]};
  font-weight: ${({ theme }) => theme.fontWeight["italic"]};
  `;
export const StyledModalContent = styled.div``;
export const StyledModalHeader = styled.div`
  font-family: Muni;
  font-size: ${({ theme }) => theme.fontSize["xl"]};
  color: ${({ theme }) => theme.color["primary"]};
  padding-top: ${({ theme }) => theme.space[4]};
`;

export const StyledModalText = styled.div`
  padding-bottom: ${({ theme }) => theme.space[2]};
`;

export const StyledModalTextList = styled.ul`
padding-left: ${({ theme }) => theme.space[10]};
`;

export const StyledModalTextListItem = styled.li`
padding-top: ${({ theme }) => theme.space[2]};
`;

export const StyledModalPerson = styled.div``;
export const StyledModalLink = styled.span`
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

export const StyledModalAcknowledgement = styled.div``;

export const StyledModalAcknowledgementLogo = styled.img`
  margin:${({ theme }) => theme.space[4]};
  padding:${({ theme }) => theme.space[2]};
`;
