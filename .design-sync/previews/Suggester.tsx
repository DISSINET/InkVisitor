import React from "react";
import { EntityEnums, Suggester } from "dissinet.ddb.client";

const categories = [
  { value: EntityEnums.Class.Person, label: "Person" },
  { value: EntityEnums.Class.Territory, label: "Territory" },
  { value: EntityEnums.Class.Action, label: "Action" },
  { value: EntityEnums.Class.Concept, label: "Concept" },
];

// The suggestion dropdown and the create button only appear while the input
// holds focus (component-local state, not a prop), so these cells show the
// suggester's resting control — category picker, type bar, and input.
export const Default = () => (
  <Suggester
    suggestions={[]}
    typed="Charles"
    category={EntityEnums.Class.Person}
    categories={categories}
    isInsideTemplate={false}
    showCreateModal={false}
    setShowCreateModal={() => {}}
    onType={() => {}}
    onChangeCategory={() => {}}
    onCreate={() => {}}
    onPick={() => {}}
    onDrop={() => {}}
    onHover={() => {}}
    onCancel={() => {}}
  />
);

export const Empty = () => (
  <Suggester
    suggestions={[]}
    typed=""
    placeholder="search or create entity"
    category={EntityEnums.Class.Territory}
    categories={categories}
    isInsideTemplate={false}
    showCreateModal={false}
    setShowCreateModal={() => {}}
    onType={() => {}}
    onChangeCategory={() => {}}
    onCreate={() => {}}
    onPick={() => {}}
    onDrop={() => {}}
    onHover={() => {}}
    onCancel={() => {}}
  />
);

export const DisableCreate = () => (
  <Suggester
    suggestions={[]}
    typed="Trento"
    category={EntityEnums.Class.Territory}
    categories={categories}
    disableCreate
    isInsideTemplate={false}
    showCreateModal={false}
    setShowCreateModal={() => {}}
    onType={() => {}}
    onChangeCategory={() => {}}
    onCreate={() => {}}
    onPick={() => {}}
    onDrop={() => {}}
    onHover={() => {}}
    onCancel={() => {}}
  />
);

export const Disabled = () => (
  <Suggester
    suggestions={[]}
    typed="Holy Roman Empire"
    category={EntityEnums.Class.Territory}
    categories={categories}
    disabled
    isInsideTemplate={false}
    showCreateModal={false}
    setShowCreateModal={() => {}}
    onType={() => {}}
    onChangeCategory={() => {}}
    onCreate={() => {}}
    onPick={() => {}}
    onDrop={() => {}}
    onHover={() => {}}
    onCancel={() => {}}
  />
);
