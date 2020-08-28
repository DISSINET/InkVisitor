# DISSINET SERVER

## Development

Assuming that you are in the project folder.

### Node

Start the application server on `localhost:3000`.

    cd server
    npm install
    npm run start:dev

Start the container with database server.

    docker-compose up
    docker-compose down

### RethinkDB

Use `packages/database/scripts/import-rethinkdb.js`

### Insomnia Mocks

Import `insomnia.json` from `database/` folder.

## Entities endpoint

### `GET /actants?class=<class>&label=<label>`

- `/actants?label=location:near`

### `GET /entities`

Get a collection of entities.

### `GET /entities?label=<label>&type=<type>`

Get a collection of entities with the given label and type.

- Allow \* in types.
- The given label filter value works not only for the beginning of the entity label.
- Attach meta object to each entity that will be filled later.

## Teritorries endpoint

### `GET /territory`

Get a all relevant data for a given territory id.

#### Example

For the HTTP GET `http://localhost:3000/api/v1/territory/T1-1` return:

```json
{
  "class": "T",
  "data": {
    "content": "",
    "language": "Lang1",
    "parent": "T1",
    "type": 0
  },
  "id": "T1-1",
  "label": "Chapter 1",
  "children": [
    {
      "class": "T",
      "data": {
        "content": "",
        "language": "Lang1",
        "parent": "T1-1",
        "type": 0
      },
      "id": "T1-1-4",
      "label": "Deposition 4"
    },
    {
      "class": "T",
      "data": {
        "content": "",
        "language": "Lang1",
        "parent": "T1-1",
        "type": 0
      },
      "id": "T1-1-3",
      "label": "Deposition 3"
    },
    {
      "class": "T",
      "data": {
        "content": "",
        "language": "Lang1",
        "parent": "T1-1",
        "type": 0
      },
      "id": "T1-1-1",
      "label": "Deposition 1"
    },
    {
      "class": "T",
      "data": {
        "content": "",
        "language": "Lang1",
        "parent": "T1-1",
        "type": 0
      },
      "id": "T1-1-2",
      "label": "Deposition 2"
    }
  ],
  "parent": {
    "class": "T",
    "data": {
      "content": "",
      "language": "Lang1",
      "parent": "T0",
      "type": 0
    },
    "id": "T1",
    "label": "A book of inquisition"
  },
  "statements": [
    {
      "class": "S",
      "data": {
        "actants": [
          {
            "actant": {
              "class": "E",
              "data": {
                "type": "L"
              },
              "id": "L1",
              "label": "a house near Dover"
            },
            "certainty": 1,
            "elvl": 1,
            "position": "s"
          }
        ],
        "action": {
          "id": "A3",
          "labels": [
            {
              "label": "brought",
              "language": "Lang1"
            }
          ],
          "note": "",
          "parent": false,
          "rulesActants": [],
          "rulesProperties": [],
          "types": [],
          "valencies": []
        },
        "certainty": 1,
        "elvl": 1,
        "modality": 1,
        "note": "",
        "props": [
          {
            "actant1": {
              "class": "E",
              "data": {
                "type": "C"
              },
              "id": "C03",
              "label": "time:when"
            },
            "actant2": {
              "class": "E",
              "data": {
                "type": "E"
              },
              "id": "E1",
              "label": "big forest fire"
            },
            "certainty": 1,
            "elvl": 1,
            "id": "S4-prop1",
            "subject": {
              "class": "S",
              "data": {
                "actants": [
                  {
                    "actant": "L1",
                    "certainty": 1,
                    "elvl": 1,
                    "position": "s"
                  }
                ],
                "action": "A3",
                "certainty": 1,
                "elvl": 1,
                "modality": 1,
                "note": "",
                "props": [
                  {
                    "actant1": "C03",
                    "actant2": "E1",
                    "certainty": 1,
                    "elvl": 1,
                    "id": "S4-prop1",
                    "subject": "S4"
                  },
                  {
                    "actant1": "C09",
                    "actant2": "C011",
                    "certainty": 1,
                    "elvl": 1,
                    "id": "S4-prop2",
                    "subject": "S4-prop1"
                  },
                  {
                    "actant1": "C010",
                    "actant2": "V4",
                    "certainty": 1,
                    "elvl": 1,
                    "id": "S4-prop3",
                    "subject": "S4-prop1"
                  }
                ],
                "references": [
                  {
                    "part": "12-13",
                    "resource": "R1",
                    "type": "primary"
                  }
                ],
                "tags": ["T2"],
                "territory": "T1-1",
                "text": "This house burned down during the big forest fire."
              },
              "id": "S4",
              "label": ""
            }
          },
          {
            "actant1": {
              "class": "E",
              "data": {
                "type": "C"
              },
              "id": "C09",
              "label": "units"
            },
            "actant2": {
              "class": "E",
              "data": {
                "type": "C"
              },
              "id": "C011",
              "label": "years"
            },
            "certainty": 1,
            "elvl": 1,
            "id": "S4-prop2",
            "subject": null
          },
          {
            "actant1": {
              "class": "E",
              "data": {
                "type": "C"
              },
              "id": "C010",
              "label": "amount"
            },
            "actant2": {
              "class": "E",
              "data": {
                "type": "V"
              },
              "id": "V4",
              "label": "2"
            },
            "certainty": 1,
            "elvl": 1,
            "id": "S4-prop3",
            "subject": null
          }
        ],
        "references": [
          {
            "part": "12-13",
            "resource": {
              "class": "R",
              "data": {
                "content": "",
                "language": "Lang1",
                "link": "",
                "type": 0
              },
              "id": "R1",
              "label": "Resource 1"
            },
            "type": "primary"
          }
        ],
        "tags": [
          {
            "class": "T",
            "data": {
              "content": "",
              "language": "Lang1",
              "parent": "T0",
              "type": 0
            },
            "id": "T2",
            "label": "A book of forest fires"
          }
        ],
        "territory": "T1-1",
        "text": "This house burned down during the big forest fire."
      },
      "id": "S4",
      "label": ""
    }
  ]
}
```
