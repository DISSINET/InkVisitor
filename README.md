<p align="center" width="100%" style="background: white; padding-top:5px;">
    <img width="50%" src="./logo/logo-full.png" style="background: transparent;">
</p>

<!-- [![deploy staging](https://github.com/DISSINET/InkVisitor/actions/workflows/dev.yml/badge.svg?branch=dev)](https://github.com/DISSINET/InkVisitor/actions/workflows/dev.yml) -->

## Description

InkVisitor is an open-source browser-based application for the manual entry of complex structured data from textual resources in the humanities and the social sciences. The data are entered in the form of statements, which interconnect entities of various different classes into semantic quadruples (subject, verb, object 1, object 2) following the syntactic structure of texts. InkVisitor serves as a data-entry front-end for [RethinkDB](https://rethinkdb.com/) research databases which then allow for various kinds of quantitative and computational analyses of the data to be performed.

## Acknowledgements

InkVisitor has been developed in the [Dissident Networks Project (DISSINET)](https://dissinet.cz), a historical and social scientific research project focusing on medieval religious dissidence, inquisition, and inquisitorial records. The development has received substantial funding from the Czech Science Foundation (EXPRO project No. GX19-26975X “Dissident Religious Cultures in Medieval Europe from the Perspective of Social Network Analysis and Geographic Information Systems”) and the European Research Council (ERC Consolidator Grant, project No. 101000442 “Networks of Dissent: Computational Modelling of Dissident and Inquisitorial Cultures in Medieval Europe”).

The lead developer of the application is [Petr Hanák](https://github.com/ptrhnk/). Other contributors of code include [Adam Mertel](https://github.com/adammertel/), [Ján Mertel](https://github.com/jancimertel/) and others. The lead authors of the data model are David Zbíral and Robert L. J. Shaw. Other contributors to the data model and testers include Tomáš Hampejs, Jan Král, Katia Riccardo and others.

External documentation can be found [here](https://docs.religionistika.phil.muni.cz/books/from-texts-to-structured-data-building-knowledge-graphs-through-computer-assisted-semantic-text-modelling-castemo).

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
- **Being** (typically, animal)
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

The environment supports four user roles:

- owner,
- admin,
- editor,
- viewer.

Further, owners and admins may grant particular users (editors and viewers) access rights for specified territories. Editor role may be granted by "edit" rights, viewer role has "view" rights.

**Entity Detail** is accessible to all roles. The viewer is not allowed to change any value, while the editor may change label, detail, notes, language and add, remove and edit property statements with the status of "pending." Moreover, all metaprops in detail that he creates are getting status "pending." Admin has full access to internal attributes of the entity (status, class) and metaprops. All metaprops he creates have the status "approved."

Owner, admin and editor with edit rights in the parent **Territory** (T) may edit, add or remove a child T. Editors and viewers do not see T they have no rights to in the T Tree. Only "edit" rights for the T grant the rights to add a new Statement under that particular T, or any other child of that T. That means that the admin has first to create a T and grant edit rights to editors.

To administrate the users rights, admin roles may access the **administration window**, where they can append new territories to editors and viewers. They can also create new users, change roles, see passwords or delete users. Admin role is not possible to be assigned or deleted through this environment.

## Packages

#### Client

For more information see [client package](./packages/client)

### Server

For more information see [server package](./packages/server)

#### Database

For more information see [database package](./packages/database)

#### Shared

Package containing typescript definitions, types and enums, that should be available to both client & server.

## Development

### Install

Install `pnpm` version `>=10.1.0`. You can switch the `pnpm` versions by running `corepack prepare pnpm@<version> --activate`.
Go to all three folders in `packages` (`client`, `server`, `database`) and run `pnpm i` in each of them.
Before continuing, please ensure that you have a database instance set up and running — see the [deployment tutorial](./docs/deployment-tutorial.md) for the database setup and how to run each component locally.

## Deploy

Full deployment instructions — including environment variables, SSL/reverse-proxy setup, firewall and update workflows — live in **[docs/deployment-tutorial.md](./docs/deployment-tutorial.md)**.

There are three supported paths:

- **Docker with the published image** — fastest. Pulls [`dissinet/inkvisitor`](https://hub.docker.com/r/dissinet/inkvisitor) from Docker Hub; no build step. Recommended unless you need custom client-side configuration.
- **Docker with a locally built image** — required when you need custom client `.env` values (e.g. `APIURL`, `ROOT_URL`), since those are baked in at build time.
- **By packages (no Docker)** — build and run client, server and database separately.

Quick start with the published Docker image (defaults in [docker-compose.yml](./docker-compose.yml) are ready to use — set `SECRET` in a top-level `.env` before exposing the instance):

```bash
# 1. Start the database
docker compose up -d database

# 2. Import the schema (host-side CLI: decline SSH, press D to pick dataset, X to import)
cp packages/database/env/example.env packages/database/env/.env
cd packages/database && pnpm install && pnpm start && cd -

# 3. Run the application (pulls the published image automatically)
docker compose up -d inkvisitor
```

For Kubernetes manifests, see [kube/](./kube). The setup will likely need to be adapted to your cluster.

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
