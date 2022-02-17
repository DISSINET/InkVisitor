import { IActant, IProp } from "@shared/types";
import { Button, AttributeIcon } from "components";
import React from "react";
import {
  FaUnlink,
  FaPlus,
  FaTrashAlt,
  FaCaretUp,
  FaCaretDown,
} from "react-icons/fa";
import { excludedSuggesterEntities } from "Theme/constants";
import {
  classesPropType,
  classesPropValue,
  AttributeGroupDataObject,
} from "types";
import { EntityTag, EntitySuggester } from "../..";
import { AttributesGroupEditor } from "../../AttributesEditor/AttributesGroupEditor";
import {
  StyledGrid,
  StyledPropLineColumn,
  StyledPropButtonGroup,
} from "../PropGroupStyles";

interface IPropGroupRow {
  prop: IProp;
  entities: { [key: string]: IActant };
  level: "1" | "2";
  order: number;
  firstRowinGroup?: boolean;
  lastRowinGroup?: boolean;
  lastSecondLevel?: boolean;

  updateProp: (propId: string, changes: any) => void;
  removeProp: (propId: string) => void;
  addProp: (originId: string) => void;
  movePropDown: (propId: string) => void;
  movePropUp: (propId: string) => void;

  userCanEdit: boolean;
  territoryActants: string[];
  openDetailOnCreate: boolean;
}

