import React from "react";
import { Button } from "./Button";

interface CancelButton {
  label?: string;
  onClick: (e: React.MouseEvent<HTMLElement>) => void;
}

/**
 * The back-out action in a modal footer: a ghost button, so the committing
 * action is the only one carrying weight. Label defaults to "Cancel".
 */
export const CancelButton: React.FC<CancelButton> = ({ label = "Cancel", onClick }) => {
  return (
    <Button
      label={label}
      color="greyer"
      inverted
      noBackground
      noBorder
      textRegular
      onClick={onClick}
    />
  );
};
