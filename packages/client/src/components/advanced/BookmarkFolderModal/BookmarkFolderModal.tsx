import {
  Button,
  ButtonGroup,
  CancelButton,
  Input,
  Loader,
  Modal,
  ModalContent,
  ModalFooter,
  ModalHeader,
  ModalInputForm,
  ModalInputLabel,
  ModalInputWrap,
} from "components";
import React from "react";

interface BookmarkFolderModal {
  showModal: boolean;
  title: string;
  submitLabel: string;
  name: string;
  onNameChange: (name: string) => void;
  isValid: boolean;
  onSubmit: () => void;
  onClose: () => void;
  isLoading?: boolean;
}
/** Names a bookmark folder, for both creating and renaming one. */
export const BookmarkFolderModal: React.FC<BookmarkFolderModal> = ({
  showModal,
  title,
  submitLabel,
  name,
  onNameChange,
  isValid,
  onSubmit,
  onClose,
  isLoading = false,
}) => (
  <Modal showModal={showModal} onClose={onClose} onEnterPress={onSubmit} width={350}>
    <ModalHeader title={title} />
    <ModalContent>
      <ModalInputForm alignLeft>
        <ModalInputLabel>new label:</ModalInputLabel>
        <ModalInputWrap>
          <Input
            labelSpaceNoWrap
            placeholder=""
            onChangeFn={onNameChange}
            value={name}
            changeOnType
            autoFocus
            width="full"
          />
        </ModalInputWrap>
      </ModalInputForm>
    </ModalContent>

    <ModalFooter>
      <ButtonGroup>
        <CancelButton key="cancel" onClick={onClose} />
        <Button
          key="submit"
          label={submitLabel}
          color="info"
          onClick={onSubmit}
          disabled={!isValid}
        />
      </ButtonGroup>
    </ModalFooter>
    <Loader show={isLoading} />
  </Modal>
);
