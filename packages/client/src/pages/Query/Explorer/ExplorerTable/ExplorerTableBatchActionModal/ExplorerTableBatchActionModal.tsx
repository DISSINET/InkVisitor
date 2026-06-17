import { Explore } from "@inkvisitor/shared/types/query";
import React from "react";
import { BatchAction } from "../types";
import { BatchActionAddMetaprop } from "./BatchActionAddMetaprop";
import { BatchActionAddReference } from "./BatchActionAddReference";
import { BatchActionAddRelation } from "./BatchActionAddRelation";
interface ExplorerTableBatchActionModalProps {
  batchAction: BatchAction;
  selectedEntityIds: string[];
  columns: Explore.IExploreColumn[];
  onClose: () => void;
  onApplyAction: () => void;
}

export const ExplorerTableBatchActionModal: React.FC<
  ExplorerTableBatchActionModalProps
> = ({
  batchAction,
  selectedEntityIds,
  columns,
  onClose,
  onApplyAction,
}) => {
  const renderContent = () => {
    switch (batchAction) {
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
        return null;
    }
  };

  return <>{renderContent()}</>;
};
