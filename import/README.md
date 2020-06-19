## DISSINET DDB Pure mockup & Transformed Sellan registers mockup data

Contains:
* json statement example
* transformed sellan coding to json statements
* manually created mockup 5 statements
* Jupyter book 'From statement in coding-excel-table  to statement json mockup.ipynb' transforms Sellan source files to transformed data.


__JSON structure example__
* statement-json-structure-example.json  for sentence "David, strong friend of Peter, saw Adam in Brno."

__Transformed Sellan data__  in  /import_data/sellan/
* *actants.json*  :  actant data with *uuids* , no territories there
* *statements.json* : json statements records corresponding to original statement rows from coding table; uses uuids from actants for actant objects 

Mockup data taken from Sellan Coding and Sellan master tables (Persons, Locations, Objects) and General concept table. [18.6.2020]

In './source_data' there are two excel files which aggregate data from original google sheet coding tables.

Notes
* Sellan statement include has_properties action expression for parent root action in __"props" of root__, which contains location information from sellan coding, i.e.  the data column *"id_location" and "id_locaton_to"*  are used for has_propeties action-expression containing location_where/to (a1) and  LOXXX (a2)  as actants. 
*  Terrories ids are just text_parts, i.e. "T3-001", territories are not in actants.js.


__Pure mockup data__  in  /import_data/mock/

Pure mockup with 5 statements (manually created), variations on sentence "David, strong friend of Peter, saw Adam in Brno."

* statements.json
* actants.json (including territories)



  


