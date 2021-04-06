import React, { useState } from "react";
import { useQueryClient } from "react-query";
import { toast } from "react-toastify";

import {
  Button,
  ButtonGroup,
  Input,
  Modal,
  ModalCard,
  ModalContent,
  ModalFooter,
  ModalHeader,
} from "components";

interface ActantDetail {
  label: string;
  category: string;
  showDetail?: boolean;
  onClose: () => void;
}
export const ActantDetail: React.FC<ActantDetail> = ({
  label,
  category,
  showDetail = false,
  onClose,
}) => {
  const queryClient = useQueryClient();
  // const [showDetail, setShowDetail] = useState(false);
  const [tagLabel, setTagLabel] = useState(label);
  return (
    <>
      <Modal onClose={onClose} showModal={showDetail}>
        <ModalCard>
          <ModalHeader title={"Add child Territory"} />
          <ModalContent>
            <Input
              label={"Territory name: "}
              value={tagLabel}
              onChangeFn={(value: string) => setTagLabel(value)}
            />
          </ModalContent>
          <ModalFooter>
            <ButtonGroup>
              <Button
                label="Save"
                color="primary"
                onClick={() => {
                  if (tagLabel.length > 0) {
                    // update({data: });
                  } else {
                    toast.warning("Fill actant label!");
                  }
                }}
              />
              <Button label="Cancel" color="success" onClick={onClose} />
            </ButtonGroup>
          </ModalFooter>
        </ModalCard>
      </Modal>
    </>
  );
};
