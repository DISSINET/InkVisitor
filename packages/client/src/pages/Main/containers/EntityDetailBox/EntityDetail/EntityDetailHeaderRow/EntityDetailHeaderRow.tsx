import { EntityEnums, UserEnums } from "@shared/enums";
import { IEntity, IStatement } from "@shared/types";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import api from "api";
import { Button, ButtonGroup } from "components";
import { AddTerritoryModal, EntityTag } from "components/advanced";
import { InstTemplate } from "constructors";
import { useSearchParams } from "hooks";
import React, { useState } from "react";
import { AiOutlineLink } from "react-icons/ai";
import { CgListTree } from "react-icons/cg";
import { FaClone, FaEdit, FaTrashAlt } from "react-icons/fa";
import { toast } from "react-toastify";
import {
  StyledActantHeaderRow,
  StyledGrClone,
  StyledTagWrap,
} from "./EntityDetailHeaderRowStyles";

interface EntityDetailHeaderRow {
  entity: IEntity;
  userCanEdit: boolean;
  mayBeRemoved?: boolean;
  setShowRemoveSubmit: React.Dispatch<React.SetStateAction<boolean>>;
  setCreateTemplateModal: React.Dispatch<React.SetStateAction<boolean>>;
}
export const EntityDetailHeaderRow: React.FC<EntityDetailHeaderRow> = ({
  entity,
  userCanEdit,
  mayBeRemoved,
  setShowRemoveSubmit,
  setCreateTemplateModal,
}) => {
  const queryClient = useQueryClient();

  const { setStatementId, setTerritoryId, appendDetailId } = useSearchParams();

  const cloneEntityMutation = useMutation({
    mutationFn: async (entityId: string) => await api.entityClone(entityId),
    onSuccess: (data, variables) => {
      appendDetailId(data.data.data.id);
      toast.info(`Entity duplicated!`);
      queryClient.invalidateQueries({ queryKey: ["templates"] });
      if (data.data.data.class === EntityEnums.Class.Territory) {
        queryClient.invalidateQueries({ queryKey: ["tree"] });
      }
    },
    onError: () => {
      toast.error(`Error: Entity not duplicated!`);
    },
  });

  const instantiateTemplate = async (territoryParentId?: string) => {
    let newInstance;
    if (entity.class === EntityEnums.Class.Territory) {
      if (territoryParentId) {
        newInstance = await InstTemplate(
          entity,
          localStorage.getItem("userrole") as UserEnums.Role,
          territoryParentId
        );
        setShowAddParentModal(false);
      } else {
        toast.info("Cannot create territory without parent");
      }
    } else {
      newInstance = await InstTemplate(
        entity,
        localStorage.getItem("userrole") as UserEnums.Role
      );
    }

    if (newInstance) {
      appendDetailId(newInstance.id);
      toast.info(`Entity instantiated from a template!`);

      if (entity.class === EntityEnums.Class.Statement) {
        toast.warning(`Statement created without territory!`, {
          autoClose: 5000,
        });
      }
      if (entity.class === EntityEnums.Class.Territory) {
        queryClient.invalidateQueries({ queryKey: ["tree"] });
      }
    }
  };

  const [showAddParentModal, setShowAddParentModal] = useState(false);

  return (
    <>
      <StyledActantHeaderRow>
        <StyledTagWrap>
          <EntityTag entity={entity} fullWidth />
        </StyledTagWrap>
        <ButtonGroup style={{ marginTop: "1rem" }}>
          {userCanEdit && (
            <Button
              color="primary"
              icon={<FaTrashAlt />}
              disabled={!mayBeRemoved}
              tooltipLabel={
                mayBeRemoved
                  ? "delete entity"
                  : "entity cannot be deleted while it is linked elsewhere"
              }
              inverted
              onClick={() => {
                if (mayBeRemoved) {
                  setShowRemoveSubmit(true);
                }
              }}
            />
          )}
          {userCanEdit && entity.isTemplate && (
            <>
              <Button
                key="template-create-template"
                icon={<FaClone size={14} />}
                tooltipLabel="create a new template from template"
                inverted
                color="primary"
                onClick={() => {
                  setCreateTemplateModal(true);
                }}
              />
              <Button
                key="instantiate-template"
                icon={<StyledGrClone size={14} $color={"black"} />}
                tooltipLabel="create entity from template"
                inverted
                color="primary"
                onClick={() => {
                  if (entity.class === EntityEnums.Class.Territory) {
                    setShowAddParentModal(true);
                  } else {
                    instantiateTemplate();
                  }
                }}
              />
            </>
          )}
          {userCanEdit && !entity.isTemplate && (
            <>
              <Button
                key="entity-duplicate"
                icon={<FaClone size={14} />}
                color="primary"
                disabled={entity.class === EntityEnums.Class.Statement}
                tooltipLabel="duplicate entity"
                inverted
                onClick={() => {
                  if (entity.class !== EntityEnums.Class.Statement) {
                    cloneEntityMutation.mutate(entity.id);
                  }
                }}
              />
              <Button
                key="entity-create-template"
                icon={<StyledGrClone size={14} $color={"black"} />}
                tooltipLabel="create template from entity"
                inverted
                color="primary"
                onClick={() => {
                  setCreateTemplateModal(true);
                }}
              />
            </>
          )}
          {entity.class === EntityEnums.Class.Statement && (
            <Button
              key="edit"
              icon={<FaEdit size={14} />}
              tooltipLabel="open statement in editor"
              inverted
              color="primary"
              onClick={() => {
                setStatementId(entity.id);
                if (
                  !entity.isTemplate &&
                  (entity as IStatement).data.territory?.territoryId
                ) {
                  setTerritoryId(entity.data.territory.territoryId);
                }
              }}
            />
          )}
          {entity.class === EntityEnums.Class.Territory && (
            <Button
              key="open-territory"
              icon={<CgListTree />}
              tooltipLabel="open territory in tree"
              inverted
              color="primary"
              onClick={() => {
                setTerritoryId(entity.id);
              }}
              disabled={entity.isTemplate}
            />
          )}
          {userCanEdit && (
            <Button
              color="primary"
              icon={<AiOutlineLink size={16} />}
              tooltipLabel={"copy link to detail"}
              inverted
              onClick={async () => {
                await navigator.clipboard.writeText(
                  `${window.location.host}${window.location.pathname}#selectedDetail=${entity.id}&detail=${entity.id}`
                );
                toast.info("Link to detail copied to clipboard");
              }}
            />
          )}
        </ButtonGroup>
      </StyledActantHeaderRow>

      {showAddParentModal && (
        <AddTerritoryModal
          onClose={() => setShowAddParentModal(false)}
          onSubmit={(territoryId: string) => {
            instantiateTemplate(territoryId);
          }}
        />
      )}
    </>
  );
};
