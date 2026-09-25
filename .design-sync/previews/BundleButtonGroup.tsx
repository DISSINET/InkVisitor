import React from "react";
import { BundleButtonGroup } from "dissinet.ddb.client";

// Both edges off — a statement row that stands on its own, outside any bundle.
export const Default = () => (
  <BundleButtonGroup
    bundleStart={false}
    onBundleStartChange={() => {}}
    bundleEnd={false}
    onBundleEndChange={() => {}}
  />
);

// The opening row of a bundle: only the start marker is lit.
export const BundleStart = () => (
  <BundleButtonGroup
    bundleStart={true}
    onBundleStartChange={() => {}}
    bundleEnd={false}
    onBundleEndChange={() => {}}
  />
);

// The closing row: only the end marker is lit.
export const BundleEnd = () => (
  <BundleButtonGroup
    bundleStart={false}
    onBundleStartChange={() => {}}
    bundleEnd={true}
    onBundleEndChange={() => {}}
  />
);

// A single-row bundle: both markers lit at once.
export const BothActive = () => (
  <BundleButtonGroup
    bundleStart={true}
    onBundleStartChange={() => {}}
    bundleEnd={true}
    onBundleEndChange={() => {}}
  />
);

// Disabled while neither edge is active hides the whole control — nothing to
// toggle — so the disabled state is only shown here with an active edge kept
// visible, matching the component's own visibility rule.
export const Disabled = () => (
  <BundleButtonGroup
    disabled
    bundleStart={true}
    onBundleStartChange={() => {}}
    bundleEnd={false}
    onBundleEndChange={() => {}}
  />
);
