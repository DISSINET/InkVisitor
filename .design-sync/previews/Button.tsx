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
    <Button label="Cancel" color="greyer" onClick={() => {}} />
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
export const Sizes = () => (
  <ButtonGroup>
    <Button size="S" icon={<IcoSearch />} color="primary" onClick={() => {}} />
    <Button size="M" icon={<IcoSearch />} color="primary" onClick={() => {}} />
    <Button size="L" icon={<IcoSearch />} color="primary" onClick={() => {}} />
    <Button size="XL" icon={<IcoSearch />} color="primary" onClick={() => {}} />
  </ButtonGroup>
);

export const WithIcons = () => (
  <ButtonGroup>
    <Button icon={<IcoSearch />} label="Search" color="primary" onClick={() => {}} />
    <Button icon={<IcoCheck />} label="Approve" color="success" onClick={() => {}} />
    <Button icon={<IcoTrash />} color="danger" tooltipLabel="Delete" onClick={() => {}} />
    <Button icon={<IcoClose />} color="danger" noBackground onClick={() => {}} />
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
