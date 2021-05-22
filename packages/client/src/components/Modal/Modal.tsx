import React, { FC, ReactNode, useEffect } from "react";
import { useSpring } from "react-spring";

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
  width?: "full" | "normal" | "thin";
  inverted?: boolean;
}
export const Modal: FC<Modal> = ({
  children,
  onClose = () => {},
  showModal,
  disableBgClick = false,
  inverted = false,
  width = "normal",
}) => {
  const animatedMount = useSpring({
    opacity: showModal ? 1 : 0,
    config: { friction: 20, mass: 1, tension: 200 },
  });
  return (
    <>
      {showModal && (
        <StyledModalWrap>
          <StyledBackground
            style={animatedMount}
            onClick={disableBgClick ? () => {} : onClose}
          />
          <ModalCard
            animatedMount={animatedMount}
            inverted={inverted}
            width={width}
          >
            {children}
          </ModalCard>
        </StyledModalWrap>
      )}
    </>
  );
};

interface ModalCard {
  children?: ReactNode;
  width: "full" | "normal" | "thin";
  inverted: boolean;
  animatedMount: any;
}
export const ModalCard: FC<ModalCard> = ({
  children,
  inverted,
  width,
  animatedMount,
}) => {
  return (
    <StyledCard style={animatedMount} inverted={inverted} width={width}>
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
