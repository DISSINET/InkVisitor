import { EntityEnums } from "@inkvisitor/shared/enums";
import { IEntity } from "@inkvisitor/shared/types";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import api from "api";
import { Submit } from "components";
import { useSearchParams } from "hooks";
import { DETAIL_TAB_ENTITIES_KEY } from "hooks/react-query";
import React, { useEffect, useState } from "react";
import { toast } from "react-toastify";
import { getEntityLabel, getShortLabelByLetterCount } from "utils/utils";

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
  const { detailIdArray, removeDetailId } = useSearchParams();

  const [showModal, setShowModal] = useState(false);

  useEffect(() => {
    setShowModal(true);
  }, []);

  const templateRemoveMutation = useMutation({
    mutationFn: async (entityId: string) => await api.entityDelete(entityId),
    onSuccess: (data, variables) => {
      if (detailIdArray.includes(removeEntityId)) {
        removeDetailId(removeEntityId);
        queryClient.invalidateQueries({ queryKey: [DETAIL_TAB_ENTITIES_KEY] });
      }
      // the removed entity's own detail is dropped rather than refetched -
      // GET /entities/:id/detail answers EntityDoesNotExist for it, and the
      // detail tab it backed can still be mounted at this point
      queryClient.removeQueries({ queryKey: ["entity", removeEntityId] });

      entityToRemove &&
        toast.warning(
          `Template [${entityToRemove.class}]: "${getShortLabelByLetterCount(
            getEntityLabel(entityToRemove),
            120
          )}" was removed`
        );
      queryClient.invalidateQueries({ queryKey: ["templates"] });
      // other entities cite this template through usedTemplate, so their
      // details are refreshed - every one except the id just deleted
      queryClient.invalidateQueries({
        predicate: (query) =>
          query.queryKey[0] === "entity" && query.queryKey[1] !== removeEntityId,
      });
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
