import React from "react";
import "react-toastify/dist/ReactToastify.css";
import { StyledToastContainer } from "./ToastStyles";

interface Toast {}
export const Toast: React.FC<Toast> = () => {
  return (
    <StyledToastContainer
      hideProgressBar
      closeButton={false}
      position={"top-center"}
      autoClose={2500}
    />
  );
};
