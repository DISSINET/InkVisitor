# InkVisitor application

- Application for assisting transformation of textual information into a graph form.

For more information about the project, see https://dissinet.cz/.

## Packages

### Client

The client source code. For more information see https://github.com/DISSINET/inkVisitor/blob/master/packages/client/.

### Server

The server source code. For more information see https://github.com/DISSINET/inkVisitor/blob/master/packages/server/.

### Database

The database source code. For more information see https://github.com/DISSINET/inkVisitor/blob/master/packages/database/.

### Shared

Reusable code shared within other packages. For more information see https://github.com/DISSINET/inkVisitor/blob/master/packages/shared/.

# Milestones

## Phase 1 - September 2020

The application is displaying data of one case-study. All visual components are prepared for next stages.

- [ ] General: Project architecture + Webpack introduced
- [ ] General: Interfaces and types for data models
- [ ] Database: RethinkDB integrated
- [ ] Database: Data of one case-study are succesfully parsed and imported
- [ ] Server: Scalable Express and Router architecture
- [ ] Server: GET routes `/meta`, `/actant` and `/territory`
- [ ] Client: basic componets + storybooks
- [ ] Client: Territory-tree container
- [ ] Client: Statements-table container
- [ ] Client: Statement-editor container

## Phase 2 - October / November 2020

Application allows editing data, integrates metainformation and user authentfication.

- [ ] Database: Dictionaries in the database
- [ ] Database: Metainformation in actants
- [ ] Server: Routes for Updating / Creating / Removing actants
- [ ] Server: Dictionaries integrated in `/meta`
- [ ] Server: User Authentification
- [ ] Cleint: User Authentification in header
- [ ] Client: Statement-editor allows editing
- [ ] Client: Dragging Actants through Tag

## Phase 3 - December 2021

All data from spreadsheets are imported into the database, application is deployed on server.

- [ ] General: Deploy scripts and GitHub actions are running
- [ ] General: Environment for editing actions
- [ ] Database: All data from Google spreadsheet are imported into the database
- [ ] Client: Suggester component
- [ ] Client: Search panel works

## Phase 4 - January / February 2021

- Application is tested, new functionalities are integrated and data are continuously imported to the graph database.

- [ ] General: Page for editing actions
- [ ] Client: E2E tests created
- [ ] Client: Assisting functions
- [ ] Client: Bookmark panel works
- [ ] Client: User administration panel
- [ ] Database: Data are exported to the Graph database
