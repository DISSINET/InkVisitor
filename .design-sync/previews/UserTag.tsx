import React from "react";
import { UserTag, theme } from "dissinet.ddb.client";

// UserTag resolves its label from a react-query lookup by userId; there is no
// backend behind this preview, so the lookup never resolves and the tag falls
// back to rendering the id string itself as the label (see getUserLabel).
// disableFetch skips the doomed request instead of leaving it pending.
const Row: React.FC<{ children?: React.ReactNode }> = ({ children }) => (
  <div style={{ display: "flex", flexWrap: "wrap", gap: 8, alignItems: "center" }}>
    {children}
  </div>
);

export const Default = () => <UserTag userId="Vittoria Colonna" disableFetch />;

export const VariantSweep = () => (
  <Row>
    <UserTag userId="Vittoria Colonna" variant="filled" disableFetch />
    <UserTag userId="Vittoria Colonna" variant="bordered" disableFetch />
    <UserTag userId="Vittoria Colonna" variant="light" disableFetch />
    <UserTag userId="Vittoria Colonna" variant="transparent" disableFetch />
  </Row>
);

// "dark" and "bright" paint fixed, untheming colors rather than reading the
// current theme, so a caller places them on the surface they were built for:
// "dark" reads fine straight on the page, "bright" needs a dark surface
// under it to be legible.
export const DarkAndBright = () => (
  <Row>
    <UserTag userId="Reginald Pole" variant="dark" disableFetch />
    <div style={{ background: theme.color.primary, borderRadius: 6, padding: 6, display: "flex" }}>
      <UserTag userId="Reginald Pole" variant="bright" disableFetch />
    </div>
  </Row>
);

export const SizeSweep = () => (
  <Row>
    <UserTag userId="Marcello Cervini" size="S" disableFetch />
    <UserTag userId="Marcello Cervini" size="M" disableFetch />
    <UserTag userId="Marcello Cervini" size="L" disableFetch />
    <UserTag userId="Marcello Cervini" size="XL" disableFetch />
  </Row>
);

export const ShowOnly = () => (
  <Row>
    <UserTag userId="Vittoria Colonna" showOnly="tag" disableFetch />
    <UserTag userId="Vittoria Colonna" showOnly="label" disableFetch />
  </Row>
);
