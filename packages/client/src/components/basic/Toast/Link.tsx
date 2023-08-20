import React, { ReactElement, ReactNode } from "react";
import { StyledBox, StyledContent } from "components/basic/Box/BoxStyles";

interface IToastWithLinkProps {
  children: ReactNode;
  linkText: string;
  onLinkClick: () => void
}

const ToastWithLink: React.FC<IToastWithLinkProps> = ({ children, linkText, onLinkClick }) => {
  return (
    <StyledBox>
      <p>{children}</p>
      <a href={`#`} onClick={onLinkClick}>{linkText}</a>
    </StyledBox>
  );
};

export default ToastWithLink;