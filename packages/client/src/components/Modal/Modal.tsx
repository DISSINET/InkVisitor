import React, { FC, ReactNode } from "react";

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
export const Modal: FC<Modal> = ({
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
export const ModalCard: FC<ModalCard> = ({ children, fullwidth }) => {
  return <Card fullwidth={fullwidth}>{children}</Card>;
};

interface ModalHeader {
  title?: string;
  onClose: Function;
}
export const ModalHeader: FC<ModalHeader> = ({ title, onClose }) => {
  return (
    <CardHeader>
      <CardTitle>{title}</CardTitle>
    </CardHeader>
  );
};

interface ModalContent {
  children?: ReactNode;
}
export const ModalContent: FC<ModalContent> = ({ children }) => {
  return <CardBody>{children}</CardBody>;
};

interface ModalFooter {
  children?: ReactNode;
}
export const ModalFooter: FC<ModalFooter> = ({ children }) => {
  return <Footer>{children}</Footer>;
};
