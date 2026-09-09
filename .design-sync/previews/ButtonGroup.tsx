import React from "react";
import {
  Button,
  ButtonGroup,
  CancelButton,
  IcoSearch,
  IcoTrash,
  theme,
} from "dissinet.ddb.client";

// The default gap: a modal footer, the group's most common home.
export const Default = () => (
  <ButtonGroup>
    <CancelButton onClick={() => {}} />
    <Button label="Apply" color="primary" onClick={() => {}} />
  </ButtonGroup>
);

const Row: React.FC<{ children?: React.ReactNode }> = ({ children }) => (
  <div style={{ display: "flex", flexWrap: "wrap", gap: 24, alignItems: "flex-start" }}>
    {children}
  </div>
);

export const Gaps = () => (
  <Row>
    <ButtonGroup $gap="no">
      <Button label="Save" color="primary" onClick={() => {}} />
      <Button label="Cancel" color="greyer" onClick={() => {}} />
    </ButtonGroup>
    <ButtonGroup $gap="small">
      <Button label="Save" color="primary" onClick={() => {}} />
      <Button label="Cancel" color="greyer" onClick={() => {}} />
    </ButtonGroup>
    <ButtonGroup $gap="large">
      <Button label="Save" color="primary" onClick={() => {}} />
      <Button label="Cancel" color="greyer" onClick={() => {}} />
    </ButtonGroup>
  </Row>
);

export const Column = () => (
  <ButtonGroup $column $gap="small">
    <Button icon={<IcoSearch />} label="Find territory" color="primary" onClick={() => {}} />
    <Button icon={<IcoTrash />} label="Remove statement" color="danger" onClick={() => {}} />
  </ButtonGroup>
);

// $borderRadius clips the whole group to a pill so adjoining buttons read as
// one segmented control rather than a loose row.
export const RoundedContainer = () => (
  <ButtonGroup $gap="no" $borderRadius="rounded-md">
    <Button label="Textual" color="primary" onClick={() => {}} />
    <Button label="Interpretive" color="grey" inverted onClick={() => {}} />
    <Button label="Inferential" color="grey" inverted onClick={() => {}} />
  </ButtonGroup>
);

export const WithMargins = () => (
  <div style={{ background: theme.color["gray"][150], padding: 4 }}>
    <ButtonGroup $marginTop $marginBottom>
      <Button label="Add reference" color="info" onClick={() => {}} />
    </ButtonGroup>
  </div>
);
