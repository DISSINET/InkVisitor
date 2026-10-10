import React from "react";
import { Dropzone, LetterIcon, Tag } from "dissinet.ddb.client";

// Dropzone is a passthrough layout: it wraps whatever the caller drops into
// it (usually a Tag) and only changes appearance while something is dragged
// over it, which is not a state a static preview can reach. These cells show
// its resting composition instead.
const marker = (letter: string, bgColor: string) => (
  <LetterIcon letter={letter} bgColor={bgColor} color="white" size={18} />
);

export const Default = () => (
  <Dropzone
    onDrop={() => {}}
    onHover={() => {}}
    isInsideTemplate={false}
    isWrongDropCategory={false}
  >
    <Tag dragDisabled tagComponent={marker("T", "warning")} labelComponent={<span>Council of Trent</span>} />
  </Dropzone>
);

export const Disabled = () => (
  <Dropzone
    onDrop={() => {}}
    onHover={() => {}}
    isInsideTemplate={false}
    disabled
  >
    <Tag dragDisabled tagComponent={marker("P", "primary")} labelComponent={<span>Charles V</span>} />
  </Dropzone>
);
