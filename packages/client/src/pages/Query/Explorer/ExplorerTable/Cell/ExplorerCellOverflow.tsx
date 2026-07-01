import { IEntity, IUser } from "@inkvisitor/shared/types";
import { Tooltip } from "components";
import { EntityTag } from "components/advanced";
import { useTheme } from "hooks";
import { StyledDots } from "pages/Main/containers/StatementsListBox/StatementListBoxStyles";
import React, { useState } from "react";
import { getEntityLabel } from "utils/utils";
import { StyledTooltipRow, StyledTooltipValue } from "../Header/ExploreTableHeaderTooltipStyles";
import {
  StyledOverflowTextList,
  StyledOverflowTooltipContent,
} from "./ExplorerCellOverflowStyles";

export const CELL_DISPLAY_LIMIT = 2;

type CellOverflowItem = IEntity | IUser | string | number;

function isEntity(item: CellOverflowItem): item is IEntity {
  return typeof (item as IEntity)?.class !== "undefined";
}

function isUser(item: CellOverflowItem): item is IUser {
  return typeof (item as IUser)?.email !== "undefined";
}

function getOverflowItemLabel(item: CellOverflowItem): string {
  if (isEntity(item)) {
    return getEntityLabel(item);
  }
  if (isUser(item)) {
    return item.email;
  }
  return String(item);
}

interface ExplorerCellOverflowProps {
  hiddenItems: CellOverflowItem[];
}

export const ExplorerCellOverflow: React.FC<ExplorerCellOverflowProps> = ({ hiddenItems }) => {
  const theme = useTheme();
  const [showTooltip, setShowTooltip] = useState(false);
  const [referenceElement, setReferenceElement] = useState<HTMLSpanElement | null>(null);

  if (hiddenItems.length === 0) {
    return null;
  }

  const allEntities = hiddenItems.every(isEntity);

  const content = allEntities ? (
    <StyledOverflowTooltipContent>
      {hiddenItems.map((entity, key) => (
        <EntityTag key={entity.id ?? key} entity={entity} tooltipPosition="bottom" />
      ))}
    </StyledOverflowTooltipContent>
  ) : (
    <StyledOverflowTextList>
      {hiddenItems.map((item, key) => (
        <StyledTooltipRow key={isEntity(item) ? item.id : key}>
          <StyledTooltipValue>{getOverflowItemLabel(item)}</StyledTooltipValue>
        </StyledTooltipRow>
      ))}
    </StyledOverflowTextList>
  );

  return (
    <>
      <Tooltip
        visible={showTooltip}
        referenceElement={referenceElement}
        offsetY={-14}
        position="right"
        color="success"
        noArrow
        tagGroup={allEntities}
        onMouseLeave={() => setShowTooltip(false)}
        content={content}
      />
      <StyledDots
        as="span"
        ref={setReferenceElement}
        data-no-row-click="true"
        style={{ color: theme.color.primary }}
        onMouseEnter={() => setShowTooltip(true)}
      >
        ...
      </StyledDots>
    </>
  );
};
