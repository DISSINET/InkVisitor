import { IEntity } from "@shared/types";
import { Explore } from "@shared/types/query";
import React from "react";
import { BatchAction } from "../types";
import { BatchActionAddMetaprop } from "./BatchActionAddMetaprop";
import { BatchActionAddReference } from "./BatchActionAddReference";
import { BatchActionAddRelation } from "./BatchActionAddRelation";
import { BatchActionExportCsv } from "./BatchActionExportCsv";

interface ExplorerTableBatchActionModalProps {
  batchAction: BatchAction;
  selectedEntities: IEntity[];
  columns: Explore.IExploreColumn[];
  onClose: () => void;
  onExport: (selectedColumnIds: string[]) => void;
  onApplyAction: () => void;
}

export const ExplorerTableBatchActionModal: React.FC<
  ExplorerTableBatchActionModalProps
> = ({
  batchAction,
  selectedEntities,
  columns,
  onClose,
  onExport,
  onApplyAction,
}) => {
  const renderContent = () => {
    switch (batchAction) {
      case BatchAction.export_csv:
        return (
          <BatchActionExportCsv
            selectedEntities={selectedEntities}
            columns={columns}
            onExport={onExport}
            onClose={onClose}
          />
        );
      case BatchAction.add_metaprop:
        return (
          <BatchActionAddMetaprop
            selectedEntities={selectedEntities}
            onClose={onClose}
            onApply={onApplyAction}
          />
        );
      case BatchAction.add_reference:
        return (
          <BatchActionAddReference
            selectedEntities={selectedEntities}
            onClose={onClose}
            onApply={onApplyAction}
          />
        );
      case BatchAction.add_relation:
        return (
          <BatchActionAddRelation
            selectedEntities={selectedEntities}
            onClose={onClose}
            onApply={onApplyAction}
          />
        );
    }
  };

  return <>{renderContent()}</>;
};
