import React from "react";
import { ToastContainer } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";

interface Toast {}
export const Toast: React.FC<Toast> = () => {
  return <ToastContainer hideProgressBar />;
};
