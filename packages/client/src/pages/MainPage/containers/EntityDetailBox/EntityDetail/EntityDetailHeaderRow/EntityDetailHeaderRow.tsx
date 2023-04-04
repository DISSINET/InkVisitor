import { EntityEnums, UserEnums } from "@shared/enums";
import { IEntity, IResponseTerritory, IStatement } from "@shared/types";
import api from "api";
import { Button, ButtonGroup } from "components";
import { AddTerritoryModal, EntityTag } from "components/advanced";
import { DEntity, InstTemplate } from "constructors";
import { useSearchParams } from "hooks";
import React, { useState } from "react";
import { CgListTree } from "react-icons/cg";
import { FaClone, FaEdit, FaTrashAlt } from "react-icons/fa";
import { GrClone } from "react-icons/gr";
import { useMutation, useQueryClient } from "react-query";
import { toast } from "react-toastify";
import {
  StyledActantHeaderRow,
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

  const duplicateEntityMutation = useMutation(
    async (newEntity: IEntity) => {
      await api.entityCreate(newEntity);
    },
    {
      onSuccess: (data, variables) => {
        appendDetailId(variables.id);
        toast.info(`Entity duplicated!`);
        queryClient.invalidateQueries("templates");
        if (variables.class === EntityEnums.Class.Territory) {
          queryClient.invalidateQueries("tree");
        }
      },
      onError: () => {
        toast.error(`Error: Entity not duplicated!`);
      },
    }
  );

  const duplicateEntity = (entityToDuplicate: IEntity) => {
    const newEntity = DEntity(
      entityToDuplicate,
      localStorage.getItem("userrole") as UserEnums.Role
    );

    duplicateEntityMutation.mutate(newEntity);
  };

  const instantiateTemplate = async (territoryParentId?: string) => {
    let newInstanceId;
    if (entity.class === EntityEnums.Class.Territory && territoryParentId) {
      newInstanceId = await InstTemplate(
        entity,
        localStorage.getItem("userrole") as UserEnums.Role,
        territoryParentId
      );
      setShowAddParentModal(false);
    } else {
      newInstanceId = await InstTemplate(
        entity,
        localStorage.getItem("userrole") as UserEnums.Role
      );
    }

    if (newInstanceId) {
      appendDetailId(newInstanceId);
      toast.info(`Entity instantiated from a template!`);

      if (entity.class === EntityEnums.Class.Statement) {
        toast.warning(`Statement created without territory!`);
      }
      if (entity.class === EntityEnums.Class.Territory) {
        queryClient.invalidateQueries("tree");
      }
    }
  };

  const [showAddParentModal, setShowAddParentModal] = useState(false);

  return (
    <>
      <StyledActantHeaderRow>
        <StyledTagWrap>
          <EntityTag entity={entity} tooltipText={entity.data.text} fullWidth />
        </StyledTagWrap>
        <ButtonGroup style={{ marginTop: "1rem" }}>
          {userCanEdit && (
            <Button
              color="primary"
              icon={<FaTrashAlt />}
              disabled={!mayBeRemoved}
              tooltipLabel={
                mayBeRemoved
                  ? "remove entity"
                  : "entity cannot be removed while it is linked elsewhere"
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
                key="instance-template"
                icon={<GrClone size={14} />}
                tooltipLabel="create entity from template"
                inverted
                color="primary"
                onClick={() => {
                  // instantiate entity
                  if (entity.class === EntityEnums.Class.Territory) {
                    // TODO: modal for choosing territory parent
                    setShowAddParentModal(true);
                    // } else if (entity.class === EntityEnums.Class.Statement) {
                    // TODO: modal for choosing territory for S
                  } else {
                    instantiateTemplate();
                  }
                }}
                // disabled={
                //   entity.class === EntityEnums.Class.Territory
                // }
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
                    duplicateEntity(entity);
                  }
                }}
              />
              <Button
                key="entity-create-template"
                icon={<GrClone size={14} />}
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
        </ButtonGroup>
      </StyledActantHeaderRow>

      {showAddParentModal && (
        <AddTerritoryModal
          onClose={() => setShowAddParentModal(false)}
          onSubmit={(territory: IResponseTerritory) => {
            instantiateTemplate(territory.id);
          }}
        />
      )}
    </>
  );
};
