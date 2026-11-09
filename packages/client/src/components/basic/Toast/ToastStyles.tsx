import styled from "styled-components";
import { ToastContainer } from "react-toastify";

export const StyledToastContainer = styled(ToastContainer)`
  font-size: ${({ theme }) => theme.fontSize["sm"]};
  .Toastify__toast {
    color: ${({ theme }) => theme.color["white"]};
    padding: ${({ theme }) => `${theme.space[5]} ${theme.space[6]}`};
    min-height: ${({ theme }) => theme.space[24]};
  }
  .Toastify__toast--default {
    background-color: ${({ theme }) => theme.color["primary"]};
  }
  .Toastify__toast--dark {
    background-color: ${({ theme }) => theme.color["black"]};
  }
  .Toastify__toast--info {
    background-color: ${({ theme }) => theme.color["info"]};
  }
  .Toastify__toast--success {
    background-color: ${({ theme }) => theme.color["success"]};
  }
  .Toastify__toast--warning {
    background-color: ${({ theme }) => theme.color["warning"]};
  }
  .Toastify__toast--error {
    background-color: ${({ theme }) => theme.color["danger"]};
  }
  .Toastify__toast-icon svg {
    fill: ${({ theme }) => theme.color.white};
  }
`;

export const StyledLink = styled.a`
  color: ${({ theme }) => theme.color["blue"][50]};
  margin-left: 0.5rem;

  display: flex;
  flex-grow: 1;
  justify-content: flex-end;
  align-items: center;
  white-space: nowrap;
`;
export const StyledWrap = styled.div`
  display: flex;
`;

export const StyledErrorToastMessage = styled.p`
  font-size: ${({ theme }) => theme.fontSize["xxs"]};
`;
export const StyledErrorToastActions = styled.div`
  display: flex;
  justify-content: flex-end;
  margin-top: ${({ theme }) => theme.space[2]};
`;
// plain button: the app's Button imports the components index, which imports
// the api module that renders this toast
export const StyledErrorToastCopyButton = styled.button`
  display: inline-flex;
  align-items: center;
  gap: ${({ theme }) => theme.space[1]};
  padding: ${({ theme }) => `${theme.space[1]} ${theme.space[2]}`};
  font-size: ${({ theme }) => theme.fontSize["xs"]};
  font-weight: ${({ theme }) => theme.fontWeight["bold"]};
  color: ${({ theme }) => theme.color["white"]};
  background: transparent;
  border: ${({ theme }) => `${theme.borderWidth[1]} solid ${theme.color["white"]}`};
  border-radius: ${({ theme }) => theme.borderRadius["xs"]};
  cursor: pointer;
`;
