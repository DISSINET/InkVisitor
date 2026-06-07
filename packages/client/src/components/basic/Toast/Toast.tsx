import React from "react";
import { toast } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";
import { StyledToastContainer } from "./ToastStyles";

interface Toast {}
export const Toast: React.FC<Toast> = () => {
  const handleContextMenu = (e: React.MouseEvent<HTMLDivElement>) => {
    const toastEl = (e.target as HTMLElement).closest(".Toastify__toast");
    if (toastEl && toastEl.id) {
      e.preventDefault();
      toast.dismiss(toastEl.id);
    }
  };

  return (
    <div onContextMenu={handleContextMenu}>
      <StyledToastContainer
        hideProgressBar
        closeButton={false}
        position={"top-center"}
        autoClose={4500}
        pauseOnHover
        closeOnClick
      />
    </div>
  );
};
