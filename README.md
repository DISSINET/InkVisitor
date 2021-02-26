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

-   **POST** /getMore {IFilterUsers} => IResponseUser[]
-   **GET** /:id => IResponseUser
-   **PUT** /:id {changes}
-   **DELETE** /:id
-   **POST** /:id {UserI}

#### /actants

-   **POST** /getMore {IFilterActants} => IResponseActant[]
-   **GET** /:id => IResponseActant
-   **PUT** /:id {changes} =>
-   **DELETE** /:id =>
-   **POST** /:id {ActantI} =>

#### /actions

-   **POST** /getMore {IFilterActions} => IResponseAction[]
-   **GET** /:id => IResponseAction
-   **PUT** /:id {changes} =>
-   **DELETE** /:id =>
-   **POST** /:id {IAction} =>

#### /tree (Tree container)

-   **GET** /
    {}
    => IResponseTree
    _returns the structure of all territories_

-   **POST** /moveTerritory
    {moveId: string; parentId: string; beforeId: string; afterId: string}
    =>
    _move territory to a new / same parent between beforeId and afterId_

#### /territory (List container)

-   **GET** /:id
    {}
    => IResponseTerritory
    _returns all statements and actants for selected territory_

-   **POST** /moveStatement
    {moveId: string; beforeId: string; afterId: string}
    =>
    _move statement within the territory - between beforeId and afterId_

#### /statement (Editor container)

-   **GET** /:id
    {}
    => IResponseStatement
    _get everything of the statement_

#### /administration (Administration container)

-   **GET** /:id
    {}
    => IResponseAdministration
    _administration purposes_

#### /bookmarks (Bookmarks container)

-   **GET** /:id
    {}
    => IResponseBookmarks
    _get all bookmarks of a user_

#### /detail (Detail container)

-   **GET** /:id
    {}
    => IResponseDetail
    _get everything of the actant_
