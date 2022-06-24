import { EntityClass, UserRole } from "@shared/enums";
import { IEntity } from "@shared/types";
import api from "api";
import { ButtonGroup, Button } from "components";
import { DEntity } from "constructors";
import { useSearchParams } from "hooks";
import React from "react";
import { FaClone, FaTrashAlt, FaRecycle, FaEdit } from "react-icons/fa";
import { GrClone } from "react-icons/gr";
import { useMutation, useQueryClient } from "react-query";
import { toast } from "react-toastify";
import { EntityTag } from "../../EntityTag/EntityTag";
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
      },
      onError: () => {
        toast.error(`Error: Entity not duplicated!`);
      },
    }
  );

  const duplicateEntity = (entityToDuplicate: IEntity) => {
    const newEntity = DEntity(
      entityToDuplicate,
      localStorage.getItem("userrole") as UserRole
    );
    duplicateEntityMutation.mutate(newEntity);
  };

  return (
    <StyledActantHeaderRow>
      <StyledTagWrap>
        <EntityTag
          actant={entity}
          propId={entity.id}
          tooltipText={entity.data.text}
          fullWidth
        />
      </StyledTagWrap>
      <ButtonGroup style={{ marginTop: "1rem" }}>
        {entity.class !== EntityClass.Statement && userCanEdit && (
          <Button
            icon={<FaClone size={14} />}
            color="primary"
            label="duplicate"
            tooltip="duplicate entity"
            inverted
            onClick={() => {
              duplicateEntity(entity);
            }}
          />
        )}
        {mayBeRemoved && userCanEdit && (
          <Button
            color="primary"
            icon={<FaTrashAlt />}
            label="remove"
            tooltip="remove entity"
            inverted
            onClick={() => {
              setShowRemoveSubmit(true);
            }}
          />
        )}
        {userCanEdit && (
          <Button
            key="template"
            icon={<GrClone size={14} />}
            tooltip="create template from entity"
            inverted
            color="primary"
            label="Create template"
            onClick={() => {
              setCreateTemplateModal(true);
            }}
          />
        )}
        <Button
          key="refresh"
          icon={<FaRecycle size={14} />}
          tooltip="refresh data"
          inverted
          color="primary"
          label="refresh"
          onClick={() => {
            queryClient.invalidateQueries(["entity"]);
          }}
        />
        {entity.class === EntityClass.Statement && (
          <Button
            key="edit"
            icon={<FaEdit size={14} />}
            tooltip="open statement in editor"
            inverted={true}
            color="primary"
            label="open"
            onClick={() => {
              setStatementId(entity.id);
              setTerritoryId(entity.data.territory.id);
            }}
          />
        )}
      </ButtonGroup>
    </StyledActantHeaderRow>
  );
};
