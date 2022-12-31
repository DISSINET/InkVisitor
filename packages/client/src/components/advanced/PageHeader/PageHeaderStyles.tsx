import { FaUserAlt } from "react-icons/fa";
import styled from "styled-components";
import { heightHeader } from "Theme/constants";

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

export const StyledMenuGroup = styled.div`
  position: absolute;
  right: ${({ theme }) => theme.space[1]};
  margin-top: ${({ theme }) => theme.space[1]};
  top: ${({ theme }) => heightHeader};

  min-width: 200px;
  z-index: 10;

  border: ${({ theme }) => "3px solid " + theme.color["primary"]};

  box-shadow: ${({ theme }) => "-5px 5px 5px " + theme.color["black"]};
  border-radius: ${({ theme }) => theme.space[2]};
`;

interface StyledMenuItem {
  color: string;
}
export const StyledMenuItem = styled.div<StyledMenuItem>`
  padding: ${({ theme }) => theme.space[3]};
  color: ${({ theme, color }) => theme.color[color]};
  background-color: ${({ theme }) => theme.color["white"]};
  :hover {
    background-color: ${({ color, theme }) => theme.color[color]};
    color: ${({ theme }) => theme.color["white"]};
  }
  svg {
    margin-right: ${({ theme }) => theme.space[2]};
    vertical-align: middle;
  }
`;
