import React, { MouseEventHandler } from "react";

import { Colors } from "types";
import { Button as RebassButton } from "rebass/styled-components";
import styled from "styled-components";
import { space1, space2 } from "Theme/constants";

interface StyledButton {
  hasIcon?: boolean;
  hasMarginRight?: boolean;
}
const StyledButton = styled(RebassButton).attrs({
  sx: { fontSize: "xs" },
})<StyledButton>`
  display: flex;
  align-items: center;
  font-weight: 700;
  padding: ${space1} ${({ hasIcon }) => (hasIcon ? space1 : space2)};
  border: 2px solid;
  margin-right: ${({ hasMarginRight }) => (hasMarginRight ? space1 : "0")};

  :focus {
    outline: 0;
  }
`;

interface ButtonProps {
  label?: string;
  icon?: JSX.Element;
  inverted?: Boolean;
  color?: typeof Colors[number];
  onClick?: MouseEventHandler<HTMLElement>;
  marginRight?: boolean;
}

export const Button: React.FC<ButtonProps> = ({
  label,
  icon,
  inverted,
  color,
  onClick,
  marginRight,
}) => {
  return (
    <StyledButton
      onClick={onClick}
      variant={`${inverted ? color + "Inverted" : color}`}
      hasIcon={icon && true}
      hasMarginRight={marginRight}
    >
      {icon}
      {label}
    </StyledButton>
  );
};

Button.defaultProps = {
  onClick: () => {
    // do nothing
  },
  color: "primary",
  inverted: false,
  label: "",
};
