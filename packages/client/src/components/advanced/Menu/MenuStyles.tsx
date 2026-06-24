import { animated } from "@react-spring/web";
import styled from "styled-components";

export const StyledMenuGroupWrapper = styled.div`
  position: absolute;
  top: 100%;
  right: 0;
  padding-top: ${({ theme }) => theme.space[4]};

  z-index: 10001;
  min-width: 20rem;
`;

export const StyledMenuGroup = styled.div`
  display: flex;
  flex-direction: column;
  gap: 0.2rem;
  background-color: ${({ theme }) => theme.color["white"]};
  border: 1px solid ${({ theme }) => theme.color.gray[400]};
  box-shadow: 0 4px 12px ${({ theme }) => theme.color.menuShadow};
  border-radius: 1rem;
  overflow: hidden;
  padding: 0.6rem;
`;

interface StyledMenuItem {}
export const StyledMenuItem = styled(animated.div)<StyledMenuItem>`
  height: 3.3rem;
  cursor: pointer;
  display: flex;
  align-items: center;
  font-size: ${({ theme }) => theme.fontSize["xs"]};
  border-radius: 0.5rem;
  svg {
    vertical-align: middle;
  }
`;

export const StyledIcon = styled.div`
  width: 3.5rem;
  margin-left: 0.1rem;
  display: flex;
  justify-content: center;
  align-items: center;
`;

export const StyledMenuDivider = styled.div`
  height: 1px;
  background-color: ${({ theme }) => theme.color.gray[300]};
  margin: 0.3rem 0;
`;
