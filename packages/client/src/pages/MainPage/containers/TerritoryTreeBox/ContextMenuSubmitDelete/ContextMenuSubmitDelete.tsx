import React, { useEffect, useState } from "react";
import { useQueryClient } from "react-query";
import { useHistory, useLocation } from "react-router-dom";
import { toast } from "react-toastify";
const queryString = require("query-string");

import api from "api";
import { IActant } from "@shared/types";
import { Submit } from "components";
import useKeypress from "hooks/useKeyPress";

interface ContextMenuSubmitDelete {
  territoryActant: IActant;
  onClose: () => void;
}
export const ContextMenuSubmitDelete: React.FC<ContextMenuSubmitDelete> = ({
  onClose,
  territoryActant,
}) => {
  const [showModal, setShowModal] = useState(false);

  useEffect(() => {
    setShowModal(true);
  }, []);

  const queryClient = useQueryClient();
  let history = useHistory();
  let location = useLocation();
  var hashParams = queryString.parse(location.hash);
  const territoryId = hashParams.territory;

  const onSubmitDelete = async () => {
    const res = await api.actantsDelete(territoryActant.id);
    if (res.status === 200) {
      toast.info(`Territory [${territoryActant.label}] deleted!`);
      queryClient.invalidateQueries("tree");
    } else {
      toast.error(`Error: Territory [${territoryActant.label}] not deleted!`);
    }
    if (territoryId === territoryActant.id) {
      hashParams["territory"] = "";
      history.push({
        hash: queryString.stringify(hashParams),
      });
    }
    onClose();
  };

  useKeypress("Enter", onSubmitDelete);
  useKeypress("Escape", onClose);

  return (
    <Submit
      title={"Delete Territory"}
      text={`Do you really want do delete Territory [${territoryActant.label}]?`}
      show={showModal}
      onSubmit={() => onSubmitDelete()}
      onCancel={() => onClose()}
    />
  );
};
