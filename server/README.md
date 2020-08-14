# DISSINET SERVER

## Entities endpoint

### `GET /entities`

Get a collection of entities.

### `GET /entities?label=<label>&type=<type>

Get a collection of entities with the given label and type.

- Allow * in types.
- The given label filter value works not only for the beginning of the entity label.
- Attach meta object to each entity that will be filled later.

## Teritorries endpoint

### `GET /territories`

Get a collection of territories.

### `GET /territories?parent=<parentId>`

Get of collection of territories with the given parent id.

- returns both parent territory and children territories.
- for each territory, return the number of statement in the meta object with that territory id.

#### Example

For the HTTP GET `/territories/parent=T1` return:

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


## Statements endpoint

### `GET /statements`

Get a collection of statemnents.

### `GET /statements?territory=<territoryId>`

#### Example

For the HTTP GET `/statements?territory=T1-1-1` return:

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