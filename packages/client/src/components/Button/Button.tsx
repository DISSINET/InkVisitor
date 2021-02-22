import React, { MouseEventHandler } from "react";

import { Colors } from "types";
import styled from "styled-components";
import { space1, space2 } from "Theme/constants";

interface StyledButton {
  hasIcon?: boolean;
  hasMarginRight?: boolean;
  inverted?: boolean;
  color: string;
}
const StyledButton = styled.button<StyledButton>`
  display: flex;
  align-items: center;
  font-size: ${({ theme }) => theme.fontSizes["xs"]};
  font-weight: 700;
  padding: ${space1} ${({ hasIcon }) => (hasIcon ? space1 : space2)};
  border: 2px solid ${({ theme, color }) => theme.colors[color]};
  margin-right: ${({ hasMarginRight }) => (hasMarginRight ? space1 : "0")};
  color: ${({ theme, color, inverted }) =>
    inverted ? theme.colors[color] : "white"};
  background-color: ${({ theme, color, inverted }) =>
    inverted ? "white" : theme.colors[color]};

  :focus {
    outline: 0;
  }
`;

interface ButtonProps {
  label?: string;
  icon?: JSX.Element;
  inverted?: boolean;
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
      hasIcon={icon && true}
      hasMarginRight={marginRight}
      color={color ? color : "primary"}
      inverted={inverted}
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
