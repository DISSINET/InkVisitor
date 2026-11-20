import { IcoCopy } from "Theme/icons";
import React from "react";
import { toast } from "react-toastify";
import {
  StyledErrorToastActions,
  StyledErrorToastCopyButton,
  StyledErrorToastMessage,
} from "./ToastStyles";

interface ErrorToast {
  title: string;
  message?: string;
  // text copied for the project owner; the button shows only when it is given
  details?: string;
}

export const ErrorToast: React.FC<ErrorToast> = ({ title, message, details }) => {
  const handleCopy = async (e: React.MouseEvent<HTMLElement>) => {
    // the toast closes on any click inside it
    e.stopPropagation();
    try {
      await navigator.clipboard.writeText(details ?? "");
      toast.info("Error details copied. Please send them to the project owner.");
    } catch {
      toast.error("Could not copy to clipboard");
    }
  };

  return (
    <div>
      {title}
      {message ? <StyledErrorToastMessage>{message}</StyledErrorToastMessage> : null}
      {details ? (
        <StyledErrorToastActions>
          <StyledErrorToastCopyButton type="button" onClick={handleCopy}>
            <IcoCopy />
            Copy details
          </StyledErrorToastCopyButton>
        </StyledErrorToastActions>
      ) : null}
    </div>
  );
};
