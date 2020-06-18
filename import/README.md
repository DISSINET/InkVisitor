# DISSINET DDB Sellan registers mockup data
Mockup data taken from Sellan Coding and Sellan master tables (Persons, Locations, Objects) and General concept table.

In './source_data' there are two excel files which aggregate data from original google sheet coding tables.

Jupyter book 'From statement in coding-excel-table  to statement json mockup.ipynb' transforms source files to mockupdata.

__JSON structure example__
* statement-json-structure-example.json  for sentence "David, strong friend of Peter, saw Adam in Brno."

__Transformed mockup data__
* *actants.xlsx  (csv)*  :  actant data with *uuids*
* *statements.json* : json statements records corresponding to original statement rows from coding table; uses uuids from actants for actant objects 
   
  


