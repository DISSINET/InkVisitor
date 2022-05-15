import { FaStar } from "react-icons/fa";
import styled from "styled-components";

export const StyledHeader = styled.div`
  display: flex;
  flex-direction: column;
  width: 100%;
  padding: ${({ theme }) => theme.space[3]};
  background: ${({ theme }) => theme.color["gray"][200]};
`;
export const StyledHeaderBreadcrumbRow = styled.div`
  display: flex;
  align-items: center;
  flex-wrap: wrap;
`;
export const StyledHeaderRow = styled.h3`
  overflow: hidden;
`;
export const StyledFaStar = styled(FaStar)`
  float: left;
  margin-top: 0.5rem;
  margin-right: 0.3rem;
`;
export const StyledButtons = styled.div`
  float: right;
  margin-top: 0.3rem;
  margin-left: 0.3rem;
`;
export const StyledHeading = styled.span`
  word-wrap: break-word;
`;
export const StyledSuggesterRow = styled.div`
  display: flex;
  justify-content: flex-end;
  align-items: center;
  color: ${({ theme }) => theme.color["info"]};
  font-size: ${({ theme }) => theme.fontSize["sm"]};
`;
