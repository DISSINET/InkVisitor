import React, { ReactNode } from "react";
import { StyledLink, StyledWrap } from "./ToastStyles";

interface ToastWithLink {
  children: ReactNode;
  linkText: string;
  onLinkClick: () => void;
}

const ToastWithLink: React.FC<ToastWithLink> = ({
  children,
  linkText,
  onLinkClick,
}) => {
  return (
    <StyledWrap>
      <div>{children}</div>
      <StyledLink href={`#`} onClick={onLinkClick}>
        {linkText}
      </StyledLink>
    </StyledWrap>
  );
};

export default ToastWithLink;
