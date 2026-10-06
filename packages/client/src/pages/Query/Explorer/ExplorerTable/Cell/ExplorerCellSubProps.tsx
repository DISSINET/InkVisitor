import { IEntity, IResponseQuerySubProp } from "@inkvisitor/shared/types";
import { EmptyEntityTag, EntityTag } from "components/advanced";
import React from "react";
import {
  StyledSubPropTree,
  StyledSubPropTreeRow,
  StyledValuesTree,
  StyledValueTree,
} from "./ExplorerCellSubPropsStyles";

type OnEntityDoubleClick = (entity: IEntity) => (e: React.MouseEvent) => void;

/** Tree tags in the tooltip: twice the default label cap (theme.space[30] = 75px). */
const TREE_TAG_MAX_WIDTH = 150;

interface TreeTag {
  entity?: IEntity;
  /** Label of the empty tag standing in for an unset entity. */
  emptyLabel: string;
  onEntityDoubleClick?: OnEntityDoubleClick;
}

const TreeTag: React.FC<TreeTag> = ({ entity, emptyLabel, onEntityDoubleClick }) =>
  entity ? (
    <EntityTag
      entity={entity}
      tagMaxWidth={TREE_TAG_MAX_WIDTH}
      tooltipPosition="bottom"
      onDoubleClick={onEntityDoubleClick?.(entity)}
    />
  ) : (
    <EmptyEntityTag label={emptyLabel} />
  );

interface ExplorerCellSubPropsTree {
  subProps: IResponseQuerySubProp[];
  onEntityDoubleClick?: OnEntityDoubleClick;
  /**
   * The rows are props of the type above them, so they show only the value
   * slot. Their own subproperties show both slots again.
   */
  valueOnly?: boolean;
}

/**
 * The subproperties as a tree, one per line, each level indented. Every row
 * shows its type and value slots, an unset one as an empty tag, the way the
 * statement list shows an empty prop.
 */
export const ExplorerCellSubPropsTree: React.FC<ExplorerCellSubPropsTree> = ({
  subProps,
  onEntityDoubleClick,
  valueOnly = false,
}) => (
  <StyledSubPropTree>
    {subProps.map((subProp, key) => (
      <React.Fragment key={key}>
        <StyledSubPropTreeRow>
          {!valueOnly && (
            <TreeTag
              entity={subProp.type}
              emptyLabel="type"
              onEntityDoubleClick={onEntityDoubleClick}
            />
          )}
          <TreeTag
            entity={subProp.value}
            emptyLabel="value"
            onEntityDoubleClick={onEntityDoubleClick}
          />
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
  /** The cell's entity: a property value, or a property type in a types column. */
  value: IEntity;
  subProps: IResponseQuerySubProp[];
  onEntityDoubleClick?: OnEntityDoubleClick;
  valueOnly?: boolean;
}

/** A cell entity with its full subproperty tree under it. */
export const ExplorerCellValueTree: React.FC<ExplorerCellValueTree> = ({
  value,
  subProps,
  onEntityDoubleClick,
  valueOnly,
}) => (
  <StyledValueTree data-no-row-click="true">
    <TreeTag entity={value} emptyLabel="value" onEntityDoubleClick={onEntityDoubleClick} />
    {subProps.length > 0 && (
      <ExplorerCellSubPropsTree
        subProps={subProps}
        onEntityDoubleClick={onEntityDoubleClick}
        valueOnly={valueOnly}
      />
    )}
  </StyledValueTree>
);

interface ExplorerCellValuesTree {
  values: IEntity[];
  /** Tree nodes by cell entity id; an entity without any shows as a lone tag. */
  subPropsByValue: Record<string, IResponseQuerySubProp[]>;
  onEntityDoubleClick?: OnEntityDoubleClick;
  /** The cell entities are property types and the first level their props. */
  valueOnly?: boolean;
}

/** Every entity of a cell, each with its full subproperty tree. */
export const ExplorerCellValuesTree: React.FC<ExplorerCellValuesTree> = ({
  values,
  subPropsByValue,
  onEntityDoubleClick,
  valueOnly,
}) => (
  <StyledValuesTree data-no-row-click="true">
    {values.map((value) => (
      <ExplorerCellValueTree
        key={value.id}
        value={value}
        subProps={subPropsByValue[value.id] ?? []}
        onEntityDoubleClick={onEntityDoubleClick}
        valueOnly={valueOnly}
      />
    ))}
  </StyledValuesTree>
);
