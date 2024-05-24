import { EntityEnums } from "@shared/enums";
import { IEntity } from "@shared/types";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import api from "api";
import { Submit } from "components";
import { useSearchParams } from "hooks";
import React, { useEffect, useState } from "react";
import { toast } from "react-toastify";
import { getShortLabelByLetterCount } from "utils/utils";

interface TemplateListRemoveModal {
  removeEntityId: string;
  setRemoveEntityId: (value: React.SetStateAction<string | false>) => void;
  entityToRemove: false | IEntity;
}
export const TemplateListRemoveModal: React.FC<TemplateListRemoveModal> = ({
  removeEntityId,
  setRemoveEntityId,
  entityToRemove,
}) => {
  const queryClient = useQueryClient();
  const { detailIdArray, removeDetailId, statementId, selectedDetailId } =
    useSearchParams();

  const [showModal, setShowModal] = useState(false);

  useEffect(() => {
    setShowModal(true);
  }, []);

  const templateRemoveMutation = useMutation({
    mutationFn: async (entityId: string) => await api.entityDelete(entityId),
    onSuccess: (data, variables) => {
      if (detailIdArray.includes(removeEntityId)) {
        removeDetailId(removeEntityId);
        queryClient.invalidateQueries({ queryKey: ["detail-tab-entities"] });
      }
      entityToRemove &&
        toast.warning(
          `Template [${entityToRemove.class}]: "${getShortLabelByLetterCount(
            entityToRemove.label,
            120
          )}" was removed`
        );
      queryClient.invalidateQueries({ queryKey: ["templates"] });
      if (selectedDetailId) {
        // TODO: check if entity class is the same as opened detail
        queryClient.invalidateQueries({ queryKey: ["entity-templates"] });
      }
      if (
        statementId &&
        entityToRemove &&
        entityToRemove.class === EntityEnums.Class.Statement
      ) {
        queryClient.invalidateQueries({ queryKey: ["statement-templates"] });
      }
      queryClient.invalidateQueries({ queryKey: ["entity"] });
      setRemoveEntityId(false);
    },
  });

  const handleRemoveTemplateAccept = () => {
    templateRemoveMutation.mutate(removeEntityId);
  };

  return (
    <Submit
      show={showModal}
      onSubmit={handleRemoveTemplateAccept}
      onCancel={() => setRemoveEntityId(false)}
      entityToSubmit={entityToRemove && entityToRemove}
      loading={templateRemoveMutation.isPending}
      title="Delete template"
      text="Delete template entity?"
      submitLabel="Delete"
    />
  );
};
