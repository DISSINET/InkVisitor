# noSQL mockup and API definition

Two json files representing a mockup dataset for no-sql of the database version

## Structure

The structure of the mockup consists of several dictionaries, actants.json and actions.json collections.

### dictionaries

Several dictionaries in forms of key: value pairs exists. Those are:

- type Languages
- type TerrytoryTypes
- type ResourceTypes
- type Positions
- type ReferenceTypes
- type EntityTypes
- type Certainties
- type Modalities
- type Elvls
- type Rules

### actants.json

The first collection stores 4 classes of data: Territories, Resources, Entities and Statements

```ts
interface Actant {
  id: uuid;
  label: string;
  class: "T" | "R" | "E" | "S"; // defines the model and the conntent of data object
}

interface Territory extends Actant {
  data: {
    parent: uuid<Territory>; // id of the parent Territory
    content: string;
    type: keyof TerrytoryTypes;
    language: keyof Languages;
  };
}

interface Resource extends Actant {
  data: {
    content: string;
    type: keyof ResourceTypes;
    language: keyof Languages;
    url: string;
  };
}

interface Entity extends Actant {
  data: {
    type: keyof EntityTypes;
  };
}

interface Statement extends Actant {
  data: {
    actionId: string;
    territoryId: uuid<Territory>;
    certainty: keyof Certainties;
    elvl: keyof Elvls;
    modality: keyof Modalities;
    text: string;
    note: string;
    actants: {
      id: uuid<Actant>;
      position: keyof Positions;
      certainty: keyof Certainties;
      elvl: keyof Elvls;
      props: Prop[];
    }[];
    props: Prop[];
    tags: uuid<Actant>[];
  };
}

type Prop = {
  actant1: uuid<Actant>;
  actant2: uuid<Actant>;
  certainty: keyof Certainties;
  elvl: keyof Elvls;
  props: Prop[]; // only first level
};
```

### actions.json

The second collection consists of a list of actions with rules, valencies, labels...

```ts
interface Action {
  id: uuid;
  parent: uuid<Action>;
  node: string;
  labels: Label[];
  types: ActionType[];
  valencies: Valency[];
  rules: Rule[];
}

type Label = {
  value: string;
  language: keyof Language;
};

type ActionType = {
  type: uuid<Actant>;
};

type Valency = {
  text: string;
  position: keyof Position;
};

type RuleActant = {
  position: keyof Position;
  entityType: keyof Entitytypes;
  multiple: boolean;
};

type RuleProperty = {
  position: keyof Position;
  typeValue: uuid<Actant>;
  rule: keyof Rules;
};
```
