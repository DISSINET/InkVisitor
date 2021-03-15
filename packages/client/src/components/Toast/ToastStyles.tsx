import styled from "styled-components";
import { ToastContainer } from "react-toastify";

export const StyledToastContainer = styled(ToastContainer)`
  font-size: ${({ theme }) => theme.fontSizes["sm"]};
  .Toastify__toast {
    color: ${({ theme }) => theme.colors["white"]};
    padding: ${({ theme }) => `${theme.space[5]} ${theme.space[6]}`};
    min-height: ${({ theme }) => theme.space[24]};
  }
  .Toastify__toast--default {
    background-color: ${({ theme }) => theme.colors["primary"]};
  }
  .Toastify__toast--dark {
    background-color: ${({ theme }) => theme.colors["black"]};
  }
  .Toastify__toast--info {
    background-color: ${({ theme }) => theme.colors["info"]};
  }
  .Toastify__toast--success {
    background-color: ${({ theme }) => theme.colors["success"]};
  }
  .Toastify__toast--warning {
    background-color: ${({ theme }) => theme.colors["warning"]};
  }
  .Toastify__toast--error {
    background-color: ${({ theme }) => theme.colors["danger"]};
  }
`;
