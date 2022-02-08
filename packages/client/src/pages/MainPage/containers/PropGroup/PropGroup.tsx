import { IEntity, IProp } from "@shared/types";
import api from "api";
import { AttributeIcon, Button } from "components";
import React from "react";
import {
  FaCaretDown,
  FaCaretUp,
  FaPlus,
  FaTrashAlt,
  FaUnlink,
} from "react-icons/fa";
import { useQuery } from "react-query";
import { excludedSuggesterEntities } from "Theme/constants";
import {
  AttributeGroupDataObject,
  classesPropType,
  classesPropValue,
} from "types";
import { AttributesGroupEditor } from "../AttributesEditor/AttributesGroupEditor";
import { EntitySuggester, EntityTag } from "./../";
import {
  StyledGrid,
  StyledListHeaderColumn,
  StyledPropButtonGroup,
  StyledPropLineColumn,
} from "./PropGroupStyles";

interface IPropGroup {
  originId: string;
  entities: { [key: string]: IEntity };
  props: IProp[];
  territoryId: string;

  updateProp: (propId: string, changes: any) => void;
  removeProp: (propId: string) => void;
  addProp: (originId: string) => void;
  movePropDown: (propId: string) => void;
  movePropUp: (propId: string) => void;

  userCanEdit: boolean;
  openDetailOnCreate: boolean;
}

export const PropGroup: React.FC<IPropGroup> = ({
  originId,
  entities,
  props,
  territoryId,

  updateProp,
  removeProp,
  addProp,
  movePropDown,
  movePropUp,

  userCanEdit,
  openDetailOnCreate = false,
}) => {
  // territory query
  const {
    status,
    data: territoryActants,
    error,
    isFetching,
  } = useQuery(
    ["territoryActants", territoryId],
    async () => {
      if (territoryId) {
        const res = await api.entityIdsInTerritory(territoryId);
        return res.data;
      } else {
        return [];
      }
    },
    {
      initialData: [],
      enabled: !!territoryId && api.isLoggedIn(),
    }
  );

  return props.length > 0 ? (
    <tr>
      <td colSpan={4}>
        <StyledGrid>
          <React.Fragment key={originId}>
            <StyledListHeaderColumn>Type</StyledListHeaderColumn>
            <StyledListHeaderColumn>Value</StyledListHeaderColumn>
            <StyledListHeaderColumn></StyledListHeaderColumn>
            {props.map((prop1: IProp, pi1: number) => {
              return (
                <React.Fragment key={prop1.id}>
                  <PropGroupRow
                    prop={prop1}
                    entities={entities}
                    level={"1"}
                    order={pi1}
                    firstRowinGroup={pi1 === 0}
                    lastRowinGroup={pi1 === props.length - 1}
                    lastSecondLevel={false}
                    updateProp={updateProp}
                    removeProp={removeProp}
                    addProp={addProp}
                    movePropDown={movePropDown}
                    movePropUp={movePropUp}
                    userCanEdit={userCanEdit}
                    territoryActants={territoryActants || []}
                    openDetailOnCreate={openDetailOnCreate}
                  />
                  {prop1.children.map((prop2: IProp, pi2: number) => {
                    return (
                      <React.Fragment key={prop2.id}>
                        <PropGroupRow
                          prop={prop2}
                          entities={entities}
                          level={"2"}
                          order={pi2}
                          firstRowinGroup={pi2 === 0}
                          lastRowinGroup={pi2 === prop1.children.length - 1}
                          lastSecondLevel={pi2 === prop1.children.length - 1}
                          updateProp={updateProp}
                          removeProp={removeProp}
                          addProp={addProp}
                          movePropDown={movePropDown}
                          movePropUp={movePropUp}
                          userCanEdit={userCanEdit}
                          territoryActants={territoryActants || []}
                          openDetailOnCreate={openDetailOnCreate}
                        />
                      </React.Fragment>
                    );
                  })}
                </React.Fragment>
              );
            })}
          </React.Fragment>
        </StyledGrid>
      </td>
    </tr>
  ) : (
    <tr />
  );
};

interface IPropGroupRow {
  prop: IProp;
  entities: { [key: string]: IEntity };
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

const PropGroupRow: React.FC<IPropGroupRow> = ({
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
  const propTypeEntity: IEntity = entities[prop.type.id];
  const propValueEntity = entities[prop.value.id];

  return (
    <React.Fragment key={level + "|" + order}>
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
            inputWidth={"full"}
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
        padded={level === "2"}
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
            inputWidth={"full"}
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
    </React.Fragment>
  );
};
