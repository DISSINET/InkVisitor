import { Explore } from "@inkvisitor/shared/types/query";
import React from "react";
import { BatchAction } from "../types";
import { BatchActionAddMetaprop } from "./BatchActionAddMetaprop";
import { BatchActionAddReference } from "./BatchActionAddReference";
import { BatchActionAddRelation } from "./BatchActionAddRelation";
import { BatchActionExportCsv } from "./BatchActionExportTsv";
import { BatchActionReplaceMetaprop } from "./BatchActionReplaceMetaprop";
import { BatchActionReplaceRelation } from "./BatchActionReplaceRelation";
import { BatchActionSetLanguage } from "./BatchActionSetLanguage";
import { BatchActionSetPos } from "./BatchActionSetPos";

interface ExplorerTableBatchActionModalProps {
  batchAction: BatchAction;
  selectedEntityIds: string[];
  columns: Explore.IExploreColumn[];
  onClose: () => void;
  onExport: (selectedColumnIds: string[]) => void;
  onApplyAction: () => void;
  onClearSelection: () => void;
  /** replaces the selection with these ids */
  onSelectOnly: (ids: string[]) => void;
}

export const ExplorerTableBatchActionModal: React.FC<ExplorerTableBatchActionModalProps> = ({
  batchAction,
  selectedEntityIds,
  columns,
  onClose,
  onExport,
  onApplyAction,
  onClearSelection,
  onSelectOnly,
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
      case BatchAction.replace_relation:
        return (
          <BatchActionReplaceRelation
            selectedEntityIds={selectedEntityIds}
            onClose={onClose}
            onApply={onApplyAction}
            onClearSelection={onClearSelection}
          />
        );
      case BatchAction.replace_metaprop:
        return (
          <BatchActionReplaceMetaprop
            selectedEntityIds={selectedEntityIds}
            onClose={onClose}
            onApply={onApplyAction}
            onClearSelection={onClearSelection}
            onSelectOnly={onSelectOnly}
          />
        );
      case BatchAction.set_language:
        return (
          <BatchActionSetLanguage
            selectedEntityIds={selectedEntityIds}
            onClose={onClose}
            onApply={onApplyAction}
          />
        );
      case BatchAction.set_pos:
        return (
          <BatchActionSetPos
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
