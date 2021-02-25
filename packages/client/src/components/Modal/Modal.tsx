import React, { ReactNode } from "react";

import {
  ModalWrap,
  Background,
  Card,
  CardHeader,
  CardTitle,
  CardBody,
  Footer,
} from "./ModalStyles";

interface Modal {
  children?: ReactNode;
  onClose: Function;
  showModal: boolean;
  disableBgClick?: boolean;
}
export const Modal: React.FC<Modal> = ({
  children,
  onClose,
  showModal,
  disableBgClick,
}) => {
  return (
    <ModalWrap showModal={showModal}>
      <Background
        onClick={(): void => (disableBgClick ? {} : onClose())}
      ></Background>
      {children}
    </ModalWrap>
  );
};

interface ModalCard {
  children?: ReactNode;
  fullwidth?: boolean;
}
export const ModalCard: React.FC<ModalCard> = ({ children, fullwidth }) => {
  return <Card fullwidth={fullwidth}>{children}</Card>;
};

interface ModalHeader {
  title?: string;
  onClose: Function;
}
export const ModalHeader: React.FC<ModalHeader> = ({ title, onClose }) => {
  return (
    <CardHeader>
      <CardTitle>{title}</CardTitle>
      {/* <button
        type="button"
        onClick={(): void => onClose()}
        aria-label="close"
      ></button> */}
    </CardHeader>
  );
};

interface ModalContent {
  children?: ReactNode;
}
export const ModalContent: React.FC<ModalContent> = ({ children }) => {
  return <CardBody>{children}</CardBody>;
};

interface ModalFooter {
  children?: ReactNode;
}
export const ModalFooter: React.FC<ModalFooter> = ({ children }) => {
  return <Footer>{children}</Footer>;
};
