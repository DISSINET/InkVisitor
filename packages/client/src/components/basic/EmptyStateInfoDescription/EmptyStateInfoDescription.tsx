import React from "react";
import { BsInfoCircle } from "react-icons/bs";
import {
  StyledEmptyState,
  StyledEmptyStateItem,
} from "./EmptyStateInfoDescriptionStyles";

// info icon with text description
// mostly for empty box component but can be used elsewhere
// requires to be placed inside a wrapper to be positioned
interface EmptyStateInfoDescription {
  label: string;
}
export const EmptyStateInfoDescription: React.FC<EmptyStateInfoDescription> = ({
  label,
}) => {
  return (
    <StyledEmptyState>
      <StyledEmptyStateItem>
        <BsInfoCircle size="23" />
      </StyledEmptyStateItem>
      <StyledEmptyStateItem>{label}</StyledEmptyStateItem>
    </StyledEmptyState>
  );
};
