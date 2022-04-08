# Dropdown

## Any select setup

- concat "Any" entity to values from BE array when defining prop value (with type DropdownItem from types)

  <Dropdown
  isMulti
  options={entitiesDict}
  value={[allEntities]
  .concat(entitiesDict)
  .filter((i: any) =>
  (entity as IAction).data.entities?.a2.includes(
  i.value
  )
  )}
