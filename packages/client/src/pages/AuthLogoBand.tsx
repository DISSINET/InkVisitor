import React from "react";
import LogoInkvisitor from "assets/logos/inkvisitor-full.svg";
import { getHeaderColor } from "utils/appEnv";
import { StyledLogoBand } from "./AuthModalSharedStyles";

export const AuthLogoBand: React.FC = () => (
  <StyledLogoBand $color={getHeaderColor()}>
    <img src={LogoInkvisitor} alt="InkVisitor — an advanced research environment for linked data" />
  </StyledLogoBand>
);
