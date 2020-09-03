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

## Phase 1 - until the end of September 2020

- The application is displaying data of one case-study. All visual components are prepared for next stages.

- [ ] General: Project architecture is set
- [ ] General: Interfaces for all models are prepared
- [ ] Database: RethinkDB works
- [ ] Database: Data of one case-study are succesfully parsed and imported
- [ ] Server: Scalable Express and Router architecture prepared
- [ ] Server: GET routes `/meta`, `/actant` and `/territory` are returning data
- [ ] Client: Webpack for local development
- [ ] Client: All basic componets are created including storybooks
- [ ] Client: Territory-tree container works
- [ ] Client: Statements-table container works
- [ ] Client: Statement-editor container displays statement data

## Phase 2 - until the end of November 2020

- The application allows to edit data. All previously collected data are imported. Application runs on remote server.

- [ ] General: Deploy scripts and GitHub actions are running
- [ ] General: Environment for editing actions
- [ ] Database: All data from Google spreadsheet are imported into the database
- [ ] Database: Dictionaries are integrated within the database
- [ ] Database: Data models are revised with the metainformation section
- [ ] Server: Routes for Updating / Creating / Removing actants
- [ ] Server: Dictionaries are integrated
- [ ] Client: Statement-editor allows editing data
- [ ] Client: Suggester component fully works
- [ ] Client: Search panel works

## Phase 3 - until the end of January 2021

- Application is tested, new functionalities are integrated and data are continuously imported to the graph database.

- [ ] General: Page for editing actions
- [ ] Server: User Authentification
- [ ] Client: E2E tests created
- [ ] Client: Assisting functions
- [ ] Client: Bookmark panel works
- [ ] Client: User administration panel
- [ ] Database: Data are exported to the Graph database
