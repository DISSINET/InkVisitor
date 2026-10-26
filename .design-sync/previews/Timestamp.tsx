import React from "react";
import { Timestamp } from "dissinet.ddb.client";

const Row: React.FC<{ children?: React.ReactNode }> = ({ children }) => (
  <div style={{ display: "flex", flexWrap: "wrap", gap: 12, alignItems: "center" }}>
    {children}
  </div>
);

// The capture harness freezes the clock at 2024-05-15T12:00 UTC, so relative
// ("ago") values below are chosen to resolve deterministically against that.
export const Stamp = () => (
  <Row>
    <Timestamp value="2024-05-10T09:15:00Z" format="stamp" />
  </Row>
);

export const Ago = () => (
  <Row>
    <Timestamp value="2024-05-14T08:00:00Z" format="ago" />
  </Row>
);

// "mixed" falls back to an absolute stamp once the value is older than
// agoThreshold (7 days by default) — a record from the Trent acta sits far
// past that, so it renders as a stamp even though format="mixed".
export const MixedRecentAndOld = () => (
  <Row>
    <Timestamp label="edited" value="2024-05-14T22:40:00Z" format="mixed" />
    <Timestamp label="created" value="1563-12-04T00:00:00Z" format="mixed" />
  </Row>
);

export const WithLabelAndCutSeconds = () => (
  <Row>
    <Timestamp label="from" value="2024-05-01T10:30:45Z" cutSeconds format="stamp" />
    <Timestamp label="to" value="2024-05-15T10:30:45Z" cutSeconds format="stamp" />
  </Row>
);

export const DateOnly = () => (
  <Row>
    <Timestamp value="1545-12-13T00:00:00Z" format="stamp" cutTime size="sm" />
  </Row>
);
