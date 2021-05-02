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
  onClose?: () => void;
  onSubmit?: (e: any) => void;
  showModal: boolean;
  disableBgClick?: boolean;
  fullwidth?: boolean;
  width?: "full" | "normal" | "thin";
  inverted?: boolean;
}
export const Modal: FC<Modal> = ({
  children,
  onClose = () => {},
  onSubmit = () => {},
  showModal,
  disableBgClick = false,
  inverted = false,
  fullwidth = false,
  width = "normal",
}) => {
  return (
    <>
      {showModal && (
        <ModalWrap>
          <Background
            onClick={disableBgClick ? () => {} : onClose}
          ></Background>
          <ModalCard inverted={inverted} fullwidth={fullwidth} width={width}>
            <form onSubmit={onSubmit}>{children}</form>
          </ModalCard>
        </ModalWrap>
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
    <Card fullwidth={fullwidth} inverted={inverted} width={width}>
      {children}
    </Card>
  );
};

interface ModalHeader {
  title?: string;
}
export const ModalHeader: FC<ModalHeader> = ({ title }) => {
  return (
    <>
      <CardHeader>
        <CardTitle>{title}</CardTitle>
      </CardHeader>
    </>
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
