import React from "react";
import { toast } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";
import { StyledToastContainer } from "./ToastStyles";

// stays up for as long as the browser is offline: no click, drag or right-click dismisses it
export const OFFLINE_TOAST_ID = "offline";

interface Toast {}
export const Toast: React.FC<Toast> = () => {
  const handleContextMenu = (e: React.MouseEvent<HTMLDivElement>) => {
    const toastEl = (e.target as HTMLElement).closest(".Toastify__toast");
    if (toastEl && toastEl.id && toastEl.id !== OFFLINE_TOAST_ID) {
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
