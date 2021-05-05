import { IActant } from "@shared/types";
import api from "api";
import { Submit } from "components";
import useKeypress from "hooks/useKeyPress";
import React from "react";
import { useQueryClient } from "react-query";
import { toast } from "react-toastify";

interface ContextMenuSubmitDelete {
  territoryActant: IActant;
  onClose: () => void;
}
export const ContextMenuSubmitDelete: React.FC<ContextMenuSubmitDelete> = ({
  onClose,
  territoryActant,
}) => {
  const queryClient = useQueryClient();

  const onSubmitDelete = async () => {
    const res = await api.actantsDelete(territoryActant.id);
    if (res.status === 200) {
      toast.info(`Territory [${territoryActant.label}] deleted!`);
      queryClient.invalidateQueries("tree");
    } else {
      toast.error(`Error: Territory [${territoryActant.label}] not deleted!`);
    }
    onClose();
  };

  useKeypress("Enter", onSubmitDelete);
  useKeypress("Escape", onClose);

  return (
    <Submit
      title={"Delete Territory"}
      text={`Do you really want do delete Territory with ID [${territoryActant.id}]?`}
      show={true}
      onSubmit={() => onSubmitDelete()}
      onCancel={() => onClose()}
    />
  );
};
