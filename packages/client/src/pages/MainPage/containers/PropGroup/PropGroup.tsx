import {
  IEntity,
  IProp,
  IResponseDetail,
  IResponseStatement,
} from "@shared/types";
import api from "api";
import React, { useCallback } from "react";
import { useQuery } from "react-query";
import { DraggedPropRowCategory, ItemTypes, PropAttributeFilter } from "types";
import { FirstLevelPropGroup } from "./FirstLevelPropGroup/FirstLevelPropGroup";
import { PropGroupRow } from "./PropGroupRow/PropGroupRow";
import { SecondLevelPropGroup } from "./SecondLevelPropGroup/SecondLevelPropGroup";
import { ThirdLevelPropGroup } from "./ThirdLevelPropGroup/ThirdLevelPropGroup";

interface PropGroup {
  originId: string;
  entities: { [key: string]: IEntity };
  props: IProp[];
  territoryId: string;
  boxEntity: IResponseStatement | IResponseDetail;

  updateProp: (propId: string, changes: any) => void;
  removeProp: (propId: string) => void;
  addProp: (originId: string) => void;
  movePropToIndex: (propId: string, oldIndex: number, newIndex: number) => void;

  userCanEdit: boolean;
  openDetailOnCreate: boolean;
  category: DraggedPropRowCategory;
  disabledAttributes?: PropAttributeFilter;
  isInsideTemplate: boolean;
  territoryParentId?: string;
  lowIdent?: boolean;
}

export const PropGroup: React.FC<PropGroup> = ({
  originId,
  entities,
  props,
  territoryId,
  boxEntity,

  updateProp,
  removeProp,
  addProp,
  movePropToIndex,

  userCanEdit,
  openDetailOnCreate = false,
  category,
  disabledAttributes = {} as PropAttributeFilter,
  isInsideTemplate,
  territoryParentId,
  lowIdent,
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

  const renderFirsLevelPropRow = useCallback(
    (
      prop1: IProp,
      pi1: number,
      moveProp: (dragIndex: number, hoverIndex: number) => void,
      hasOrder: boolean
    ) => {
      return (
        <React.Fragment key={prop1.id}>
          <PropGroupRow
            id={prop1.id}
            index={pi1}
            itemType={ItemTypes.PROP_ROW1}
            parentId={originId}
            prop={prop1}
            entities={entities}
            level={1}
            updateProp={updateProp}
            removeProp={removeProp}
            addProp={addProp}
            userCanEdit={userCanEdit}
            territoryActants={territoryActants || []}
            openDetailOnCreate={openDetailOnCreate}
            moveProp={moveProp}
            movePropToIndex={movePropToIndex}
            category={category}
            disabledAttributes={disabledAttributes}
            isInsideTemplate={isInsideTemplate}
            territoryParentId={territoryParentId}
            hasOrder={hasOrder}
            lowIdent={lowIdent}
          />
          {/* 2nd level */}
          <SecondLevelPropGroup
            prop1={prop1}
            renderSecondLevelPropRow={renderSecondLevelPropRow}
            secondLevelProps={prop1.children}
            category={category}
          />
        </React.Fragment>
      );
    },
    [entities, boxEntity]
  );

  const renderSecondLevelPropRow = useCallback(
    (
      prop2: IProp,
      pi2: number,
      prop1: IProp,
      moveProp: (dragIndex: number, hoverIndex: number) => void,
      hasOrder: boolean
    ) => {
      return (
        <React.Fragment key={prop2.id}>
          <PropGroupRow
            id={prop2.id}
            index={pi2}
            itemType={ItemTypes.PROP_ROW2}
            parentId={prop1.id}
            prop={prop2}
            entities={entities}
            level={2}
            updateProp={updateProp}
            removeProp={removeProp}
            addProp={addProp}
            userCanEdit={userCanEdit}
            territoryActants={territoryActants || []}
            openDetailOnCreate={openDetailOnCreate}
            moveProp={moveProp}
            movePropToIndex={movePropToIndex}
            category={category}
            disabledAttributes={disabledAttributes}
            isInsideTemplate={isInsideTemplate}
            territoryParentId={territoryParentId}
            hasOrder={hasOrder}
            lowIdent={lowIdent}
          />
          {/* 3rd level */}
          <ThirdLevelPropGroup
            prop2={prop2}
            renderThirdLevelPropRow={renderThirdLevelPropRow}
            thirdLevelProps={prop2.children}
            category={category}
          />
        </React.Fragment>
      );
    },
    [entities, boxEntity]
  );

  const renderThirdLevelPropRow = useCallback(
    (
      prop3: IProp,
      pi3: number,
      prop2: IProp,
      moveProp: (dragIndex: number, hoverIndex: number) => void,
      hasOrder: boolean
    ) => {
      return (
        <React.Fragment key={prop3.id}>
          <PropGroupRow
            id={prop3.id}
            index={pi3}
            itemType={ItemTypes.PROP_ROW3}
            parentId={prop2.id}
            prop={prop3}
            entities={entities}
            level={3}
            updateProp={updateProp}
            removeProp={removeProp}
            addProp={addProp}
            userCanEdit={userCanEdit}
            territoryActants={territoryActants || []}
            openDetailOnCreate={openDetailOnCreate}
            moveProp={moveProp}
            movePropToIndex={movePropToIndex}
            category={category}
            disabledAttributes={disabledAttributes}
            isInsideTemplate={isInsideTemplate}
            territoryParentId={territoryParentId}
            hasOrder={hasOrder}
            lowIdent={lowIdent}
          />
        </React.Fragment>
      );
    },
    [entities, boxEntity]
  );

  return (
    <>
      {props.length > 0 && (
        <React.Fragment key={originId}>
          {/* Rows */}
          <FirstLevelPropGroup
            props={props}
            renderFirsLevelPropRow={renderFirsLevelPropRow}
          />
        </React.Fragment>
      )}
    </>
  );
};
