# InkVisitor

## Description
InkVisitor is an open-source browser-based application for the manual entry of complex structured data from textual resources in the humanities and the social sciences. The data are entered as statements which interconnect entities of various different classes (Persons, Groups, Physical Objects, Concepts, Locations, Events, Statements, Texts and Values) into semantic quadruples (subject, verb, object 1, object 2), following the syntactic structure of the natural-language textual resources. InkVisitor serves as a data-entry front-end for a database ([RethinkDB](https://rethinkdb.com/)). 

## Changelog

## Data model

### Basics
The data model upon which InkVisitor is built is destined to capture very complex natural-language data with all the uncertainties, narrative perspectives, and semantic nuances of the natural language in order to then make them available to various kinds of quantitative and computational analyses.


### Statement
A Statement is an Entity type, with a unique identifier. Statements have the purpose of relating other Entities.


The other main Entity types are:
Action type
Concept
Person
Group
(Physical) object
Location
Event
Value


## Development

### Server

- `cd ./packages/server`
- `npm install`
- `npm run start:dev`

### Database

- (create folder `data` and folder `database/schema/tables.sql`)
- run docker -`docker-compose up` | `-docker-compose down` | `docker-compose up -d` ...
- import data
  - `cd ./packages/database`
  - `npm install`
  - `npm run import:local` to import datasets to the local database (`.env.devel`)
  - `npm run import:remote` to import datasets to the remote database (`.env.prod`)

### Client

- `cd packages/client`
- (`npm install`)
- `npm start`

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

- **POST** /getMore {IFilterUsers} => IResponseUser[]
- **GET** /:id => IResponseUser
- **PUT** /:id {changes}
- **DELETE** /:id
- **POST** /:id {UserI}

#### /actants

- **POST** /getMore {IFilterActants} => IResponseActant[]
- **GET** /:id => IResponseActant
- **PUT** /:id {changes} =>
- **DELETE** /:id =>
- **POST** /:id {ActantI} =>

#### /actions

- **POST** /getMore {IFilterActions} => IResponseAction[]
- **GET** /:id => IResponseAction
- **PUT** /:id {changes} =>
- **DELETE** /:id =>
- **POST** /:id {IAction} =>

#### /tree (Tree container)

- **GET** /
  {}
  => IResponseTree
  _returns the structure of all territories_

- **POST** /moveTerritory
  {moveId: string; parentId: string; beforeId: string; afterId: string}
  =>
  _move territory to a new / same parent between beforeId and afterId_

#### /territory (List container)

- **GET** /:id
  {}
  => IResponseTerritory
  _returns all statements and actants for selected territory_

- **POST** /moveStatement
  {moveId: string; beforeId: string; afterId: string}
  =>
  _move statement within the territory - between beforeId and afterId_

#### /statement (Editor container)

- **GET** /:id
  {}
  => IResponseStatement
  _get everything of the statement_

#### /administration (Administration container)

- **GET** /:id
  {}
  => IResponseAdministration
  _administration purposes_

#### /bookmarks (Bookmarks container)

- **GET** /:id
  {}
  => IResponseBookmarks
  _get all bookmarks of a user_

#### /detail (Detail container)

- **GET** /:id
  {}
  => IResponseDetail
  _get everything of the actant_

## ACL - access control list

Layer/middleware which controls access to respective resources (meaning the endpoint) in this application.
Access is defined in model called AclPermission. Resource is identified by controller and method name.
Specific access-check is defined by permission entry and matching user's group.

Exceptions: admin is by default allowed to use all permissions. Permission with '\*' value is allowed by all roles.

### Examples

User { role: "xxx" } + Permission { controller: "actants", name: "get", roles: ["xxx", "yyy"]} => allowed

User { role: "bbb" } + Permission { controller: "actants", name: "get", roles: ["xxx", "yyy"]} => not allowed

User { role: "bbb" } + Permission { controller: "actants", name: "get", roles: ["*"]} => allowed by wildcard

User { role: "admin" } + Permission { controller: "actants", name: "get", roles: []} => allowed by default
