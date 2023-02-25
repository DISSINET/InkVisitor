import { FaUserAlt } from "react-icons/fa";
import styled from "styled-components";

interface StyledHeaderLogo {
  height: number;
}
export const StyledHeaderLogo = styled.img<StyledHeaderLogo>`
  height: ${({ height }) => (height ? `${height / 10}rem` : "auto")};
  padding: ${({ theme }) => theme.space[4]};
  cursor: pointer;
`;

export const StyledHeader = styled.div`
  display: flex;
`;

export const StyledHeaderTag = styled.div`
  cursor: copy;
  font-size: 12px;
  margin-top: 28px;
  opacity: 0.8;
  padding: ${({ theme }) => theme.space[2]};
`;

export const StyledFaUserAlt = styled(FaUserAlt)`
  cursor: pointer;
  margin-left: ${({ theme }) => theme.space[2]};
  margin-right: ${({ theme }) => theme.space[1]};
`;
export const StyledText = styled.div`
  font-size: ${({ theme }) => theme.fontSize["sm"]};
`;
export const StyledUsername = styled.div`
  cursor: pointer;
  font-weight: ${({ theme }) => theme.fontWeight["bold"]};
`;
export const StyledRightHeader = styled.div`
  display: flex;
`;
export const StyledUser = styled.div`
  display: flex;
  align-items: center;
  margin-right: ${({ theme }) => theme.space[4]};
`;
export const StyledLoaderWrap = styled.div`
  height: 1rem;
  width: 1rem;
  position: relative;
  margin-right: 2rem;
`;
