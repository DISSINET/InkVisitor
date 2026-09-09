import React from "react";
import { DatePicker } from "dissinet.ddb.client";

const Row: React.FC<{ children?: React.ReactNode }> = ({ children }) => (
  <div style={{ display: "flex", flexWrap: "wrap", gap: 12, alignItems: "center" }}>
    {children}
  </div>
);

export const DateValue = () => (
  <DatePicker type="date" value="1545-12-13" onChange={() => {}} />
);

export const DateTimeValue = () => (
  <DatePicker type="datetime-local" value="1563-12-04T09:30" onChange={() => {}} />
);

export const EmptyPlaceholder = () => (
  <DatePicker type="date" value="" placeholder="Select date" onChange={() => {}} />
);

export const ClearableAndDisabled = () => (
  <Row>
    <DatePicker type="date" value="1545-12-13" clearable onChange={() => {}} />
    <DatePicker type="date" value="1545-12-13" disabled onChange={() => {}} />
    <DatePicker type="date" value="1545-12-13" noBorder onChange={() => {}} />
  </Row>
);
