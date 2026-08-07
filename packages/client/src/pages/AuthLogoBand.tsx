import React from "react";
import LogoInkvisitor from "assets/logos/inkvisitor-full.svg";
import { StyledLogoBand } from "./AuthModalSharedStyles";

export const AuthLogoBand: React.FC = () => (
  <StyledLogoBand>
    <img src={LogoInkvisitor} alt="InkVisitor — an advanced research environment for linked data" />
  </StyledLogoBand>
);
