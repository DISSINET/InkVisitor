import React from "react";
import { Loader, theme } from "dissinet.ddb.client";

const Row: React.FC<{ children?: React.ReactNode }> = ({ children }) => (
  <div style={{ display: "flex", flexWrap: "wrap", gap: 24, alignItems: "center" }}>
    {children}
  </div>
);

// Loader positions itself absolute, height/width 100%, over its nearest
// positioned ancestor — it needs one with real dimensions to be visible.
const Panel: React.FC<{ children?: React.ReactNode; height?: number }> = ({
  children,
  height = 140,
}) => (
  <div
    style={{
      position: "relative",
      width: 220,
      height,
      border: `1px solid ${theme.color.grey}`,
      borderRadius: theme.borderRadius.default,
    }}
  >
    {children}
  </div>
);

export const Default = () => (
  <Panel>
    <Loader show />
  </Panel>
);

export const Beat = () => (
  <Panel>
    <Loader show loaderStyle="beat" color="info" />
  </Panel>
);

export const NoBackground = () => (
  <Panel height={64}>
    <Loader show noBackground size={20} color="primary" />
  </Panel>
);

export const Sizes = () => (
  <Row>
    <Panel height={72}>
      <Loader show noBackground size={14} />
    </Panel>
    <Panel height={72}>
      <Loader show noBackground size={28} />
    </Panel>
    <Panel height={72}>
      <Loader show noBackground size={48} />
    </Panel>
  </Row>
);
