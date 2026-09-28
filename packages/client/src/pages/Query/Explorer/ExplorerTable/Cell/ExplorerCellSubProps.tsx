import { IEntity, IResponseQuerySubProp } from "@inkvisitor/shared/types";
import { EntityTag } from "components/advanced";
import React from "react";
import {
  StyledSubProp,
  StyledSubPropGroup,
  StyledSubPropLevel,
  StyledSubPropTree,
  StyledSubPropTreeLevel,
  StyledSubPropTreeRow,
  StyledValueTree,
} from "./ExplorerCellSubPropsStyles";

interface ExplorerCellSubProps {
  subProps: IResponseQuerySubProp[];
  onEntityDoubleClick?: (entity: IEntity) => (e: React.MouseEvent) => void;
  /** Prop level of these subproperties; the property value itself is the 1st. */
  level?: number;
}

/** Tree tags in the tooltip: twice the default label cap (theme.space[30] = 75px). */
const TREE_TAG_MAX_WIDTH = 150;

export const subPropLevelLabel =(level: number): string =>
  level === 2 ? "2nd" : level === 3 ? "3rd" : `${level}th`;

/** Type and value tags of the subproperties nested under one property value. */
export const ExplorerCellSubProps: React.FC<ExplorerCellSubProps> = ({
  subProps,
  onEntityDoubleClick,
  level = 2,
}) => (
  <StyledSubPropGroup data-no-row-click="true">
    <StyledSubPropLevel>{subPropLevelLabel(level)}</StyledSubPropLevel>
    {subProps.map((subProp, key) => (
      <StyledSubProp key={key}>
        {subProp.type && (
          <EntityTag entity={subProp.type} onDoubleClick={onEntityDoubleClick?.(subProp.type)} />
        )}
        {subProp.value && (
          <EntityTag entity={subProp.value} onDoubleClick={onEntityDoubleClick?.(subProp.value)} />
        )}
        {subProp.children.length > 0 && (
          <ExplorerCellSubProps
            subProps={subProp.children}
            onEntityDoubleClick={onEntityDoubleClick}
            level={level + 1}
          />
        )}
      </StyledSubProp>
    ))}
  </StyledSubPropGroup>
);

/** The subproperties as an indented tree, one per line with its level. */
export const ExplorerCellSubPropsTree: React.FC<ExplorerCellSubProps> = ({
  subProps,
  onEntityDoubleClick,
  level = 2,
}) => (
  <StyledSubPropTree>
    {subProps.map((subProp, key) => (
      <React.Fragment key={key}>
        <StyledSubPropTreeRow>
          <StyledSubPropTreeLevel>{subPropLevelLabel(level)}</StyledSubPropTreeLevel>
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
            level={level + 1}
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
    <ExplorerCellSubPropsTree subProps={subProps} onEntityDoubleClick={onEntityDoubleClick} />
  </StyledValueTree>
);
