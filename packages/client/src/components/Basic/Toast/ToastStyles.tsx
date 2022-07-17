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
`;
