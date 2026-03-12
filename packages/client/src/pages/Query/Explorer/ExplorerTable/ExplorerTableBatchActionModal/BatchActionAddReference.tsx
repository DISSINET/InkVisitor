import { EntityEnums } from "@shared/enums";
import { IEntity } from "@shared/types";
import React, { useState } from "react";
import { Button } from "components";
import { EntitySuggester } from "components/advanced";

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

  const handleApply = () => {
    if (!resourceEntity) return;
    // TODO: implement mutation to add reference to all selected entities
    onApply();
  };

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: "1rem" }}>
      <p>
        Add a new reference to <b>{selectedEntities.length}</b> selected
        entities.
      </p>

      <div
        style={{
          display: "grid",
          gridTemplateColumns: "auto 1fr",
          gap: "0.75rem",
          alignItems: "center",
        }}
      >
        <label>Resource (required):</label>
        <EntitySuggester
          categoryTypes={[EntityEnums.Class.Resource]}
          onPicked={(entity) => setResourceEntity(entity)}
          placeholder="select resource..."
          inputWidth="full"
        />

        <label>Value (optional):</label>
        <EntitySuggester
          onPicked={(entity) => setValueEntity(entity)}
          placeholder="select value..."
          inputWidth="full"
        />
      </div>

      <div
        style={{ display: "flex", gap: "0.5rem", justifyContent: "flex-end" }}
      >
        <Button label="Cancel" color="greyer" inverted onClick={onClose} />
        <Button
          label="Apply"
          color="primary"
          onClick={handleApply}
          disabled={!resourceEntity}
        />
      </div>
    </div>
  );
};
