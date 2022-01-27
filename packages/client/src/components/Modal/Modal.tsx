import React, { FC, ReactNode } from "react";
import { config, useSpring } from "react-spring";
import { Colors } from "types";

import {
  StyledModalWrap,
  StyledBackground,
  StyledCard,
  StyledCardHeader,
  StyledCardTitle,
  StyledCardBody,
  StyledFooter,
  StyledModalInputForm,
  StyledModalInputLabel,
  StyledModalInputWrap,
} from "./ModalStyles";
import { ModalKeyPress } from "./ModalKeyPress";

interface Modal {
  children?: ReactNode;
  onClose?: () => void;
  onEnterPress?: () => void;
  showModal: boolean;
  disableBgClick?: boolean;
  width?: "full" | "normal" | "thin" | number;
  disableEscapeClose?: boolean;
}
export const Modal: FC<Modal> = ({
  children,
  onClose = () => {},
  onEnterPress = () => {},
  showModal,
  disableBgClick = false,
  width = "normal",
  disableEscapeClose = false,
}) => {
  const animatedMount = useSpring({
    opacity: showModal ? 1 : 0,
    config: config.stiff,
  });

  return (
    <>
      {showModal && (
        <>
          <StyledModalWrap>
            <StyledBackground
              style={animatedMount}
              onClick={disableBgClick ? () => {} : onClose}
            />
            <ModalCard animatedMount={animatedMount} width={width}>
              {children}
            </ModalCard>
          </StyledModalWrap>
          <ModalKeyPress
            onEnter={onEnterPress}
            onEscape={disableEscapeClose ? () => {} : onClose}
          />
        </>
      )}
    </>
  );
};

interface ModalCard {
  children?: ReactNode;
  width: "full" | "normal" | "thin" | number;
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
export const ModalHeader: FC<ModalHeader> = ({ title, color }) => {
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

// Input form helpers
interface ModalInputForm {
  children?: React.ReactNode;
}
export const ModalInputForm: React.FC<ModalInputForm> = ({ children }) => {
  return <StyledModalInputForm>{children}</StyledModalInputForm>;
};
interface ModalInputLabel {
  children?: React.ReactNode;
}
export const ModalInputLabel: React.FC<ModalInputLabel> = ({ children }) => {
  return <StyledModalInputLabel>{children}</StyledModalInputLabel>;
};
interface ModalInputWrap {
  width?: number;
  children?: React.ReactNode;
}
export const ModalInputWrap: React.FC<ModalInputWrap> = ({
  width,
  children,
}) => {
  return <StyledModalInputWrap width={width}>{children}</StyledModalInputWrap>;
};
