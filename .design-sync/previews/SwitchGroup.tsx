import React from "react";
import { Button, SwitchGroup } from "dissinet.ddb.client";

// Segments in a SwitchGroup must render transparent so the sliding pill shows
// through — noBorder + noBackground + inverted, with the active segment's
// label switched to white so it reads over the pill.
const periods = ["all", "year", "month", "week", "custom"];

export const Default = () => (
  <SwitchGroup activeIndex={2}>
    {periods.map((period, i) => (
      <Button
        key={period}
        label={period}
        shape="rounded-sm"
        size="M"
        noBorder
        inverted
        noBackground
        color={i === 2 ? "primary" : "greyer"}
        textColor={i === 2 ? "white" : undefined}
        noHoverBackground={i === 2}
        onClick={() => {}}
      />
    ))}
  </SwitchGroup>
);

const timeUnits = ["day", "week", "month", "year"];

export const Column = () => (
  <SwitchGroup $column activeIndex={1}>
    {timeUnits.map((unit, i) => (
      <Button
        key={unit}
        label={unit}
        shape="rounded-sm"
        size="S"
        noBorder
        inverted
        noBackground
        color={i === 1 ? "primary" : "greyer"}
        textColor={i === 1 ? "white" : undefined}
        noHoverBackground={i === 1}
        onClick={() => {}}
      />
    ))}
  </SwitchGroup>
);

const aggregations = ["sum", "count", "average"];

export const CustomPillColor = () => (
  <SwitchGroup activeIndex={0} pillColor="success">
    {aggregations.map((agg, i) => (
      <Button
        key={agg}
        label={agg}
        shape="rounded-sm"
        size="M"
        noBorder
        inverted
        noBackground
        color={i === 0 ? "success" : "greyer"}
        textColor={i === 0 ? "white" : undefined}
        noHoverBackground={i === 0}
        onClick={() => {}}
      />
    ))}
  </SwitchGroup>
);

export const BorderedOnLightBackground = () => (
  <SwitchGroup activeIndex={1} $bgColor="transparent" $borderColor="greyer">
    {periods.slice(0, 3).map((period, i) => (
      <Button
        key={period}
        label={period}
        shape="rounded-sm"
        size="M"
        noBorder
        inverted
        noBackground
        color={i === 1 ? "primary" : "greyer"}
        textColor={i === 1 ? "white" : undefined}
        noHoverBackground={i === 1}
        onClick={() => {}}
      />
    ))}
  </SwitchGroup>
);
