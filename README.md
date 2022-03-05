# InkVisitor

## Description

InkVisitor is an open-source browser-based application for the manual entry of complex structured data from textual resources in the humanities and the social sciences. The data are entered in the form of statements, which interconnect entities of various different classes into semantic quadruples (subject, verb, object 1, object 2) following the syntactic structure of texts. InkVisitor serves as a data-entry front-end for [RethinkDB](https://rethinkdb.com/) research databases which then allow for various kinds of quantitative and computational analyses of the data to be performed.

## Acknowledgements

InkVisitor has been developed in the [Dissident Networks Project (DISSINET)](https://dissinet.cz), a historical and social scientific research project focusing on medieval religious dissidence, inquisition, and inquisitorial records. The development has received substantial funding from the Czech Science Foundation (EXPRO project No. GX19-26975X “Dissident Religious Cultures in Medieval Europe from the Perspective of Social Network Analysis and Geographic Information Systems”) and the European Research Council (ERC Consolidator Grant, project No. 101000442 “Networks of Dissent: Computational Modelling of Dissident and Inquisitorial Cultures in Medieval Europe”).

The lead developer of the application is [Adam Mertel](https://github.com/adammertel/). Other contributors of code include Petr Hanák, Ján Mertel and others. The lead authors of the data model are David Zbíral and Robert L. J. Shaw. Other contributors to the data model and testers include Tomáš Hampejs, Jan Král, Katia Riccardo and others.

## Data model

### Purpose

The data model upon which InkVisitor is built is destined to capture complex natural-language data with all their **uncertainties, narrative perspective, and semantic nuance**. It does so in the semantically rich form of **quadruples**, which are an extended form of semantic triples destined to capture, more naturally than triples, the structure of languages with two grammatical objects (e.g., “Mary gave a present to Peter”: subject, verb, object 1, object 2) as well as with chains of statements (e.g., “Mary told Peter – that she would give him a present”) and multiple sentence constituents.

The data model captures not only editorial assessment of **certainty level**, but also the overall perspective in its two key aspects: epistemic level and modality. **Epistemic level** expresses whether a claim is directly in the text, or is an interpretation thereof, or is an inference by and large independent from the text. **Modality** captures whether a given statement of the text is a positive utterance of the state of affairs, a question, a condition, a wish etc.

While the DISSINET data model has been developed primarily to capture medieval inquisitorial records, it represents a quite **generalized data model** of rare complexity from which historians, humanists, and social scientists will benefit for bridging between quantitative and qualitative research in consequential ways and transcend the limitations of, on the one hand, Computer-Assisted Qualitative Data Analysis Software (CAQDAS) with its strongly hypothesis-driven and classificatory approach, and on the other, the limitations of fact-oriented tabular data collection which tends to lose much of the salient discursive qualities of the original data sources.

The DISSINET data model represents a unique way to precisely represent textual sources in a deeply structured and interconnected manner.

### Entity types

A **Statement** is an Entity type which has the purpose of relating other Entities. All statements (as well as all other entities) have unique IDs, and their original order in the text is preserved, thereby allowing to follow the development of an action in the narrative, the interplay of questions and answers, etc.

The other Entity types covered in the data model are:

- **Action type**
- **Concept**
- **Person**
- **Group**
- **(Physical) Object**
- **Location**
- **Event**
- **Value**
- **Text / Text part**
- **Resource**

### Properties and their uses

The uses of properties include:

- Modelling adjectives concerning actants.
- Instantiating Entities to parent types.
- Defining time and place of action (including in fuzzy terms).
- Recording other adverbials, for example those concerning manner of action, circumstances, causes or consequences of action.

## User Administration

The environment supports a system of three roles:

- admin
- editor
- viewer

Further, the admin may grant particular users (editors and viewers) access rights for specified territories. Editor role may be granted by "edit" rights, viewer role has "view" rights.

**Entity Detail** is accessible to all roles. The viewer is not allowed to change any value, while the editor may change label, detail, notes, language and add, remove and edit property statements with the status of "pending." Moreover, all meta props in detail that he creates are getting status "pending." Admin has full access to internal attributes of the entity (status, class) and meta props. All meta props he creates have the status "approved."

Only admin and editor with edit rights in the parent **Territory** (T) may edit, add or remove a child T. Editors and viewers do not see T they have no rights to in the T Tree. Only "edit" rights for the T grant the rights to add a new Statement under that particular T, or any other child of that T. That means that the admin has first to create a T and grant edit rights to editors.

To administrate the users rights, admin roles may acces the **administration window**, where they can append new territories to editors and viewers. They can also create new users, change roles, see passwords or delete users. Admin role is not possible to be assigned or deleted through this environment.

## Development

### Server

- `cd ./packages/server`
- `npm install`
- `npm run start:dev`

### Database

- run docker -`docker-compose up` | `-docker-compose down` | `docker-compose up -d` ...
- import data
  - `cd ./packages/database`
  - (`npm install`)
  - `npm run import-local` to import datasets to the local database (`.env.devel`)
  - `npm run import-remote` to import datasets to the remote database (`.env.prod`) (`import-remote-sandbox` and `import-remote-staging`, and `import-remote-importdata` for specific deploys)

### Client

- `cd packages/client`
- (`npm install`)
- `npm start`

#### Storybook

- `cd packages/client`
- (`npm install`)
- `npm run storybook`

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
