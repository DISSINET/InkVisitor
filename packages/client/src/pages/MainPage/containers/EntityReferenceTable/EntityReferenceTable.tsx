import { IEntity, IReference } from "@shared/types";
import { Button } from "components";
import React from "react";
import { FaPlus } from "react-icons/fa";
import {
  StyledListHeaderColumn,
  StyledReferencesList,
} from "./EntityReferenceInputStyles";
import { EntityReferenceTableRow } from "./EntityReferenceTableRow";

interface EntityReferenceTable {
  entities: { [key: string]: IEntity };
  references: IReference[];
  onChange: Function;
  disabled: boolean;
  removeReference: Function;
}

export const EntityReferenceTable: React.FC<EntityReferenceTable> = ({
  entities,
  references,
  onChange,
  disabled = true,
  removeReference,
}) => {
  // const sendChanges = (newValues: IReference[]) => {
  //   // if (JSON.stringify(newValues) !== JSON.stringify(displayValues)) {
  //   onChange(newValues);
  //   // }
  // };

  // const handleChangeSource = (key: number, newSource: OptionTypeBase) => {
  //   if (newSource) {
  //     const newValues = [...displayValues];
  //     newValues[key].source = newSource.value;
  //     sendChanges(newValues);
  //   }
  // };

  // const handleChangeValue = (key: number, newValue: string) => {
  //   const newValues = [...displayValues];
  //   newValues[key].value = newValue;
  //   sendChanges(newValues);
  // };

  // const handleDelete = (key: number) => {
  //   const newValues = [...displayValues];
  //   newValues.splice(key, 1);
  //   setDisplayValues(newValues);
  //   sendChanges(newValues);
  // };

  // const handleAdd = () => {
  //   const newValues = [...displayValues];
  //   newValues.push(CEntityReference());
  //   setDisplayValues(newValues);
  //   sendChanges(newValues);
  // };

  return (
    <React.Fragment>
      <StyledReferencesList>
        {references.length > 0 && (
          <React.Fragment>
            <StyledListHeaderColumn>Resource</StyledListHeaderColumn>
            <StyledListHeaderColumn>Part</StyledListHeaderColumn>
            <StyledListHeaderColumn></StyledListHeaderColumn>
          </React.Fragment>
        )}

        {references.map((reference: IReference, ri: number) => {
          const resourceEntity = entities[reference.resource];
          const valueEntity = entities[reference.value];
          return (
            <EntityReferenceTableRow
              key={ri}
              reference={reference}
              resource={resourceEntity}
              value={valueEntity}
              onChange={() => {}}
              disabled={disabled}
              removeReference={removeReference}
            />
          );
        })}
      </StyledReferencesList>
      {!disabled && (
        <Button
          icon={<FaPlus />}
          label={"new reference"}
          //onClick={() => handleAdd()}
        />
      )}
    </React.Fragment>
  );
};
