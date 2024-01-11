import React from "react";
import {
  StyledTooltipGrid,
  StyledTooltipHeading,
} from "./TooltipAttributesStyles";
import {
  AttributeData,
  PropAttributeFilter,
  PropAttributeGroupDataObject,
  PropAttributeName,
} from "types";
import { TooltipAttributeRow } from "./TooltipAttributeRow/TooltipAttributeRow";
import {
  elvlDict,
  logicDict,
  moodDict,
  moodVariantsDict,
  virtualityDict,
  partitivityDict,
  operatorDict,
  certaintyDict,
} from "@shared/dictionaries";
import { TooltipBooleanRow } from "./TooltipBooleanRow/TooltipBooleanRow";

interface TooltipAttributesGroup {
  data: PropAttributeGroupDataObject;
  disabledAttributes?: PropAttributeFilter;
}
export const TooltipAttributesGroup: React.FC<TooltipAttributesGroup> = ({
  data,
  disabledAttributes,
}) => {
  const getTooltipColumn = (
    data: AttributeData,
    disabledAttributes: PropAttributeName[] | undefined
  ) => {
    const disabledAttributesVal = disabledAttributes || [];
    return (
      <div>
        {data.elvl && !disabledAttributesVal?.includes("elvl") && (
          <TooltipAttributeRow
            key="elvl"
            attributeName="elvl"
            value={data.elvl}
            items={elvlDict}
          />
        )}
        {data.logic && !disabledAttributesVal?.includes("logic") && (
          <TooltipAttributeRow
            key="logic"
            attributeName="logic"
            value={data.logic}
            items={logicDict}
          />
        )}
        {data.mood && !disabledAttributesVal?.includes("mood") && (
          <TooltipAttributeRow
            key="mood"
            attributeName="mood"
            value={data.mood}
            items={moodDict}
          />
        )}
        {data.moodvariant &&
          !disabledAttributesVal?.includes("moodvariant") && (
            <TooltipAttributeRow
              key="moodvariant"
              attributeName="moodvariant"
              value={data.moodvariant}
              items={moodVariantsDict}
            />
          )}
        {data.virtuality && !disabledAttributesVal?.includes("virtuality") && (
          <TooltipAttributeRow
            key="virtuality"
            attributeName="virtuality"
            value={data.virtuality}
            items={virtualityDict}
          />
        )}
        {data.partitivity &&
          !disabledAttributesVal?.includes("partitivity") && (
            <TooltipAttributeRow
              key="partitivity"
              attributeName="partitivity"
              value={data.partitivity}
              items={partitivityDict}
            />
          )}
        {data.bundleOperator &&
          !disabledAttributesVal?.includes("bundleOperator") && (
            <TooltipAttributeRow
              key="bundleOperator"
              attributeName="bundleOperator"
              value={data.bundleOperator}
              items={operatorDict}
            />
          )}
        {data.bundleStart &&
          !disabledAttributesVal?.includes("bundleStart") && (
            <TooltipBooleanRow
              key="bundleStart"
              attributeName="bundleStart"
              label="bundle start"
              show={data.bundleStart ? data.bundleStart : false}
            />
          )}
        {data.bundleEnd && !disabledAttributesVal?.includes("bundleEnd") && (
          <TooltipBooleanRow
            key="bundleEnd"
            attributeName="bundleEnd"
            label="bundle end"
            show={data.bundleEnd ? data.bundleEnd : false}
          />
        )}
        {data.certainty && !disabledAttributesVal?.includes("certainty") && (
          <TooltipAttributeRow
            key="certainty"
            attributeName="certainty"
            value={data.certainty}
            items={certaintyDict}
          />
        )}
      </div>
    );
  };

  return (
    <StyledTooltipGrid>
      <div>
        <StyledTooltipHeading>Statement</StyledTooltipHeading>
        {getTooltipColumn(data.statement, disabledAttributes?.statement)}
      </div>
      <div>
        <StyledTooltipHeading>Type</StyledTooltipHeading>
        {getTooltipColumn(data.type, disabledAttributes?.type)}
      </div>
      <div>
        <StyledTooltipHeading>Value</StyledTooltipHeading>
        {getTooltipColumn(data.value, disabledAttributes?.value)}
      </div>
    </StyledTooltipGrid>
  );
};
