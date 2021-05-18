import React, { FC, ReactNode, useEffect } from "react";

import {
  StyledModalWrap,
  StyledBackground,
  StyledCard,
  StyledCardHeader,
  StyledCardTitle,
  StyledCardBody,
  StyledFooter,
} from "./ModalStyles";

interface Modal {
  children?: ReactNode;
  onClose?: () => void;
  showModal: boolean;
  disableBgClick?: boolean;
  fullwidth?: boolean;
  width?: "full" | "normal" | "thin";
  inverted?: boolean;
}
export const Modal: FC<Modal> = ({
  children,
  onClose = () => {},
  showModal,
  disableBgClick = false,
  inverted = false,
  fullwidth = false,
  width = "normal",
}) => {
  return (
    <>
      {showModal && (
        <StyledModalWrap>
          <StyledBackground
            onClick={disableBgClick ? () => {} : onClose}
          ></StyledBackground>
          <ModalCard inverted={inverted} fullwidth={fullwidth} width={width}>
            {children}
          </ModalCard>
        </StyledModalWrap>
      )}
    </>
  );
};

interface ModalCard {
  children?: ReactNode;
  fullwidth: boolean;
  width: "full" | "normal" | "thin";
  inverted: boolean;
}
export const ModalCard: FC<ModalCard> = ({
  children,
  fullwidth,
  inverted,
  width,
}) => {
  return (
    <StyledCard fullwidth={fullwidth} inverted={inverted} width={width}>
      {children}
    </StyledCard>
  );
};

interface ModalHeader {
  title?: string;
}
export const ModalHeader: FC<ModalHeader> = ({ title }) => {
  return (
    <>
      <StyledCardHeader>
        <StyledCardTitle>{title}</StyledCardTitle>
      </StyledCardHeader>
    </>
  );
};

interface ModalContent {
  children?: ReactNode;
}
export const ModalContent: FC<ModalContent> = ({ children }) => {
  return <StyledCardBody>{children}</StyledCardBody>;
};

interface ModalFooter {
  children?: ReactNode;
}
export const ModalFooter: FC<ModalFooter> = ({ children }) => {
  return <StyledFooter>{children}</StyledFooter>;
};
