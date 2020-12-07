# DISSINET SERVER

## Deploy

- `npm run build` - builds and deploys the server
- go to ssh and `cd var/www/html/inkvisitor/server`
- `npm install`
- `npm run start:prod`
- `npm run stop:prod` to stop the process
- #`npm start` to test
- #`podman build --no-cache -t inkvisitor-server .`
- #(`podman run -p 3000:3000 --network="host" inkvisitor-server`)
- #`rm -rf inkvisitor-server.tar`
- #`podman save -o inkvisitor-server.tar --format oci-archive inkvisitor-server`
- copy to server
- #`podman load -i inkvisitor-server.tar`

## Development

Assuming that you are in the project folder.

### Node

Start the application server on `localhost:3000`.

- Start databases
  - go to root folder
  - create folder `data` and folder `database/schema/tables.sql` (David?)
- Run docker -`docker-compose up` | `-docker-compose down` | `docker-compose up -d` ...
- Import data
  - `cd ./packages/database`
  - `npm install`
  - `npm run import:sellan`
- Run server
  - `cd ./packages/server`
  - `npm install`
  - `npm run start:dev`

## Authentication Example

```shell
curl --request GET \
  --url http://localhost:3000/api/v1/actants \
  --header 'authorization: Bearer {TOKEN}'
```

### Insomnia Mocks

Import `insomnia.json` from `database/` folder.

## Endpoints

**meta**

- get all information that are needed before the application is loaded

  - all actions
  - all dictionaries

- `GET /meta`

**actant?<filters>**

- return all actants passing given filters and (optionally) information about their use:
  - statements in which this actant was used
  - territories in which this actant was used

**territory/:territoryId**

- get the required territory by the given territory id plus:
  - its parent, and children territories
  - statements under this territory
  - all actants used within these statements

```json
{
  "class": "T",
  "data": {
    "content": "",
    "language": "Lang1",
    "parent": "T1",
    "type": 0
  },
  -"id": "T1-1",
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
