import { EntityEnums } from "@shared/enums";
import { IEntity } from "@shared/types";
import theme from "Theme/theme";
import { Button } from "components";
import { EntitySuggester, EntityTag } from "components/advanced";
import React, { useMemo, useState } from "react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import api from "api";
import { toast } from "react-toastify";

interface BatchActionAddReferenceProps {
  selectedEntities: IEntity[];
  onClose: () => void;
  onApply: () => void;
}

export const BatchActionAddReference: React.FC<
  BatchActionAddReferenceProps
> = ({ selectedEntities, onClose, onApply }) => {
  const [resourceEntity, setResourceEntity] = useState<IEntity | undefined>();
  const [valueEntity, setValueEntity] = useState<IEntity | undefined>();

  const queryClient = useQueryClient();

  const batchMutation = useMutation({
    mutationFn: async () => {
      if (!resourceEntity) return;
      const entityIds = selectedEntities.map((e) => e.id);
      return api.batchEntityAddReference(
        entityIds,
        resourceEntity.id,
        valueEntity?.id
      );
    },
    onSuccess: (res) => {
      toast.success(res?.data?.message || "Reference added");
      queryClient.invalidateQueries({ queryKey: ["query"] });
      onApply();
    },
    onError: () => {
      toast.error("Failed to add reference");
    },
  });

  const handleApply = () => {
    if (!resourceEntity) return;
    batchMutation.mutate();
  };

  const message = useMemo<string>(() => {
    const count = selectedEntities.length;
    const resLabel = resourceEntity?.labels[0];
    const valLabel = valueEntity?.labels[0];

    if (!resLabel) {
      return `Add a new reference to ${count} selected entities.`;
    }
    if (valLabel) {
      return `Add reference "${resLabel}" with value "${valLabel}" to ${count} selected entities.`;
    }
    return `Add reference "${resLabel}" to ${count} selected entities.`;
  }, [resourceEntity, valueEntity, selectedEntities]);

  const sectionStyle: React.CSSProperties = {
    display: "flex",
    flexDirection: "column",
    gap: "0.5rem",
    padding: "0.75rem",
    borderRadius: "4px",
    border: `1px solid ${theme.color.grey}`,
  };

  const labelStyle: React.CSSProperties = {
    fontSize: theme.fontSize.xs,
    fontWeight: theme.fontWeight.bold,
    color: theme.color.black,
  };

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: "1rem" }}>
      <div style={sectionStyle}>
        <span style={labelStyle}>Resource (required)</span>
        {resourceEntity ? (
          <EntityTag
            entity={resourceEntity}
            unlinkButton={{ onClick: () => setResourceEntity(undefined) }}
          />
        ) : (
          <EntitySuggester
            categoryTypes={[EntityEnums.Class.Resource]}
            onPicked={(entity) => setResourceEntity(entity)}
            placeholder="select resource..."
            inputWidth="full"
          />
        )}
      </div>

      <div style={sectionStyle}>
        <span style={labelStyle}>Value (optional)</span>
        {valueEntity ? (
          <EntityTag
            entity={valueEntity}
            unlinkButton={{ onClick: () => setValueEntity(undefined) }}
          />
        ) : (
          <EntitySuggester
            categoryTypes={[EntityEnums.Class.Value]}
            onPicked={(entity) => setValueEntity(entity)}
            placeholder="select value..."
            inputWidth="full"
          />
        )}
      </div>

      <label
        style={{
          fontSize: theme.fontSize.sm,
          color: theme.color.greyer,
          fontStyle: "italic",
        }}
      >
        {message}
      </label>

      <div
        style={{ display: "flex", gap: "0.5rem", justifyContent: "flex-end" }}
      >
        <Button label="Cancel" color="greyer" inverted onClick={onClose} />
        <Button
          label="Apply"
          color="primary"
          onClick={handleApply}
          disabled={!resourceEntity || batchMutation.isPending}
        />
      </div>
    </div>
  );
};
