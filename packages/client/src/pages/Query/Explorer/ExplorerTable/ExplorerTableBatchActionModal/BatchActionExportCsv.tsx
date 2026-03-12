import { IEntity } from "@shared/types";
import { Explore } from "@shared/types/query";
import React from "react";
import { Button } from "components";

interface BatchActionExportCsvProps {
  selectedEntities: IEntity[];
  columns: Explore.IExploreColumn[];
  onExport: () => void;
  onClose: () => void;
}

export const BatchActionExportCsv: React.FC<BatchActionExportCsvProps> = ({
  selectedEntities,
  columns,
  onExport,
  onClose,
}) => {
  const activeColumnNames = columns.map((c) => c.name);

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: "1rem" }}>
      <p>
        Export <b>{selectedEntities.length}</b> selected entities to a CSV file
        with the following active columns:
      </p>
      <ul style={{ margin: 0, paddingLeft: "1.5rem" }}>
        {activeColumnNames.map((name, i) => (
          <li key={i}>{name}</li>
        ))}
      </ul>
      <div style={{ display: "flex", gap: "0.5rem", justifyContent: "flex-end" }}>
        <Button label="Cancel" color="greyer" inverted onClick={onClose} />
        <Button label="Export" color="primary" onClick={onExport} />
      </div>
    </div>
  );
};
