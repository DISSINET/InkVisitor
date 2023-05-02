import React from "react";
import { AttributeData } from "types";
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

interface TooltipAttributes {
  data: AttributeData;
}
export const TooltipAttributes: React.FC<TooltipAttributes> = ({ data }) => {
  return (
    <div>
      <TooltipAttributeRow
        key="elvl"
        attributeName="elvl"
        value={data.elvl}
        items={elvlDict}
      />
      <TooltipAttributeRow
        key="logic"
        attributeName="logic"
        value={data.logic}
        items={logicDict}
      />
      <TooltipAttributeRow
        key="mood"
        attributeName="mood"
        value={data.mood}
        items={moodDict}
      />
      <TooltipAttributeRow
        key="moodvariant"
        attributeName="moodvariant"
        value={data.moodvariant}
        items={moodVariantsDict}
      />
      <TooltipAttributeRow
        key="virtuality"
        attributeName="virtuality"
        value={data.virtuality}
        items={virtualityDict}
      />
      <TooltipAttributeRow
        key="partitivity"
        attributeName="partitivity"
        value={data.partitivity}
        items={partitivityDict}
      />
      <TooltipAttributeRow
        key="bundleOperator"
        attributeName="bundleOperator"
        value={data.bundleOperator}
        items={operatorDict}
      />
      <TooltipBooleanRow
        key="bundleStart"
        attributeName="bundleStart"
        label="bundle start"
        show={data.bundleStart ? data.bundleStart : false}
      />
      <TooltipBooleanRow
        key="bundleEnd"
        attributeName="bundleEnd"
        label="bundle end"
        show={data.bundleEnd ? data.bundleEnd : false}
      />
      <TooltipAttributeRow
        key="certainty"
        attributeName="certainty"
        value={data.certainty}
        items={certaintyDict}
      />
    </div>
  );
};
