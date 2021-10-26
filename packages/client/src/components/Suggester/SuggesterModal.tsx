import React, { useState } from "react";

import {
  Modal,
  ModalHeader,
  ModalContent,
  Input,
  ModalFooter,
  ButtonGroup,
  Button,
} from "components";
import { IOption } from "@shared/types";
import { StyledForm } from "./SuggesterStyles";

interface SuggesterModal {
  show?: boolean;
  typed: string;
  category: string;
  categories: IOption[];
  onCreate: Function;
  closeModal: Function;
}
export const SuggesterModal: React.FC<SuggesterModal> = ({
  show = false,
  typed,
  category,
  categories,
  onCreate,
  closeModal,
}) => {
  const [selectedCategory, setSelectedCategory] = useState<string>(category);
  const [label, setLabel] = useState(typed);
  const [detail, setDetail] = useState("");

  const handleCreateActant = () => {
    onCreate({
      label: label,
      category: selectedCategory,
      detail: detail,
    });
  };

  // if (categories[0].value === false) {
  //   categories.shift();
  // }

  //   const index = categories.indexOf("*");
  // if (index > -1) {
  //   categories.splice(index, 1);
  // }

  return (
    <Modal showModal={show}>
      <ModalHeader title="Create actant" />
      <ModalContent>
        <StyledForm>
          <Input
            type="select"
            label="Category: "
            value={selectedCategory}
            options={categories}
            inverted
            suggester
            onChangeFn={(newCategory: string) =>
              setSelectedCategory(newCategory)
            }
          />
          <Input
            label="Label: "
            value={label}
            onChangeFn={(newType: string) => setLabel(newType)}
            changeOnType
            autoFocus
          />
          <Input
            label="Detail: "
            value={detail}
            onChangeFn={(newType: string) => setDetail(newType)}
            changeOnType
          />
        </StyledForm>
      </ModalContent>
      <ModalFooter>
        <ButtonGroup>
          <Button
            key="cancel"
            label="Cancel"
            color="warning"
            onClick={() => {
              closeModal();
            }}
          />
          <Button
            key="submit"
            label="Submit"
            color="primary"
            onClick={() => {
              handleCreateActant();
              closeModal();
            }}
          />
        </ButtonGroup>
      </ModalFooter>
    </Modal>
  );
};
