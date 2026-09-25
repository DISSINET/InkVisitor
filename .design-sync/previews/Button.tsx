import React from "react";
import {
  Button,
  ButtonGroup,
  IcoCheck,
  IcoClose,
  IcoSearch,
  IcoTrash,
} from "dissinet.ddb.client";

export const Default = () => (
  <ButtonGroup>
    <Button label="Save" color="success" onClick={() => {}} />
    <Button label="Archive" color="greyer" onClick={() => {}} />
  </ButtonGroup>
);

export const Colors = () => (
  <ButtonGroup>
    <Button label="Primary" color="primary" onClick={() => {}} />
    <Button label="Success" color="success" onClick={() => {}} />
    <Button label="Warning" color="warning" onClick={() => {}} />
    <Button label="Danger" color="danger" onClick={() => {}} />
    <Button label="Info" color="info" onClick={() => {}} />
  </ButtonGroup>
);

// A labelled button keeps one text size across the scale and grows through
// padding; the icon glyph is sized in em, so icon-only buttons are where the
// size axis is actually visible.
// ButtonGroup stretches its children to one height, which would hide the
// size axis; the sweeps line buttons up on a plain centered row instead.
const SizeRow: React.FC<{ children?: React.ReactNode }> = ({ children }) => (
  <div style={{ display: "flex", gap: 8, alignItems: "center" }}>{children}</div>
);

export const Sizes = () => (
  <SizeRow>
    <Button size="S" label="Small" color="primary" onClick={() => {}} />
    <Button size="M" label="Medium" color="primary" onClick={() => {}} />
    <Button size="L" label="Large" color="primary" onClick={() => {}} />
    <Button size="XL" label="Extra large" color="primary" onClick={() => {}} />
  </SizeRow>
);

export const IconSizes = () => (
  <SizeRow>
    <Button size="S" shape="square" icon={<IcoSearch />} color="primary" onClick={() => {}} />
    <Button size="M" shape="square" icon={<IcoSearch />} color="primary" onClick={() => {}} />
    <Button size="L" shape="square" icon={<IcoSearch />} color="primary" onClick={() => {}} />
    <Button size="XL" shape="square" icon={<IcoSearch />} color="primary" onClick={() => {}} />
  </SizeRow>
);

export const WithIcons = () => (
  <ButtonGroup>
    <Button icon={<IcoSearch />} label="Search" color="primary" onClick={() => {}} />
    <Button icon={<IcoCheck />} label="Approve" color="success" onClick={() => {}} />
    <Button icon={<IcoTrash />} color="danger" tooltipLabel="Delete" onClick={() => {}} />
    <Button icon={<IcoClose />} color="danger" inverted noBackground onClick={() => {}} />
  </ButtonGroup>
);

export const Variants = () => (
  <ButtonGroup>
    <Button label="Filled" color="danger" onClick={() => {}} />
    <Button label="Inverted" color="danger" inverted onClick={() => {}} />
    <Button label="No border" color="danger" inverted noBorder onClick={() => {}} />
    <Button label="Disabled" color="danger" disabled onClick={() => {}} />
  </ButtonGroup>
);

export const Shapes = () => (
  <ButtonGroup>
    <Button label="Sharp" color="primary" shape="sharp" onClick={() => {}} />
    <Button label="Rounded" color="primary" shape="rounded-md" onClick={() => {}} />
    <Button label="Pill" color="primary" shape="rounded-full" onClick={() => {}} />
    <Button icon={<IcoCheck />} color="primary" shape="circle" onClick={() => {}} />
  </ButtonGroup>
);
