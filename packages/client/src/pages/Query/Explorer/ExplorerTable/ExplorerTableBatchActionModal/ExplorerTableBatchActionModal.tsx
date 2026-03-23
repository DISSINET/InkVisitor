import { IEntity } from "@shared/types";
import { Explore } from "@shared/types/query";
import React from "react";
import { Modal, ModalContent, ModalHeader } from "components";
import { BatchAction } from "../types";
import { BatchActionExportCsv } from "./BatchActionExportCsv";
import { BatchActionAddMetaprop } from "./BatchActionAddMetaprop";
import { BatchActionAddReference } from "./BatchActionAddReference";
import { BatchActionAddRelation } from "./BatchActionAddRelation";

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
  const titleMap: Record<BatchAction, string> = {
    [BatchAction.export_csv]: "Export as CSV",
    [BatchAction.add_metaprop]: "Add Metaproperty",
    [BatchAction.add_reference]: "Add Reference",
    [BatchAction.add_relation]: "Add Relation",
  };

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
