import { IEntity, IResponseTerritory } from "@inkvisitor/shared/types";
import React from "react";
import { EntityTag } from "../../EntityTag/EntityTag";
import {
  StyledStatementTargetList,
  StyledStatementTargetNote,
  StyledStatementTargetOption,
  StyledStatementTargetSelector,
  StyledStatementTargetTitle,
} from "../styles";
import { AnnotatorPositionTNode } from "../types";

interface AnnotatorStatementTargetPicker {
  /** The in-document subT hierarchy, outermost first with nesting depth. */
  hierarchy: AnnotatorPositionTNode[];
  /** T currently opened in the Tree; offered as a flat option without hierarchy. */
  activeTerritoryId?: string;
  /** Whether the active T is already part of the hierarchy (skips the flat row). */
  activeTInHierarchy: boolean;
  entities: Record<string, IEntity | false>;
  territory?: IResponseTerritory;
  /** Currently selected target T id. */
  value?: string;
  onChange: (id: string) => void;
  title?: string;
}

/**
 * Reusable target-Territory picker for the Annotator: renders the in-document
 * subT hierarchy (the chain the selection sits inside) plus the active T (opened
 * in the Tree) as a separate flat option. Each row is selectable. Extracted so
 * the Statement-creation flow and a future Territory-creation flow can share it.
 */
export const AnnotatorStatementTargetPicker = ({
  hierarchy,
  activeTerritoryId,
  activeTInHierarchy,
  entities,
  territory,
  value,
  onChange,
  title = "create S in T",
}: AnnotatorStatementTargetPicker) => {
  const renderOption = (optionId: string, depth: number) => {
    const optionEntity =
      entities[optionId] || (optionId === activeTerritoryId ? territory : undefined);
    if (!optionEntity) {
      return null;
    }
    return (
      <StyledStatementTargetOption
        key={optionId}
        $isSelected={optionId === value}
        $depth={depth}
        onClick={() => onChange(optionId)}
      >
        <EntityTag
          fullWidth
          disableCopyToClipboard
          entity={optionEntity}
          disableDoubleClick
          disableDrag
        />
        {optionId === activeTerritoryId && (
          <StyledStatementTargetNote>T currently opened in Tree</StyledStatementTargetNote>
        )}
      </StyledStatementTargetOption>
    );
  };

  return (
    <StyledStatementTargetSelector>
      <StyledStatementTargetTitle>{title}</StyledStatementTargetTitle>
      <StyledStatementTargetList>
        {hierarchy.map((node) => renderOption(node.id, node.depth))}
        {!activeTInHierarchy && activeTerritoryId && renderOption(activeTerritoryId, 0)}
      </StyledStatementTargetList>
    </StyledStatementTargetSelector>
  );
};

export default AnnotatorStatementTargetPicker;
