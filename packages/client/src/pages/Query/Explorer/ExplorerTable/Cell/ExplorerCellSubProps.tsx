import { IEntity, IResponseQuerySubProp } from "@inkvisitor/shared/types";
import { EmptyEntityTag, EntityTag } from "components/advanced";
import React from "react";
import {
  StyledPropBlock,
  StyledPropsTree,
  StyledSubPropTree,
  StyledSubPropTreeRow,
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

interface PropRow {
  prop: IResponseQuerySubProp;
  onEntityDoubleClick?: OnEntityDoubleClick;
}

/**
 * One prop as its type and value slots, an unset one as an empty tag the way
 * the statement list shows an empty prop.
 */
const PropRow: React.FC<PropRow> = ({ prop, onEntityDoubleClick }) => (
  <StyledSubPropTreeRow>
    <TreeTag entity={prop.type} emptyLabel="type" onEntityDoubleClick={onEntityDoubleClick} />
    <TreeTag entity={prop.value} emptyLabel="value" onEntityDoubleClick={onEntityDoubleClick} />
  </StyledSubPropTreeRow>
);

interface ExplorerCellSubPropsTree {
  subProps: IResponseQuerySubProp[];
  onEntityDoubleClick?: OnEntityDoubleClick;
}

/** Subproperties one per line, each level indented behind a bar. */
export const ExplorerCellSubPropsTree: React.FC<ExplorerCellSubPropsTree> = ({
  subProps,
  onEntityDoubleClick,
}) => (
  <StyledSubPropTree>
    {subProps.map((subProp, key) => (
      <React.Fragment key={key}>
        <PropRow prop={subProp} onEntityDoubleClick={onEntityDoubleClick} />
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

interface ExplorerCellPropsTree {
  /** The cell's entities, in cell order: values, or types in a types column. */
  values: IEntity[];
  /** The first-level props under each cell entity, by its id. */
  propsByValue: Record<string, IResponseQuerySubProp[]>;
  onEntityDoubleClick?: OnEntityDoubleClick;
}

/**
 * The cell's first-level props in cell order, each as its type and value with
 * its subproperties under it. A cell entity without props shows as a lone tag.
 */
export const ExplorerCellPropsTree: React.FC<ExplorerCellPropsTree> = ({
  values,
  propsByValue,
  onEntityDoubleClick,
}) => (
  <StyledPropsTree data-no-row-click="true">
    {values.map((value) => {
      const props = propsByValue[value.id];
      if (!props?.length) {
        return (
          <TreeTag
            key={value.id}
            entity={value}
            emptyLabel="value"
            onEntityDoubleClick={onEntityDoubleClick}
          />
        );
      }
      return props.map((prop, key) => (
        <StyledPropBlock key={`${value.id}-${key}`}>
          <PropRow prop={prop} onEntityDoubleClick={onEntityDoubleClick} />
          {prop.children.length > 0 && (
            <ExplorerCellSubPropsTree
              subProps={prop.children}
              onEntityDoubleClick={onEntityDoubleClick}
            />
          )}
        </StyledPropBlock>
      ));
    })}
  </StyledPropsTree>
);
