import React from "react";
import {
  Header,
  Input,
  IconButton,
  IcoLogout,
  IcoSearch,
  IcoSettings,
  IcoUser,
  theme,
} from "dissinet.ddb.client";

// Header is two slots (left/right) filled by the page shell — in the app
// these are LeftHeader/RightHeader, which read redux for the logo, user name
// and env badge. The demos below fill the same slots with static content so
// the sheet does not depend on that state.

const Brand = () => (
  <div style={{ display: "flex", alignItems: "center", gap: 8, color: theme.color["white"], fontWeight: 700 }}>
    <span>InkVisitor</span>
    <span style={{ opacity: 0.6, fontWeight: 400, fontSize: theme.fontSize["xs"] }}>v3.2.0</span>
  </div>
);

const UserChip = () => (
  <div style={{ display: "flex", alignItems: "center", gap: 10, color: theme.color["white"] }}>
    <span>petr.nahak</span>
    <IconButton icon={<IcoLogout />} color="plain" inverted tooltipLabel="Log out" onClick={() => {}} />
  </div>
);

export const Default = () => <Header left={<Brand />} right={<UserChip />} color="primary" />;

export const WithSearch = () => (
  <Header
    color="muni"
    paddingX={10}
    left={<Input width={220} placeholder="Search entities…" onChangeFn={() => {}} />}
    right={
      <div style={{ display: "flex", gap: 6 }}>
        <IconButton icon={<IcoSettings />} color="plain" inverted tooltipLabel="Settings" onClick={() => {}} />
        <IconButton icon={<IcoUser />} color="plain" inverted tooltipLabel="Account" onClick={() => {}} />
      </div>
    }
  />
);

export const ColorVariants = () => (
  <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
    <Header left={<Brand />} right={<UserChip />} color="primary" />
    <Header left={<Brand />} right={<UserChip />} color="muni" />
    <Header left={<Brand />} right={<UserChip />} color="danger" />
    <Header left={<Brand />} right={<UserChip />} color="black" />
  </div>
);
