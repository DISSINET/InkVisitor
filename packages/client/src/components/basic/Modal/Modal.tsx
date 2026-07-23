import { config, useSpring } from "@react-spring/web";
import { ThemeColor } from "Theme/theme";
import { Loader } from "components";
import React, { FC, ReactNode } from "react";
import { ButtonSize } from "types";
import { ButtonDefaultsProvider } from "../Button/ButtonDefaults";
import { ModalKeyPress } from "./ModalKeyPress";
import {
  StyledBackground,
  StyledCard,
  StyledCardBody,
  StyledCardContent,
  StyledCardHeader,
  StyledCardIcon,
  StyledCardTitle,
  StyledCloseIconWrap,
  StyledFooter,
  StyledFooterNote,
  StyledIoClose,
  StyledModalInputForm,
  StyledModalInputLabel,
  StyledModalInputWrap,
  StyledModalWrap,
} from "./ModalStyles";
import ReactDOM from "react-dom";

interface Modal {
  children?: ReactNode;
  onClose?: () => void;
  onEnterPress?: () => void;
  showModal: boolean;
  disableBgClick?: boolean;
  width?: "full" | "fat" | "normal" | "auto" | number;
  // to combine with auto width
  maxWidth?: number;
  disableEscapeClose?: boolean;
  disableBackground?: boolean;
  isLoading?: boolean;
  fullHeight?: boolean;
  lowerZIndex?: boolean;
}
export const Modal: FC<Modal> = ({
  children,
  onClose = () => {},
  onEnterPress = () => {},
  showModal,
  disableBgClick = false,
  width = "normal",
  maxWidth = undefined,
  disableEscapeClose = false,
  disableBackground = false,
  isLoading = false,
  fullHeight = false,
  lowerZIndex = false,
}) => {
  const animatedMount = useSpring({
    opacity: showModal ? 1 : 0,
    config: config.stiff,
  });

  return (
    <>
      {showModal && (
        <>
          {ReactDOM.createPortal(
            <StyledModalWrap
              $lowerZIndex={lowerZIndex}
              // data-attribute-modal is used to prevent closing of the annotator highlight menu
              // while interacting with EntityCreateModal
              data-attribute-modal="true"
            >
              {!disableBackground && (
                <StyledBackground
                  style={animatedMount}
                  onClick={disableBgClick ? () => {} : onClose}
                />
              )}
              <ModalCard
                animatedMount={animatedMount}
                width={width}
                maxWidth={maxWidth}
                isLoading={isLoading}
                fullHeight={fullHeight}
              >
                {children}
              </ModalCard>
            </StyledModalWrap>,
            document.body,
          )}
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
  width: "full" | "fat" | "normal" | "auto" | number;
  maxWidth?: number;
  animatedMount: any;
  isLoading?: boolean;
  fullHeight: boolean;
}
export const ModalCard: FC<ModalCard> = ({
  children,
  width,
  maxWidth,
  animatedMount,
  isLoading,
  fullHeight,
}) => {
  return (
    <StyledCard style={animatedMount} width={width} $maxWidth={maxWidth} $fullHeight={fullHeight}>
      {children}
      <Loader show={isLoading} size={36} />
    </StyledCard>
  );
};

interface ModalHeader {
  title?: string | React.ReactElement;
  color?: keyof ThemeColor;
  icon?: React.ReactNode;
  iconColor?: keyof ThemeColor;
  onClose?: () => void;
  boldTitle?: boolean;
  content?: React.ReactNode;
}
export const ModalHeader: FC<ModalHeader> = ({
  title,
  color,
  icon,
  iconColor,
  onClose,
  boldTitle,
  content,
}) => {
  return (
    <>
      <StyledCardHeader $color={color}>
        {icon && <StyledCardIcon $color={iconColor}>{icon}</StyledCardIcon>}
        <StyledCardTitle $boldTitle={boldTitle}>{title}</StyledCardTitle>
        {content && <StyledCardContent>{content}</StyledCardContent>}
        {onClose && (
          <StyledCloseIconWrap onClick={onClose}>
            <StyledIoClose size={20} />
          </StyledCloseIconWrap>
        )}
      </StyledCardHeader>
    </>
  );
};

interface ModalContent {
  column?: boolean;
  children?: ReactNode;
  enableScroll?: boolean;
  centered?: boolean;
  isLoading?: boolean;
  noPadding?: boolean;
}
export const ModalContent: FC<ModalContent> = ({
  children,
  column,
  enableScroll = false,
  centered,
  isLoading,
  noPadding = false,
}) => {
  return (
    <StyledCardBody
      $column={column}
      $enableScroll={enableScroll}
      $noPadding={noPadding}
      centered={centered}
    >
      {children}
      <Loader show={isLoading} size={36} />
    </StyledCardBody>
  );
};

interface ModalFooter {
  children?: ReactNode;
  column?: boolean;
  spaceBetween?: boolean;
  /** Optional gray text shown on the left side, vertically centered. */
  note?: ReactNode;
}
export const ModalFooter: FC<ModalFooter> = ({
  children,
  column = false,
  spaceBetween = false,
  note,
}) => {
  return (
    <StyledFooter $column={column} $spaceBetween={spaceBetween}>
      {note && <StyledFooterNote>{note}</StyledFooterNote>}
      <ButtonDefaultsProvider size={ButtonSize.Medium} shape="rounded-md">
        {children}
      </ButtonDefaultsProvider>
    </StyledFooter>
  );
};

// Input form helpers
interface ModalInputForm {
  children?: React.ReactNode;
  alignLeft?: boolean; // centered by default
}
export const ModalInputForm: React.FC<ModalInputForm> = ({ children, alignLeft = false }) => {
  return <StyledModalInputForm $alignLeft={alignLeft}>{children}</StyledModalInputForm>;
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
export const ModalInputWrap: React.FC<ModalInputWrap> = ({ width, children }) => {
  return <StyledModalInputWrap width={width}>{children}</StyledModalInputWrap>;
};
