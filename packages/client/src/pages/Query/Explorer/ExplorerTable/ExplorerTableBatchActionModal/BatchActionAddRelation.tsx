import { EntityEnums, RelationEnums } from "@shared/enums";
import { IEntity } from "@shared/types";
import React, { useState } from "react";
import { Button } from "components";
import Dropdown, { EntitySuggester } from "components/advanced";

interface BatchActionAddRelationProps {
  selectedEntities: IEntity[];
  onClose: () => void;
  onApply: () => void;
}

export const BatchActionAddRelation: React.FC<BatchActionAddRelationProps> = ({
  selectedEntities,
  onClose,
  onApply,
}) => {
  const [relationType, setRelationType] = useState<RelationEnums.Type>(
    RelationEnums.AllTypes[0]
  );
  const [targetEntity, setTargetEntity] = useState<IEntity | undefined>();

  const handleApply = () => {
    if (!relationType || !targetEntity) return;
    // TODO: implement mutation to add relation to all selected entities
    onApply();
  };

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: "1rem" }}>
      <p>
        Add a new relation to <b>{selectedEntities.length}</b> selected
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
        <label>Relation type:</label>
        <div>
          {/* TODO: populate with actual relation types from the system */}
          <Dropdown.Single.Basic
            value={relationType}
            options={RelationEnums.BatchTypes.map((type) => ({
              value: type,
              label: type,
            }))}
            onChange={(selectedOption) => setRelationType(selectedOption)}
            placeholder="select relation type..."
            width="full"
          />
        </div>

        <label>Target entity:</label>
        <div>
          {/* TODO: filter valid/invalid entities based on selected relation type */}
          <EntitySuggester
            onPicked={(entity) => setTargetEntity(entity)}
            placeholder="select target entity..."
            inputWidth="full"
            disabled={!relationType}
          />
        </div>
      </div>

      {relationType && (
        <p style={{ fontSize: "0.85rem", opacity: 0.7 }}>
          Valid and invalid entity types for this relation will be displayed
          once relation type validation is implemented.
        </p>
      )}

      <div
        style={{ display: "flex", gap: "0.5rem", justifyContent: "flex-end" }}
      >
        <Button label="Cancel" color="greyer" inverted onClick={onClose} />
        <Button
          label="Apply"
          color="primary"
          onClick={handleApply}
          disabled={!relationType || !targetEntity}
        />
      </div>
    </div>
  );
};
