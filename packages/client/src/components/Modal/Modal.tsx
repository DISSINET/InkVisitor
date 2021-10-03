import React, { FC, ReactNode, useEffect } from "react";
import { config, useSpring } from "react-spring";
import { Colors } from "types";
import useKeypress from "hooks/useKeyPress";

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
  onEnterPress?: () => void;
  showModal: boolean;
  disableBgClick?: boolean;
  width?: "full" | "normal" | "thin";
  closeOnEscape?: boolean;
}
export const Modal: FC<Modal> = ({
  children,
  onClose = () => {},
  onEnterPress = () => {},
  showModal,
  disableBgClick = false,
  width = "normal",
  closeOnEscape = false,
}) => {
  const animatedMount = useSpring({
    opacity: showModal ? 1 : 0,
    config: config.stiff,
  });

  useKeypress("Enter", () => {
    onEnterPress();
  });
  useKeypress("Escape", closeOnEscape ? onClose : () => {});

  return (
    <>
      {showModal && (
        <StyledModalWrap>
          <StyledBackground
            style={animatedMount}
            onClick={disableBgClick ? () => {} : onClose}
          />
          <ModalCard animatedMount={animatedMount} width={width}>
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
  animatedMount: any;
}
export const ModalCard: FC<ModalCard> = ({
  children,
  width,
  animatedMount,
}) => {
  return (
    <StyledCard style={animatedMount} width={width}>
      {children}
    </StyledCard>
  );
};

interface ModalHeader {
  title?: string | React.ReactElement;
  color?: typeof Colors[number];
}
export const ModalHeader: FC<ModalHeader> = ({ title, color = "white" }) => {
  return (
    <>
      <StyledCardHeader color={color}>
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
