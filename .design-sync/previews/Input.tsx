import React from "react";
import { Input, IcoSearch, IcoUser } from "dissinet.ddb.client";

const Row: React.FC<{ children?: React.ReactNode }> = ({ children }) => (
  <div style={{ display: "flex", flexWrap: "wrap", gap: 12, alignItems: "flex-start" }}>
    {children}
  </div>
);

export const Default = () => (
  <Input
    label="Label"
    value="Council of Trent"
    icon={<IcoSearch />}
    width={240}
    onChangeFn={() => {}}
  />
);

export const Textarea = () => (
  <Input
    label="Notes"
    type="textarea"
    value={"Council convened to address the challenges raised by the Reformation."}
    rows={3}
    width={280}
    onChangeFn={() => {}}
  />
);

export const Number = () => (
  <Input type="number" value="1545" width={120} min={1400} max={1700} onChangeFn={() => {}} />
);

export const Password = () => (
  <Input
    type="password"
    icon={<IcoUser />}
    placeholder="new password"
    value="●●●●●●●●●●"
    width={220}
    onChangeFn={() => {}}
  />
);

export const ClearableWithRightContent = () => (
  <Input
    label="Search users"
    value="Charles"
    icon={<IcoSearch />}
    clearable
    rightContent={<span style={{ fontSize: 11, opacity: 0.6 }}>3 results</span>}
    width={260}
    onChangeFn={() => {}}
  />
);

export const DisabledAndNoBorder = () => (
  <Row>
    <Input label="Disabled" value="Read-only value" disabled width={200} onChangeFn={() => {}} />
    <Input value="Inline field" noBorder width={200} onChangeFn={() => {}} />
  </Row>
);
