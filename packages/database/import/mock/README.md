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
    action: uuid<Action>;
    territory: uuid<Territory>;
    references: Reference[];
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

type Reference = {
  resource: uuid<Actant>;
  part: string;
  type: keyof ReferenceTypes;
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

## Endpoints

### get all territories with the given parent id `/territories?parent=parentID`

- returns both parent territory and children territories
- for each territory, return the number of statement in the `meta` object with that territory id

example `/territories/parent=T1`

```json
{
  "parent": {
    "id": "T1",
    "label": "A book of inquisition",
    "class": "T",
    "data": { "parent": "T0", "content": "", "type": 0, "language": "Lang1" },
    "meta": { "noStatements": 0 }
  },
  "children": [
    {
      "id": "T1-1",
      "label": "Chapter 1",
      "class": "T",
      "data": { "parent": "T1", "content": "", "type": 0, "language": "Lang1" },
      "meta": { "noStatements": 1 }
    },
    {
      "id": "T1-2",
      "label": "Chapter 2",
      "class": "T",
      "data": { "parent": "T2", "content": "", "type": 0, "language": "Lang1" },
      "meta": { "noStatements": 0 }
    }
  ]
}
```

### get actants by label and entity type `/entities?label=&type=`

- returns a filtered list of entities that match the given label and type
- allows \* in types
- the given label filter value works not only for the beginning of the entity label
- attach meta object to each entity that will be filled later

example `/entities?label=ou&type=*`

```json
[
  {
    "id": "G1",
    "class": "E",
    "label": "a group of villagers",
    "data": { "type": "G" },
    "meta": {}
  },
  {
    "id": "L1",
    "class": "E",
    "label": "a house near Dover",
    "data": { "type": "L" },
    "meta": {}
  },
  {
    "id": "C010",
    "class": "E",
    "label": "amount",
    "data": { "type": "C" },
    "meta": {}
  }
]
```

### get statements based on the given territory id `/statements?territory=territoryId`

- returns statements collection + list of actants that are relevant for those statements (references, tags, actant ids, prop actant1 and actant2)

example `/statements?territory=T1-1-1`

```json
{
  "statements": [
    {
      "id": "S1",
      "class": "S",
      "label": "",
      "data": {
        "action": "A1",
        "territory": "T1-1-1",
        "references": [{ "resource": "R1", "part": "", "type": "p" }],
        "certainty": 1,
        "elvl": 1,
        "modality": 1,
        "text": "Fisherman David said that ...",
        "note": "",
        "props": [],
        "actants": [
          {
            "id": "P1",
            "position": "s",
            "elvl": 1,
            "certainty": 1,
            "props": [
              {
                "actant1": "C06",
                "actant2": "C2",
                "elvl": 1,
                "certainty": 1
              }
            ]
          },
          {
            "id": "S2",
            "position": "a1",
            "elvl": 1,
            "certainty": 1
          }
        ],
        "tags": []
      }
    },
    {
      "id": "S2",
      "class": "S",
      "label": "",
      "data": {
        "action": "A2",
        "territory": "T1-1-1",
        "references": [
          { "resource": "R1", "part": "", "type": "p" },
          { "resource": "R2", "part": "page 123", "type": "s" }
        ],
        "certainty": 1,
        "elvl": 1,
        "modality": 1,
        "text": "...priest Honza, baker Robert, and a group of local villagers performed a ritual in a house near Dover.",
        "note": "",
        "props": [
          {
            "actant1": "C01",
            "actant2": "L1",
            "elvl": 1,
            "certainty": 1,
            "props": []
          },
          {
            "actant1": "C01",
            "actant2": "L1",
            "elvl": 1,
            "certainty": 1,
            "props": []
          }
        ],
        "actants": [
          {
            "id": "P2",
            "position": "s",
            "elvl": 1,
            "certainty": 1,
            "props": [
              {
                "actant1": "C06",
                "actant2": "C3",
                "elvl": 1,
                "certainty": 1,
                "props": []
              }
            ]
          },
          {
            "id": "P3",
            "position": "s",
            "elvl": 1,
            "certainty": 1,
            "props": [
              {
                "actant1": "C06",
                "actant2": "C4",
                "elvl": 1,
                "certainty": 1,
                "props": []
              }
            ]
          },
          {
            "id": "G1",
            "position": "s",
            "elvl": 1,
            "certainty": 1,
            "props": []
          },
          {
            "id": "L1",
            "position": "f",
            "elvl": 1,
            "certainty": 1,
            "props": [
              {
                "actant1": "C02",
                "actant2": "L2",
                "elvl": 1,
                "certainty": 1,
                "props": []
              }
            ]
          }
        ],
        "tags": []
      }
    }
  ],
  "actants": [
    {
      "id": "R1",
      "label": "Resource 1",
      "class": "R",
      "data": { "content": "", "link": "", "type": 0, "language": "Lang1" }
    },
    {
      "id": "R2",
      "label": "Resource 2",
      "class": "R",
      "data": { "content": "", "link": "", "type": 0, "language": "Lang1" }
    },
    { "id": "P1", "class": "E", "label": "David", "data": { "type": "P" } },
    { "id": "P2", "class": "E", "label": "Honza", "data": { "type": "P" } },
    {
      "id": "P3",
      "class": "E",
      "label": "Robert",
      "data": { "type": "P" }
    },
    {
      "id": "G1",
      "class": "E",
      "label": "a group of villagers",
      "data": { "type": "G" }
    },
    {
      "id": "L1",
      "class": "E",
      "label": "a house near Dover",
      "data": { "type": "L" }
    },
    { "id": "L2", "class": "E", "label": "Dover", "data": { "type": "L" } },
    {
      "id": "C01",
      "class": "E",
      "label": "location:where",
      "data": { "type": "C" }
    },
    {
      "id": "C02",
      "class": "E",
      "label": "location:near",
      "data": { "type": "C" }
    },
    {
      "id": "C06",
      "class": "E",
      "label": "occupation",
      "data": { "type": "C" }
    },
    {
      "id": "C2",
      "class": "E",
      "label": "fisherman",
      "data": { "type": "C" }
    },
    {
      "id": "C3",
      "class": "E",
      "label": "priest",
      "data": { "type": "C" }
    },
    { "id": "C4", "class": "E", "label": "baker", "data": { "type": "C" } }
  ]
}
```
