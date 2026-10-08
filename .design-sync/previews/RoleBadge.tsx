import React from "react";
import { RoleBadge, UserEnums } from "dissinet.ddb.client";

const Row: React.FC<{ children?: React.ReactNode }> = ({ children }) => (
  <div style={{ display: "flex", flexWrap: "wrap", gap: 8, alignItems: "center" }}>
    {children}
  </div>
);

export const Default = () => <RoleBadge role={UserEnums.Role.Editor} />;

export const RoleSweep = () => (
  <Row>
    <RoleBadge role={UserEnums.Role.Owner} />
    <RoleBadge role={UserEnums.Role.Admin} />
    <RoleBadge role={UserEnums.Role.Editor} />
    <RoleBadge role={UserEnums.Role.Viewer} />
  </Row>
);
