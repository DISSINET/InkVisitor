import { IEntity } from "@inkvisitor/shared/types";
import { ThemeColor } from "Theme/theme";
import {
  Button,
  ButtonGroup,
  CancelButton,
  Modal,
  ModalContent,
  ModalFooter,
  ModalHeader,
} from "components";
import { EntityTag } from "components/advanced";
import React from "react";
import { StyledSubmitContent, StyledSubmitText } from "./SubmitStyles";

interface Submit {
  title?: string;
  text?: string;
  entityToSubmit?: IEntity | false;
  show: boolean;
  onSubmit: () => void;
  onCancel: () => void;
  loading?: boolean;
  submitLabel?: string;
  /** Carries the weight of what the confirmation guards - danger for a removal,
   * a plainer color for a change that can be made again. */
  submitColor?: keyof ThemeColor;
  /** Lets a click beside the dialog dismiss it, same as Cancel. The background
   * is inert by default so a stray click cannot wave through a removal. */
  bgClickCancels?: boolean;
}
export const Submit: React.FC<Submit> = ({
  title,
  text,
  entityToSubmit,
  show,
  onSubmit,
  onCancel,
  loading = false,
  submitLabel = "Confirm",
  submitColor = "danger",
  bgClickCancels = false,
}) => {
  return (
    <>
      <Modal
        onEnterPress={onSubmit}
        onClose={onCancel}
        showModal={show}
        disableBgClick={!bgClickCancels}
        isLoading={loading}
        width="auto"
        maxWidth={600}
      >
        <ModalHeader title={title} />
        <ModalContent>
          <StyledSubmitContent>
            <StyledSubmitText>{text}</StyledSubmitText>
            {entityToSubmit && (
              <EntityTag entity={entityToSubmit} disableDoubleClick disableDrag fullWidth />
            )}
          </StyledSubmitContent>
        </ModalContent>
        <ModalFooter>
          <ButtonGroup>
            <CancelButton onClick={onCancel} />
            <Button label={submitLabel} color={submitColor} onClick={onSubmit} />
          </ButtonGroup>
        </ModalFooter>
      </Modal>
    </>
  );
};
