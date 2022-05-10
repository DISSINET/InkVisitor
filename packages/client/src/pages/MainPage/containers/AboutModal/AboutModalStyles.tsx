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
  font-weight: ${({ theme }) => theme.fontWeight["medium"]};
`;
export const StyledModalText = styled.div``;
export const StyledModalTextHeader = styled.div`
  font-size: ${({ theme }) => theme.fontSize["xl"]};
  font-weight: ${({ theme }) => theme.fontWeight["medium"]};
`;
export const StyledModalTextSection = styled.p`
  padding-bottom: ${({ theme }) => theme.space[2]};
`;
export const StyledModalTextPerson = styled.div``;
export const StyledModalTextLink = styled.span`
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
export const StyledModalAcknowledgementHeader = styled.div`
  font-size: ${({ theme }) => theme.fontSize["xl"]};
  font-weight: ${({ theme }) => theme.fontWeight["medium"]};
`;
export const StyledModalAcknowledgementText = styled.div``;
export const StyledModalAcknowledgementLogo = styled.img``;
