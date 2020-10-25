import React, { ReactNode } from "react";
import classNames from "classnames";

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
  const modalWrapClasses = classNames(
    showModal ? "flex" : "hidden",
    "flex-col",
    "justify-center",
    "items-center",
    "overflow-hidden",
    "fixed",
    "top-0",
    "right-0",
    "bottom-0",
    "left-0",
    "z-40"
  );

  const backgroundClasses = classNames(
    "absolute",
    "top-0",
    "right-0",
    "bottom-0",
    "left-0",
    "bg-black",
    "bg-opacity-75"
  );
  return (
    <div className={modalWrapClasses}>
      <div
        className={backgroundClasses}
        onClick={(): void => (disableBgClick ? {} : onClose())}
      ></div>
      {children}
    </div>
  );
};

interface ModalCard {
  children?: ReactNode;
  fullwidth?: boolean;
}
export const ModalCard: React.FC<ModalCard> = ({ children, fullwidth }) => {
  const cardClasses = classNames(
    "flex",
    "flex-col",
    "overflow-hidden",
    "z-50",
    "my-4",
    fullwidth ? "w-4/5" : "w-2/4"
  );
  return <div className={cardClasses}>{children}</div>;
};

interface ModalHeader {
  title?: string;
  onClose: Function;
}
export const ModalHeader: React.FC<ModalHeader> = ({ title, onClose }) => {
  const cardHeaderClasses = classNames(
    "flex",
    "justify-start",
    "items-center",
    "flex-shrink-0",
    "p-3",
    "relative",
    "bg-white",
    "border-b-2",
    "border-gray-200",
    "rounded-t-sm"
  );
  const cardTitleClasses = classNames("flex-grow", "flex-shrink-0", "text-2xl");
  return (
    <header className={cardHeaderClasses}>
      <h2 className={cardTitleClasses}>{title}</h2>
      <button
        type="button"
        onClick={(): void => onClose()}
        aria-label="close"
      ></button>
    </header>
  );
};

interface ModalContent {
  children?: ReactNode;
}
export const ModalContent: React.FC<ModalContent> = ({ children }) => {
  const modalContentClasses = classNames(
    "flex-grow",
    "flex-shrink",
    "overflow-auto",
    "p-8",
    "bg-white"
  );
  return <section className={modalContentClasses}>{children}</section>;
};

interface ModalFooter {
  children?: ReactNode;
}
export const ModalFooter: React.FC<ModalFooter> = ({ children }) => {
  const modalFooterClasses = classNames(
    "border-t-2",
    "border-gray-200",
    "flex",
    "items-center",
    "bg-white",
    "flex-shrink-0",
    "justify-end",
    "relative",
    "p-3",
    "rounded-b-sm"
  );
  return <div className={modalFooterClasses}>{children}</div>;
};
