import React, { useState } from "react";
import { useQueryClient } from "react-query";
import { toast } from "react-toastify";

import { IActant } from "@shared/types";
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
  actant: IActant;
}
export const ActantDetail: React.FC<ActantDetail> = ({ actant }) => {
  const queryClient = useQueryClient();
  const [showDetail, setShowDetail] = useState(false);
  const [tagLabel, setTagLabel] = useState(actant.label);
  return (
    <>
      {showDetail && (
        <Modal onClose={() => setShowDetail(false)} showModal={showDetail}>
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
                <Button
                  label="Cancel"
                  color="success"
                  onClick={() => {
                    setShowDetail(false);
                    setTagLabel("");
                  }}
                />
              </ButtonGroup>
            </ModalFooter>
          </ModalCard>
        </Modal>
      )}
    </>
  );
};
