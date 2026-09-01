import React from "react";
import { IcoEdit, IcoSearch, IcoTrash, IconButton } from "dissinet.ddb.client";

const Row: React.FC<{ children?: React.ReactNode }> = ({ children }) => (
  <div style={{ display: "flex", flexWrap: "wrap", gap: 8, alignItems: "center" }}>
    {children}
  </div>
);

export const Default = () => (
  <IconButton icon={<IcoSearch />} color="primary" tooltipLabel="Search entities" onClick={() => {}} />
);

// The icon glyph is sized in em, so the size axis is only visible on
// icon-only buttons — unlike labelled Button, where size only changes padding.
export const Sizes = () => (
  <Row>
    <IconButton size="S" icon={<IcoSearch />} color="primary" onClick={() => {}} />
    <IconButton size="M" icon={<IcoSearch />} color="primary" onClick={() => {}} />
    <IconButton size="L" icon={<IcoSearch />} color="primary" onClick={() => {}} />
    <IconButton size="XL" icon={<IcoSearch />} color="primary" onClick={() => {}} />
  </Row>
);

export const Shapes = () => (
  <Row>
    <IconButton shape="square" icon={<IcoEdit />} color="info" onClick={() => {}} />
    <IconButton shape="circle" icon={<IcoEdit />} color="info" onClick={() => {}} />
    <IconButton shape="rounded-md" icon={<IcoEdit />} color="info" onClick={() => {}} />
    <IconButton shape="sharp" icon={<IcoEdit />} color="info" onClick={() => {}} />
  </Row>
);

export const NoBackground = () => (
  <IconButton
    icon={<IcoTrash />}
    color="danger"
    noBackground
    tooltipLabel="Remove statement"
    onClick={() => {}}
  />
);

export const Disabled = () => (
  <IconButton icon={<IcoTrash />} color="danger" disabled tooltipLabel="Remove statement" onClick={() => {}} />
);

// The noBackground hover tint held on while the dropdown the button owns is
// open, so it stays lit past the pointer leaving.
export const Active = () => (
  <IconButton icon={<IcoEdit />} color="primary" noBackground active onClick={() => {}} />
);
