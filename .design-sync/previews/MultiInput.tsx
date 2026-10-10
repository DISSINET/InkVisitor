import React from "react";
import { MultiInput } from "dissinet.ddb.client";

export const Editable = () => (
  <MultiInput
    width={320}
    values={[
      "Convened to address doctrinal disputes raised by the Reformation.",
      "Presided over by legates appointed by Pope Paul III.",
    ]}
    disabled={false}
    onChange={() => {}}
  />
);

export const SingleNote = () => (
  <MultiInput
    width={320}
    values={["Session closed 4 December 1563."]}
    disabled={false}
    onChange={() => {}}
  />
);

export const ReadOnly = () => (
  <MultiInput
    width={320}
    values={[
      "Convened to address doctrinal disputes raised by the Reformation.",
      "Presided over by legates appointed by Pope Paul III.",
    ]}
    disabled
    onChange={() => {}}
  />
);

export const Empty = () => (
  <MultiInput width={320} values={[]} disabled={false} onChange={() => {}} />
);
