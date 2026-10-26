import React from "react";
import { Button, ButtonGroup, ButtonGroups, IcoEdit, IcoSearch, IcoTrash } from "dissinet.ddb.client";

// Two independent ButtonGroups side by side; each following group gets a
// margin from the ".buttongroup" class so the clusters don't touch.
export const Default = () => (
  <ButtonGroups>
    <ButtonGroup $gap="small">
      <Button icon={<IcoSearch />} label="Search" color="primary" onClick={() => {}} />
    </ButtonGroup>
    <ButtonGroup $gap="small">
      <Button icon={<IcoEdit />} label="Edit" color="info" onClick={() => {}} />
      <Button icon={<IcoTrash />} label="Delete" color="danger" onClick={() => {}} />
    </ButtonGroup>
  </ButtonGroups>
);

// A toolbar's-worth of clusters: view controls, then destructive actions kept
// visually apart from them.
export const ThreeClusters = () => (
  <ButtonGroups>
    <ButtonGroup $gap="no" $borderRadius="rounded-md">
      <Button label="List" color="primary" onClick={() => {}} />
      <Button label="Tree" color="grey" inverted onClick={() => {}} />
    </ButtonGroup>
    <ButtonGroup $gap="small">
      <Button label="Add territory" color="success" onClick={() => {}} />
    </ButtonGroup>
    <ButtonGroup $gap="small">
      <Button icon={<IcoTrash />} color="danger" tooltipLabel="Remove selected" onClick={() => {}} />
    </ButtonGroup>
  </ButtonGroups>
);
