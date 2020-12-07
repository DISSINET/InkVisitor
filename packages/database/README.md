# Database

## Data import

The script `import-rethinkdb.js` imports JSON data to RethiinkDB.

## Database setting

Install and run rethink DB

- wget https://download.rethinkdb.com/repository/centos/8/x86_64/rethinkdb-2.4.1.x86_64.rpm
- sudo rpm rethinkdb-2.4.1.x86_64.rpm
- sudo rethinkdb --bind all --http-port 9000
- sudo nano /etc/rethinkdb/instances.d/instance1.conf - edit http-port and bind
- sudo /etc/init.d/rethinkdb restart

## DISSINET DDB Pure mockup & Transformed Sellan registers mockup data

Contains:

- json statement example
- transformed sellan coding to json statements
- manually created mockup 5 statements
- Jupyter book 'From statement in coding-excel-table to statement json mockup.ipynb' transforms Sellan source files to transformed data.

**JSON structure example**

- statement-json-structure-example.json for sentence "David, strong friend of Peter, saw Adam in Brno."

**Transformed Sellan data** in /import_data/sellan/

- _actants.json_ : actant data with _uuids_ , no territories there
- _statements.json_ : json statements records corresponding to original statement rows from coding table; uses uuids from actants for actant objects

Mockup data taken from Sellan Coding and Sellan master tables (Persons, Locations, Objects) and General concept table. [18.6.2020]

In './source_data' there are two excel files which aggregate data from original google sheet coding tables.

Notes

- Sellan statement include has*properties action expression for parent root action in **"props" of root**, which contains location information from sellan coding, i.e. the data column *"id*location" and "id_locaton_to"* are used for has_propeties action-expression containing location_where/to (a1) and LOXXX (a2) as actants.
- Terrories ids are just text_parts, i.e. "T3-001", territories are not in actants.js.

**Pure mockup data** in /import_data/mock/

Pure mockup with 5 statements (manually created), variations on sentence "David, strong friend of Peter, saw Adam in Brno."

- statements.json
- actants.json (including territories)
