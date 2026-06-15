import React, { useState } from "react";
import { IEntity } from "@inkvisitor/shared/types";
import { Explore } from "@inkvisitor/shared/types/query";
import { Tooltip } from "components";
import { renderExploreColumnParamValue } from "./ExploreColumnParamValueRenderers";
import {
  StyledTooltipRow,
  StyledTooltipLabel,
  StyledTooltipValue,
} from "./ExploreTableHeaderTooltipStyles";

interface ExploreTableHeaderTooltipProps {
  column: Explore.IExploreColumn;
  entities?: Record<string, IEntity>;
  children: React.ReactNode;
}

export const ExploreTableHeaderTooltip: React.FC<
  ExploreTableHeaderTooltipProps
> = ({ column, entities, children }) => {
  const [referenceElement, setReferenceElement] =
    useState<HTMLSpanElement | null>(null);
  const [visible, setVisible] = useState(false);

  const config = Explore.EExploreColumnTypeConfig[column.type];
  const typeLabel = config.label;
  const description = config.description;
  const paramsDef = config.paramsDef ?? [];

  const paramRows: Array<{
    paramDef: Explore.IExploreColumnParamDef;
    content: React.ReactNode;
  }> = [];
  for (const paramDef of paramsDef) {
    const value = (column.params as Record<string, unknown>)[paramDef.id];
    if (value === undefined || value === null) continue;
    const content = renderExploreColumnParamValue({
      value,
      paramDef,
      entities,
    });
    if (content != null) paramRows.push({ paramDef, content });
  }

  const content = (
    <>
      <StyledTooltipRow>
        <StyledTooltipLabel>Type</StyledTooltipLabel>
        <StyledTooltipValue>{typeLabel}</StyledTooltipValue>
      </StyledTooltipRow>
      <StyledTooltipRow>
        <StyledTooltipValue $muted>{description}</StyledTooltipValue>
      </StyledTooltipRow>
      {paramRows.length > 0 && (
        <>
          <StyledTooltipRow $spacer />
          {paramRows.map(({ paramDef, content }) => (
            <StyledTooltipRow key={paramDef.id}>
              <StyledTooltipLabel>{paramDef.label}</StyledTooltipLabel>
              <StyledTooltipValue>{content}</StyledTooltipValue>
            </StyledTooltipRow>
          ))}
        </>
      )}
    </>
  );

  return (
    <>
      <span
        ref={setReferenceElement}
        onMouseEnter={() => setVisible(true)}
        onMouseLeave={() => setVisible(false)}
        style={{ cursor: "help" }}
      >
        {children}
      </span>
      <Tooltip
        visible={visible}
        referenceElement={referenceElement}
        content={content}
        position="bottom"
      />
    </>
  );
};
