import React from "react";
import { EntityEnums, Submit } from "dissinet.ddb.client";

const territoryEntity = {
  id: "T-council-of-trent",
  class: EntityEnums.Class.Territory,
  status: EntityEnums.Status.Approved,
  labels: ["Council of Trent"],
  detail: "Ecumenical council held between 1545 and 1563.",
  language: EntityEnums.Language.Empty,
  notes: [],
  props: [],
  references: [],
  data: {},
} as any;

const personEntity = {
  id: "P-charles-v",
  class: EntityEnums.Class.Person,
  status: EntityEnums.Status.Approved,
  labels: ["Charles V"],
  detail: "Holy Roman Emperor, 1519–1556.",
  language: EntityEnums.Language.Empty,
  notes: [],
  props: [],
  references: [],
  data: {},
} as any;

// The default danger color carries the weight of an irreversible removal.
export const DeleteWithEntity = () => (
  <Submit
    title="Delete Territory"
    text="Do you really want to delete Territory?"
    entityToSubmit={territoryEntity}
    submitLabel="Delete"
    show
    onSubmit={() => {}}
    onCancel={() => {}}
  />
);

export const DeleteTextOnly = () => (
  <Submit
    title="Delete entities"
    text="Do you really want to delete 3 statements?"
    submitLabel="Delete"
    show
    onSubmit={() => {}}
    onCancel={() => {}}
  />
);

export const Loading = () => (
  <Submit
    title="Delete entity"
    text="Do you really want to delete this entity?"
    entityToSubmit={personEntity}
    submitLabel="Delete"
    loading
    show
    onSubmit={() => {}}
    onCancel={() => {}}
  />
);

// A change that can be re-applied later carries a plainer color than a removal.
export const NonDestructive = () => (
  <Submit
    title="Batch action"
    text='Are you sure you want to apply "Approve" to 12 entities?'
    entityToSubmit={personEntity}
    submitLabel="Apply"
    submitColor="success"
    bgClickCancels
    show
    onSubmit={() => {}}
    onCancel={() => {}}
  />
);
