# DISSINET DDB Sellan registers mockup data
Mockup data taken from Sellan Coding and Sellan master tables (Persons, Locations, Objects) and General concept table.

In './source_data' there are two source excel files aggregated from source google sheet tables.

Jupyter book 'From statement in coding-excel-table  to statement json mockup.ipynb' transforms source files to mockupdata.

__JSON structure__
* statement-json-structure-example.json

__Transformed mockup data__
* *actants.xlsx  (csv)*  :  actant data with *uuids*
* *statements.json* : json statements records corresponding to original statement rows from coding table; uses uuids from actants for actant objects 
   
  


