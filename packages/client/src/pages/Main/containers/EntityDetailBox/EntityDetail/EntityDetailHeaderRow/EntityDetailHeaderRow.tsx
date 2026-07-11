import { EntityEnums, UserEnums } from "@inkvisitor/shared/enums";
import { getStoredUserId, getStoredUserRole, getStoredUsername } from "utils/userStorage";
import { IEntity, IResponseGeneric, IStatement } from "@inkvisitor/shared/types";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import api from "api";
import { Button, ButtonGroup } from "components";
import { AddTerritoryModal, EntityTag } from "components/advanced";
import { InstTemplate } from "constructors";
import { useSearchParams } from "hooks";
import React, { useState } from "react";
import { AiOutlineLink } from "react-icons/ai";
import { CgListTree } from "react-icons/cg";
import { FaClone, FaEdit } from "react-icons/fa";
import { IcoTrash } from "Theme/icons";
import { MdCleaningServices } from "react-icons/md";
import { toast } from "react-toastify";
import { setTreeInitialized } from "redux/features/territoryTree/treeInitializeSlice";
import { useAppDispatch } from "redux/hooks";
import { StyledActantHeaderRow, StyledGrClone, StyledTagWrap } from "./EntityDetailHeaderRowStyles";
import { ButtonSize } from "types";

interface EntityDetailHeaderRow {
  entity: IEntity;
  userCanEdit: boolean;
  userCanAdmin: boolean;
  mayBeRemoved?: boolean;
  setShowRemoveSubmit: React.Dispatch<React.SetStateAction<boolean>>;
  setCreateTemplateModal: React.Dispatch<React.SetStateAction<boolean>>;
  setIsCleaningEntityPrompt: React.Dispatch<React.SetStateAction<boolean>>;
  widthTooNarrow: boolean;
  hasWarnings: boolean;
}
export const EntityDetailHeaderRow: React.FC<EntityDetailHeaderRow> = ({
  entity,
  userCanEdit,
  userCanAdmin,
  mayBeRemoved,
  setShowRemoveSubmit,
  setCreateTemplateModal,
  setIsCleaningEntityPrompt,
  widthTooNarrow,
  hasWarnings,
}) => {
  const queryClient = useQueryClient();
  const dispatch = useAppDispatch();

  const { setStatementId, setTerritoryId, appendDetailId, setSelectedDetailId } = useSearchParams();

  const cloneEntityMutation = useMutation({
    mutationFn: async (entityId: string) => await api.entityClone(entityId),
    onSuccess: (data, variables) => {
      const clonedEntity = (data as any)?.data?.data;

      const clonedEntityId = clonedEntity?.id;
      const clonedEntityClass = clonedEntity?.class ?? entity.class;

      if (clonedEntityId) {
        appendDetailId(clonedEntityId);
        setSelectedDetailId(clonedEntityId);
      }
      toast.info(`Entity duplicated!`);
      queryClient.invalidateQueries({ queryKey: ["templates"] });
      if (clonedEntityClass === EntityEnums.Class.Territory) {
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
          getStoredUserRole() as UserEnums.Role,
          territoryParentId,
        );
        setShowAddParentModal(false);
      } else {
        toast.info("Cannot create territory without parent");
      }
    } else {
      newInstance = await InstTemplate(entity, getStoredUserRole() as UserEnums.Role);
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
      <StyledActantHeaderRow $widthTooNarrow={widthTooNarrow} $hasWarnings={hasWarnings}>
        <StyledTagWrap>
          <EntityTag entity={entity} fullWidth />
        </StyledTagWrap>
        <ButtonGroup $height={22.5} $disableShrink>
          {userCanEdit && (
            <Button
              key="delete-entity"
              size={ButtonSize.Medium}
              shape="square"
              color="primary"
              icon={<IcoTrash size={13} />}
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
          {userCanEdit && !!entity.isTemplate && (
            <>
              <Button
                key="template-create-template"
                size={ButtonSize.Medium}
                shape="square"
                icon={<FaClone size={13} />}
                tooltipLabel="create a new template from template"
                inverted
                color="primary"
                onClick={() => {
                  setCreateTemplateModal(true);
                }}
              />
              <Button
                key="instantiate-template"
                size={ButtonSize.Medium}
                shape="square"
                icon={<StyledGrClone size={13} $color={"black"} />}
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
                size={ButtonSize.Medium}
                shape="square"
                icon={<FaClone size={13} />}
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
                size={ButtonSize.Medium}
                shape="square"
                icon={<StyledGrClone size={13} $color={"black"} />}
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
              size={ButtonSize.Medium}
              shape="square"
              icon={<FaEdit size={14} />}
              tooltipLabel="open statement in editor"
              inverted
              color="primary"
              onClick={() => {
                setStatementId(entity.id);
                if (!entity.isTemplate && (entity as IStatement).data.territory?.territoryId) {
                  setTerritoryId(entity.data.territory.territoryId);
                }
              }}
            />
          )}
          {entity.class === EntityEnums.Class.Territory && (
            <Button
              key="open-territory"
              size={ButtonSize.Medium}
              shape="square"
              icon={<CgListTree size={14} />}
              tooltipLabel="open territory in tree"
              inverted
              color="primary"
              onClick={() => {
                // Reset so the tree re-runs its path expansion (and pagination
                // page selection) for the newly selected territory.
                dispatch(setTreeInitialized(false));
                setTerritoryId(entity.id);
              }}
              disabled={entity.isTemplate}
            />
          )}
          {userCanEdit && (
            <Button
              key="copy-link"
              size={ButtonSize.Medium}
              shape="square"
              color="primary"
              icon={<AiOutlineLink size={17} />}
              tooltipLabel={"copy link to detail"}
              inverted
              onClick={async () => {
                await navigator.clipboard.writeText(
                  `${window.location.protocol}//${window.location.host}${window.location.pathname}#selectedDetail=${entity.id}&detail=${entity.id}`,
                );
                toast.info("Link to detail copied to clipboard");
              }}
            />
          )}
          {userCanAdmin && (
            <Button
              key="clean-entity"
              size={ButtonSize.Medium}
              shape="square"
              color="primary"
              icon={<MdCleaningServices size={15} />}
              tooltipLabel="clean all entity details"
              inverted
              onClick={() => {
                setIsCleaningEntityPrompt(true);
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
