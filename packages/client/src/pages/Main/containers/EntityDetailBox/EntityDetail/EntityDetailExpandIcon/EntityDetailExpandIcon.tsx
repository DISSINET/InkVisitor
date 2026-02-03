import React from "react";
import { FaChevronCircleRight } from "react-icons/fa";
import { StyledExpandIcon } from "../EntityDetailStyles";

interface EntityDetailExpandIconProps {
  isExpanded: boolean;
}

export const EntityDetailExpandIcon: React.FC<EntityDetailExpandIconProps> = ({
  isExpanded,
}) => {
  return (
    <StyledExpandIcon>
      <FaChevronCircleRight
        size={16}
        style={{
          transition: "transform 0.2s ease",
          cursor: "pointer",
          transform: `rotate(${isExpanded ? "90deg" : "0deg"})`,
        }}
      />
    </StyledExpandIcon>
  );
};
