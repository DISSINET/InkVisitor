import React from "react";
import { Button, ButtonGroup, CancelButton } from "dissinet.ddb.client";

export const Default = () => <CancelButton onClick={() => {}} />;

export const CustomLabel = () => <CancelButton label="Discard" onClick={() => {}} />;

// The one place the "back out without committing" look is defined: a ghost
// button so the committing action is the only one carrying visual weight.
export const InFooter = () => (
  <ButtonGroup>
    <CancelButton onClick={() => {}} />
    <Button label="Save changes" color="primary" onClick={() => {}} />
  </ButtonGroup>
);
