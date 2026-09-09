import React from "react";
import { Checkbox, IcoUser } from "dissinet.ddb.client";

const Row: React.FC<{ children?: React.ReactNode }> = ({ children }) => (
  <div style={{ display: "flex", flexWrap: "wrap", gap: 12, alignItems: "center" }}>
    {children}
  </div>
);

export const Default = () => (
  <Checkbox value={true} label="Council of Trent" onChangeFn={() => {}} />
);

export const States = () => (
  <Row>
    <Checkbox value={true} label="checked" onChangeFn={() => {}} />
    <Checkbox value={false} label="unchecked" onChangeFn={() => {}} />
    <Checkbox value={false} indeterminate label="partially selected" onChangeFn={() => {}} />
  </Row>
);

export const ColorVariants = () => (
  <Row>
    <Checkbox value={true} color="primary" label="primary" onChangeFn={() => {}} />
    <Checkbox value={true} color="success" label="success" onChangeFn={() => {}} />
    <Checkbox value={true} color="danger" label="danger" onChangeFn={() => {}} />
    <Checkbox value={true} color="danger" noFill label="no fill" onChangeFn={() => {}} />
  </Row>
);

export const IconOnly = () => (
  <Row>
    <Checkbox value={true} iconOnly icon={<IcoUser size={13} />} onChangeFn={() => {}} />
    <Checkbox
      value={false}
      iconOnly
      icon={<IcoUser size={13} />}
      tooltipLabel="you are not assigned to this resource"
      onChangeFn={() => {}}
    />
  </Row>
);
