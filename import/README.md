# DISSINET DDB Pure mockup & Transformed Sellan registers mockup data
Mockup data taken from Sellan Coding and Sellan master tables (Persons, Locations, Objects) and General concept table.

In './source_data' there are two excel files which aggregate data from original google sheet coding tables.

Jupyter book 'From statement in coding-excel-table  to statement json mockup.ipynb' transforms source files to mockupdata.

__JSON structure example__
* statement-json-structure-example.json  for sentence "David, strong friend of Peter, saw Adam in Brno."

__Transformed Sellan data__
* *actants.xlsx  (csv, json)*  :  actant data with *uuids*
* *statements.json* : json statements records corresponding to original statement rows from coding table; uses uuids from actants for actant objects 


__Pure mockup data__
Pure mockup with 5 statements, variations on sentence "David, strong friend of Peter, saw Adam in Brno."

* mockup-statements.json
* actants.json
* territories.json


------------

__Na co nemyslime__
(komenty pri promysleni importu a soucaseho stavu prototypy inkVisitora)

* SOLVED statementy nemaji  primary_reference_part, secondary_reference_part ... : bude resseno pres territories

* SOLVED jak resime tzv. multiples, i.e. multiple subjects, multiple actant1 objects..?
  * *momentale v selanu jsou multiples resene jako situace A*
  * a) na root action object jsou v actants skutecne dva objekty s typem subject : toto je v poradku a prefererovane preseni
  * b) je treba zdoublit root object



  


