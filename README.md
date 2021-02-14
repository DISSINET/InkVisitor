# InkVisitor

## Description

## Changelog

## Development

### Server

-   `cd ./packages/server`
-   `npm install`
-   `npm run start:dev`

### Database

-   (create folder `data` and folder `database/schema/tables.sql`)
-   run docker -`docker-compose up` | `-docker-compose down` | `docker-compose up -d` ...
-   import data
    -   `cd ./packages/database`
    -   `npm install`
    -   `npm run import:local` to import datasets to the local database (`.env.devel`)
    -   `npm run import:remote` to import datasets to the remote database (`.env.prod`)

### Client

-   `cd packages/client`
-   (`npm install`)
-   `npm start`

## Deploy

-   `npm run build` - builds and deploys the server
-   go to ssh and `cd var/www/html/inkvisitor/server`
-   `npm install`
-   `npm run start:prod`
-   `npm run stop:prod` to stop the process
-   #`npm start` to test
-   #`podman build --no-cache -t inkvisitor-server .`
-   #(`podman run -p 3000:3000 --network="host" inkvisitor-server`)
-   #`rm -rf inkvisitor-server.tar`
-   #`podman save -o inkvisitor-server.tar --format oci-archive inkvisitor-server`
-   copy to server
-   #`podman load -i inkvisitor-server.tar`

## Authentication Example

```shell
curl --request GET \
  --url http://localhost:3000/api/v1/actants \
  --header 'authorization: Bearer {TOKEN}'
```

## Data structure

### Collections

### Endpoints

#### /users

-   **getMore: ResponseUserI[]**
-   **getOne: ResponseUserI**
-   **putOne**
-   **deleteOne**
-   **postOne**

#### /territories

_to be discussed!_

-   **getOne: ResponseTerritoryI** returns territory by id, all territories exactly one level below and the path to the root territory, all statements with this territory and all its actants
-   **putOne**
-   **deleteOne**
-   **postOne**

#### /statements

_to be discussed_

-   **getOne: ResponseStatementI**
-   **putOne**
-   **deleteOne**
-   **postOne**

#### /actants

-   **getMore: ResponseActantI[]**
-   **getOne: ResponseActantI**
-   **putOne**
-   **deleteOne**
-   **postOne**

#### /actions

-   **getAll: ResponseActionI[]** get full list of actions for select box, can be loaded at initialization
-   **getOne: ResponseActionI** get one action to display edit modal
-   **putOne**
-   **deleteOne**
-   **postOne**
