import { Explore } from "@inkvisitor/shared/types/query";
import React from "react";
import { BatchAction } from "../types";
import { BatchActionAddMetaprop } from "./BatchActionAddMetaprop";
import { BatchActionAddReference } from "./BatchActionAddReference";
import { BatchActionAddRelation } from "./BatchActionAddRelation";
import { BatchActionExportCsv } from "./BatchActionExportTsv";

interface ExplorerTableBatchActionModalProps {
  batchAction: BatchAction;
  selectedEntityIds: string[];
  columns: Explore.IExploreColumn[];
  onClose: () => void;
  onExport: (selectedColumnIds: string[]) => void;
  onApplyAction: () => void;
}

export const ExplorerTableBatchActionModal: React.FC<ExplorerTableBatchActionModalProps> = ({
  batchAction,
  selectedEntityIds,
  columns,
  onClose,
  onExport,
  onApplyAction,
}) => {
  const renderContent = () => {
    switch (batchAction) {
      case BatchAction.export_tsv:
        return (
          <BatchActionExportCsv
            selectedEntityIds={selectedEntityIds}
            columns={columns}
            onExport={onExport}
            onClose={onClose}
          />
        );
      case BatchAction.add_metaprop:
        return (
          <BatchActionAddMetaprop
            selectedEntityIds={selectedEntityIds}
            onClose={onClose}
            onApply={onApplyAction}
          />
        );
      case BatchAction.add_reference:
        return (
          <BatchActionAddReference
            selectedEntityIds={selectedEntityIds}
            onClose={onClose}
            onApply={onApplyAction}
          />
        );
      case BatchAction.add_relation:
        return (
          <BatchActionAddRelation
            selectedEntityIds={selectedEntityIds}
            onClose={onClose}
            onApply={onApplyAction}
          />
        );
      case BatchAction.copy_uuids:
      case BatchAction.open_in_detail:
      default:
        return null;
    }
  };

  return <>{renderContent()}</>;
};
