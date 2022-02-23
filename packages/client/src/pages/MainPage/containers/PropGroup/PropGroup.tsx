import { IEntity, IProp } from "@shared/types";
import api from "api";
import React, { useCallback, useEffect, useState } from "react";
import { useQuery } from "react-query";
import { PropGroupRow } from "./PropGroupRow/PropGroupRow";
import { StyledGrid, StyledListHeaderColumn } from "./PropGroupStyles";
import update from "immutability-helper";
import { SecondLevelPropGroup } from "./SecondLevelPropGroup/SecondLevelPropGroup";
import { ThirdLevelPropGroup } from "./ThirdLevelPropGroup/ThirdLevelPropGroup";
import { ItemTypes } from "types";
import { FirstLevelPropGroup } from "./FirstLevelPropGroup/FirstLevelPropGroup";

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

  // PREPARATION FOR DRAG AND DROP
  const renderFirsLevelPropRow = useCallback(
    (prop1: IProp, pi1: number) => {
      return (
        <div key={prop1.id}>
          <PropGroupRow
            key={prop1.id}
            id={prop1.id}
            index={pi1}
            prop={prop1}
            entities={entities}
            level={"1"}
            order={pi1}
            firstRowinGroup={pi1 === 0}
            lastRowinGroup={pi1 === props.length - 1}
            updateProp={updateProp}
            removeProp={removeProp}
            addProp={addProp}
            movePropDown={movePropDown}
            movePropUp={movePropUp}
            userCanEdit={userCanEdit}
            territoryActants={territoryActants || []}
            openDetailOnCreate={openDetailOnCreate}
          />
          {/* 2nd level */}
          <SecondLevelPropGroup
            prop1={prop1}
            renderSecondLevelPropRow={renderSecondLevelPropRow}
          />
        </div>
      );
    },
    [entities]
  );

  const renderSecondLevelPropRow = useCallback(
    (prop2: IProp, pi2: number, prop1: IProp) => {
      prop2.children;
      return (
        <div key={prop2.id}>
          <PropGroupRow
            key={prop2.id}
            id={prop2.id}
            index={pi2}
            prop={prop2}
            entities={entities}
            level={"2"}
            order={pi2}
            firstRowinGroup={pi2 === 0}
            lastRowinGroup={pi2 === prop1.children.length - 1}
            lastInGroup={pi2 === prop1.children.length - 1}
            updateProp={updateProp}
            removeProp={removeProp}
            addProp={addProp}
            movePropDown={movePropDown}
            movePropUp={movePropUp}
            userCanEdit={userCanEdit}
            territoryActants={territoryActants || []}
            openDetailOnCreate={openDetailOnCreate}
          />
          {/* 3rd level */}
          <ThirdLevelPropGroup
            prop1={prop1}
            pi2={pi2}
            renderThirdLevelPropRow={renderThirdLevelPropRow}
          />
        </div>
      );
    },
    [entities]
  );

  const renderThirdLevelPropRow = useCallback(
    (prop3: IProp, pi3: number, prop1: IProp, pi2: number) => {
      return (
        <PropGroupRow
          key={pi3}
          id={prop3.id}
          index={pi3}
          prop={prop3}
          entities={entities}
          level={"3"}
          order={pi3}
          firstRowinGroup={pi3 === 0}
          lastRowinGroup={pi3 === prop1.children.length - 1}
          lastInGroup={pi3 === prop1.children[pi2].children.length - 1}
          updateProp={updateProp}
          removeProp={removeProp}
          addProp={addProp}
          movePropDown={movePropDown}
          movePropUp={movePropUp}
          userCanEdit={userCanEdit}
          territoryActants={territoryActants || []}
          openDetailOnCreate={openDetailOnCreate}
        />
      );
    },
    [entities]
  );

  return props.length > 0 ? (
    <tr>
      <td colSpan={4}>
        <React.Fragment key={originId}>
          <StyledGrid>
            {/* Header */}
            <StyledListHeaderColumn>Type</StyledListHeaderColumn>
            <StyledListHeaderColumn>Value</StyledListHeaderColumn>
            <StyledListHeaderColumn></StyledListHeaderColumn>
          </StyledGrid>
          {/* Rows */}
          <FirstLevelPropGroup
            props={props}
            renderFirsLevelPropRow={renderFirsLevelPropRow}
          />
        </React.Fragment>
      </td>
    </tr>
  ) : (
    <tr />
  );
};
