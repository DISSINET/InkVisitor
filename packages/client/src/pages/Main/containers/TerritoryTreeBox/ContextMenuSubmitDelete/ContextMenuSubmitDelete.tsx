import { IEntity } from "@inkvisitor/shared/types";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import api from "api";
import { Submit, ToastWithLink } from "components";
import { useSearchParams } from "hooks";
import React, { useEffect, useState } from "react";
import { toast } from "react-toastify";
import { getShortLabelByLetterCount } from "utils/utils";
import { handleDeleteEntityError } from "utils/deleteEntityConflict";
import { openRestoredEntity } from "utils/openRestoredEntity";

interface ContextMenuSubmitDelete {
  territoryActant: IEntity;
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
  const {
    territoryId,
    setTerritoryId,
    setStatementId,
    detailIdArray,
    removeDetailId,
    appendDetailId,
  } = useSearchParams();

  const deleteTerritoryMutation = useMutation({
    mutationFn: async () => await api.entityDelete(territoryActant.id),
    onSuccess: () => {
      toast.info(
        <ToastWithLink
          children={`Territory [${getShortLabelByLetterCount(
            territoryActant.labels[0],
            120
          )}] deleted!`}
          linkText="Restore"
          onLinkClick={async () => {
            const response = await api.entityRestore(territoryActant.id);
            toast.info("Entity restored");
            openRestoredEntity(response.data.data as IEntity, {
              setTerritoryId,
              setStatementId,
              appendDetailId,
            });
            queryClient.invalidateQueries({ queryKey: ["tree"] });
            queryClient.invalidateQueries({
              queryKey: ["detail-tab-entities"],
            });
            queryClient.invalidateQueries({ queryKey: ["statement"] });
          }}
        />,
        {
          autoClose: 5000,
        }
      );

      if (territoryId === territoryActant.id) {
        setTerritoryId("");
      }
      removeDetailId(territoryActant.id);
      queryClient.invalidateQueries({ queryKey: ["detail-tab-entities"] });
      queryClient.invalidateQueries({ queryKey: ["tree"] });
      queryClient.invalidateQueries({ queryKey: ["statement"] });
      queryClient.invalidateQueries({ queryKey: ["bookmarks"] });
      onClose();
    },
    onError: (error) => {
      if (handleDeleteEntityError(error, territoryActant.id, appendDetailId)) {
        onClose();
      }
    },
  });

  const onSubmitDelete = () => {
    deleteTerritoryMutation.mutate();
  };

  return (
    <Submit
      title={"Delete Territory"}
      text={`Do you really want to delete Territory?`}
      entityToSubmit={territoryActant}
      show={showModal}
      onSubmit={() => onSubmitDelete()}
      onCancel={() => onClose()}
      loading={deleteTerritoryMutation.isPending}
    />
  );
};
