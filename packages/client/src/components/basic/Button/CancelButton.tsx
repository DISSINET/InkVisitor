import React from "react";
import { Button } from "./Button";

interface CancelButton {
  label?: string;
  onClick: (e: React.MouseEvent<HTMLElement>) => void;
}

// the one place the "back out without committing" look is defined: a ghost
// button, so the committing action is the only one carrying weight in a footer
export const CancelButton: React.FC<CancelButton> = ({ label = "Cancel", onClick }) => {
  return <Button label={label} color="greyer" inverted noBackground noBorder onClick={onClick} />;
};
