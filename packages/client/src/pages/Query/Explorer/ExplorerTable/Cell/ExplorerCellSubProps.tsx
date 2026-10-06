import { IEntity, IResponseQuerySubProp } from "@inkvisitor/shared/types";
import { EntityTag } from "components/advanced";
import React from "react";
import {
  StyledSubPropTree,
  StyledSubPropTreeRow,
  StyledValuesTree,
  StyledValueTree,
} from "./ExplorerCellSubPropsStyles";

interface ExplorerCellSubPropsTree {
  subProps: IResponseQuerySubProp[];
  onEntityDoubleClick?: (entity: IEntity) => (e: React.MouseEvent) => void;
}

/** Tree tags in the tooltip: twice the default label cap (theme.space[30] = 75px). */
const TREE_TAG_MAX_WIDTH = 150;

/** The subproperties as a tree, one per line, each level indented. */
export const ExplorerCellSubPropsTree: React.FC<ExplorerCellSubPropsTree> = ({
  subProps,
  onEntityDoubleClick,
}) => (
  <StyledSubPropTree>
    {subProps.map((subProp, key) => (
      <React.Fragment key={key}>
        <StyledSubPropTreeRow>
          {subProp.type && (
            <EntityTag
              entity={subProp.type}
              tagMaxWidth={TREE_TAG_MAX_WIDTH}
              tooltipPosition="bottom"
              onDoubleClick={onEntityDoubleClick?.(subProp.type)}
            />
          )}
          {subProp.value && (
            <EntityTag
              entity={subProp.value}
              tagMaxWidth={TREE_TAG_MAX_WIDTH}
              tooltipPosition="bottom"
              onDoubleClick={onEntityDoubleClick?.(subProp.value)}
            />
          )}
        </StyledSubPropTreeRow>
        {subProp.children.length > 0 && (
          <ExplorerCellSubPropsTree
            subProps={subProp.children}
            onEntityDoubleClick={onEntityDoubleClick}
          />
        )}
      </React.Fragment>
    ))}
  </StyledSubPropTree>
);

interface ExplorerCellValueTree {
  value: IEntity;
  subProps: IResponseQuerySubProp[];
  onEntityDoubleClick?: (entity: IEntity) => (e: React.MouseEvent) => void;
}

/** A property value with its full subproperty tree under it. */
export const ExplorerCellValueTree: React.FC<ExplorerCellValueTree> = ({
  value,
  subProps,
  onEntityDoubleClick,
}) => (
  <StyledValueTree data-no-row-click="true">
    <EntityTag
      entity={value}
      tagMaxWidth={TREE_TAG_MAX_WIDTH}
      tooltipPosition="bottom"
      onDoubleClick={onEntityDoubleClick?.(value)}
    />
    {subProps.length > 0 && (
      <ExplorerCellSubPropsTree subProps={subProps} onEntityDoubleClick={onEntityDoubleClick} />
    )}
  </StyledValueTree>
);

interface ExplorerCellValuesTree {
  values: IEntity[];
  /** Subproperties by value entity id; values without any show as a lone tag. */
  subPropsByValue: Record<string, IResponseQuerySubProp[]>;
  onEntityDoubleClick?: (entity: IEntity) => (e: React.MouseEvent) => void;
}

/** Every value of a cell, each with its full subproperty tree. */
export const ExplorerCellValuesTree: React.FC<ExplorerCellValuesTree> = ({
  values,
  subPropsByValue,
  onEntityDoubleClick,
}) => (
  <StyledValuesTree data-no-row-click="true">
    {values.map((value) => (
      <ExplorerCellValueTree
        key={value.id}
        value={value}
        subProps={subPropsByValue[value.id] ?? []}
        onEntityDoubleClick={onEntityDoubleClick}
      />
    ))}
  </StyledValuesTree>
);
