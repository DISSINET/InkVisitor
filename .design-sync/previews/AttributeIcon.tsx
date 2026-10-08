import React from "react";
import { AttributeIcon, Button } from "dissinet.ddb.client";

// AttributeIcon is a bare glyph with no styling of its own — every real call
// site puts it inside a Button or Dropdown icon slot to pick up the DS's
// sizing and color. These previews reproduce that composition.
const Row: React.FC<{ children?: React.ReactNode }> = ({ children }) => (
  <div style={{ display: "flex", flexWrap: "wrap", gap: 8, alignItems: "center" }}>
    {children}
  </div>
);

export const Default = () => (
  <Button
    icon={<AttributeIcon attributeName="elvl" />}
    inverted
    color="info"
    tooltipLabel="epistemic level"
    onClick={() => {}}
  />
);

export const AttributeSweep = () => (
  <Row>
    <Button icon={<AttributeIcon attributeName="certainty" />} inverted color="info" tooltipLabel="certainty" onClick={() => {}} />
    <Button icon={<AttributeIcon attributeName="elvl" />} inverted color="info" tooltipLabel="epistemic level" onClick={() => {}} />
    <Button icon={<AttributeIcon attributeName="logic" />} inverted color="info" tooltipLabel="logic" onClick={() => {}} />
    <Button icon={<AttributeIcon attributeName="mood" />} inverted color="info" tooltipLabel="mood" onClick={() => {}} />
    <Button icon={<AttributeIcon attributeName="moodvariant" />} inverted color="info" tooltipLabel="mood variant" onClick={() => {}} />
    <Button icon={<AttributeIcon attributeName="virtuality" />} inverted color="info" tooltipLabel="virtuality" onClick={() => {}} />
    <Button icon={<AttributeIcon attributeName="partitivity" />} inverted color="info" tooltipLabel="partitivity" onClick={() => {}} />
  </Row>
);

export const BundleControls = () => (
  <Row>
    <Button icon={<AttributeIcon attributeName="bundleStart" />} inverted color="info" tooltipLabel="bundle start" onClick={() => {}} />
    <Button icon={<AttributeIcon attributeName="bundleOperator" />} inverted color="info" tooltipLabel="bundle operator" onClick={() => {}} />
    <Button icon={<AttributeIcon attributeName="bundleEnd" />} inverted color="info" tooltipLabel="bundle end" onClick={() => {}} />
    <Button icon={<AttributeIcon attributeName="negation" />} inverted color="danger" tooltipLabel="negation" onClick={() => {}} />
  </Row>
);
