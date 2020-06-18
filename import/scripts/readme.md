------------------------------------------------------------
OLD  Adam's scripts


# DISSINET DDB-paser
dissinet.cz
The first part of the DDB infrastructure that parser spreadsheet tables to the DDB ontology.

BEFORE RUN

- install neo4j and set the db
- create `config.json` and add access data to the db (see util/upload.js)
- create `token.json` according to [google docs](https://developers.google.com/sheets/api/guides/authorizing)

RUN:

- `npm install`
- `node parse.js`