export const PropGroupRow: React.FC<IPropGroupRow> = ({
  prop,
  entities,
  level,
  order,
  firstRowinGroup = false,
  lastRowinGroup = false,
  lastSecondLevel = false,
  updateProp,
  removeProp,
  addProp,
  movePropDown,
  movePropUp,
  userCanEdit,
  territoryActants = [],
  openDetailOnCreate = false,
}) => {
  const propTypeEntity: IActant = entities[prop.type.id];
  const propValueEntity = entities[prop.value.id];

  return (
    <React.Fragment key={level + "|" + order}>
      <StyledGrid>
        <StyledPropLineColumn
          padded={level === "2"}
          lastSecondLevel={lastSecondLevel}
          isTag={propTypeEntity ? true : false}
        >
          {propTypeEntity ? (
            <EntityTag
              actant={propTypeEntity}
              fullWidth
              button={
                <Button
                  key="d"
                  icon={<FaUnlink />}
                  color="plain"
                  inverted={true}
                  tooltip="unlink actant"
                  onClick={() => {
                    updateProp(prop.id, {
                      type: {
                        ...prop.type,
                        ...{ id: "" },
                      },
                    });
                  }}
                />
              }
            />
          ) : (
            <EntitySuggester
              territoryActants={territoryActants}
              onSelected={(newSelectedId: string) => {
                updateProp(prop.id, {
                  type: {
                    ...prop.type,
                    ...{ id: newSelectedId },
                  },
                });
              }}
              openDetailOnCreate={openDetailOnCreate}
              categoryTypes={classesPropType}
              inputWidth={90}
              excludedEntities={excludedSuggesterEntities}
            />
          )}
          <StyledPropButtonGroup>
            {prop.type.logic == "2" ? (
              <Button
                key="neg"
                tooltip="Negative logic"
                color="success"
                inverted={true}
                noBorder
                icon={<AttributeIcon attributeName={"negation"} />}
              />
            ) : (
              <div />
            )}
          </StyledPropButtonGroup>
        </StyledPropLineColumn>
        <StyledPropLineColumn
          lastSecondLevel={lastSecondLevel}
          isTag={propValueEntity ? true : false}
        >
          {propValueEntity ? (
            <EntityTag
              actant={propValueEntity}
              fullWidth
              button={
                <Button
                  key="d"
                  icon={<FaUnlink />}
                  tooltip="unlink actant"
                  color="plain"
                  inverted={true}
                  onClick={() => {
                    updateProp(prop.id, {
                      value: {
                        ...prop.value,
                        ...{ id: "" },
                      },
                    });
                  }}
                />
              }
            />
          ) : (
            <EntitySuggester
              territoryActants={[]}
              onSelected={(newSelectedId: string) => {
                updateProp(prop.id, {
                  value: {
                    ...prop.type,
                    ...{ id: newSelectedId },
                  },
                });
              }}
              openDetailOnCreate={openDetailOnCreate}
              categoryTypes={classesPropValue}
              inputWidth={90}
              excludedEntities={excludedSuggesterEntities}
            />
          )}
          <StyledPropButtonGroup>
            {prop.value.logic == "2" ? (
              <Button
                key="neg"
                tooltip="Negative logic"
                color="success"
                inverted={true}
                noBorder
                icon={<AttributeIcon attributeName={"negation"} />}
              />
            ) : (
              <div />
            )}
          </StyledPropButtonGroup>
        </StyledPropLineColumn>

        <StyledPropLineColumn lastSecondLevel={lastSecondLevel}>
          <StyledPropButtonGroup>
            <AttributesGroupEditor
              modalTitle={`Property attributes`}
              disabledAllAttributes={!userCanEdit}
              propTypeActant={propTypeEntity}
              propValueActant={propValueEntity}
              excludedSuggesterEntities={excludedSuggesterEntities}
              classesPropType={classesPropType}
              classesPropValue={classesPropValue}
              updateProp={updateProp}
              statementId={prop.id}
              data={{
                statement: {
                  elvl: prop.elvl,
                  certainty: prop.certainty,
                  logic: prop.logic,
                  mood: prop.mood,
                  moodvariant: prop.moodvariant,
                  operator: prop.operator,
                  bundleStart: prop.bundleStart,
                  bundleEnd: prop.bundleEnd,
                },
                type: {
                  elvl: prop.type.elvl,
                  logic: prop.type.logic,
                  virtuality: prop.type.virtuality,
                  partitivity: prop.type.partitivity,
                },
                value: {
                  elvl: prop.value.elvl,
                  logic: prop.value.logic,
                  virtuality: prop.value.virtuality,
                  partitivity: prop.value.partitivity,
                },
              }}
              handleUpdate={(newData: AttributeGroupDataObject) => {
                const newDataObject = {
                  ...newData.statement,
                  ...newData,
                };
                const { statement, ...statementPropObject } = newDataObject;
                updateProp(prop.id, statementPropObject);
              }}
              userCanEdit={userCanEdit}
            />

            {level === "1" && (
              <Button
                key="add"
                icon={<FaPlus />}
                tooltip="add second level prop"
                color="plain"
                inverted={true}
                onClick={() => {
                  addProp(prop.id);
                }}
              />
            )}
            <Button
              key="delete"
              icon={<FaTrashAlt />}
              tooltip="remove prop row"
              color="plain"
              inverted={true}
              onClick={() => {
                removeProp(prop.id);
              }}
            />
            <Button
              key="up"
              inverted
              disabled={firstRowinGroup}
              icon={<FaCaretUp />}
              tooltip="move prop up"
              color="plain"
              onClick={() => {
                movePropUp(prop.id);
              }}
            />
            <Button
              key="down"
              inverted
              disabled={lastRowinGroup}
              icon={<FaCaretDown />}
              tooltip="move prop down"
              color="plain"
              onClick={() => {
                movePropDown(prop.id);
              }}
            />
            {prop.logic == "2" ? (
              <Button
                key="neg"
                tooltip="Negative logic"
                color="success"
                inverted={true}
                noBorder
                icon={<AttributeIcon attributeName={"negation"} />}
              />
            ) : (
              <div />
            )}
            {prop.operator ? (
              <Button
                key="oper"
                tooltip="Logical operator type"
                color="success"
                inverted={true}
                noBorder
                icon={prop.operator}
              />
            ) : (
              <div />
            )}
          </StyledPropButtonGroup>
        </StyledPropLineColumn>
      </StyledGrid>
    </React.Fragment>
  );
};
