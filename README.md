# Dissinet

# Dissinet Client

# Dissinet Database

# Dissinet Server

## Aggregates

### Statement

#### Command/Queries, Events

- CreateStatement | StatementsCreated
- UpdateStatement | StatementsUodated // This is too generic!
- FindStatement | StatementFound 
- DeleteStatement | StatementDeleted

## Endpoints 

### Statements `/statements`

#### CRUD

- [x] `GET /statements`
- [x] `GET /statements/{id}`
- [x] `POST /statements`
- [x] `DELETE /statements/{id}`

#### Paging

- [ ] `GET /statements?limit=100`
- [ ] `GET /statements?limit=100&offset=10`

#### Ordering (Sorting)

- [ ] `GET /statements/order_by=desc(certainty)`

#### Filtering

- [x] `GET /statements/{id}?territoryId={id}`


### Actants `/actants`

### Actions `/actions`

### Territories `/territories`

