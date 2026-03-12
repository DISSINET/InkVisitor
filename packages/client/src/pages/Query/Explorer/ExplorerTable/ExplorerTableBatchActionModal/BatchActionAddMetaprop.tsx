import { EntityEnums } from "@shared/enums";
import { IEntity } from "@shared/types";
import React, { useState } from "react";
import { Button } from "components";
import { EntitySuggester } from "components/advanced";

interface BatchActionAddMetapropProps {
  selectedEntities: IEntity[];
  onClose: () => void;
  onApply: () => void;
}

export const BatchActionAddMetaprop: React.FC<BatchActionAddMetapropProps> = ({
  selectedEntities,
  onClose,
  onApply,
}) => {
  const [typeEntity, setTypeEntity] = useState<IEntity | undefined>();
  const [valueEntity, setValueEntity] = useState<IEntity | undefined>();

  const handleApply = () => {
    if (!typeEntity) return;
    // TODO: implement mutation to add metaprop to all selected entities
    onApply();
  };

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: "1rem" }}>
      <p>
        Add a new metaproperty to <b>{selectedEntities.length}</b> selected
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
        <label>Type (required):</label>
        <EntitySuggester
          categoryTypes={[EntityEnums.Class.Concept]}
          onPicked={(entity) => setTypeEntity(entity)}
          placeholder="select metaprop type..."
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
          disabled={!typeEntity}
        />
      </div>
    </div>
  );
};
