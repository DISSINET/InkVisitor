import { EntityEnums } from "@shared/enums";
import {
  IEntity,
  IProp,
  IResponseDetail,
  IResponseStatement,
} from "@shared/types";
import { useQuery } from "@tanstack/react-query";
import { excludedSuggesterEntities } from "Theme/constants";
import api from "api";
import { EntitySuggester } from "components/advanced";
import React, { useCallback, useState } from "react";
import {
  DraggedPropRowCategory,
  ItemTypes,
  PropAttributeFilter,
  classesAll,
} from "types";
import { FirstLevelPropGroup } from "./FirstLevelPropGroup/FirstLevelPropGroup";
import { PropGroupRow } from "./PropGroupRow/PropGroupRow";
import { StyledSpareRow } from "./PropGroupStyles";
import { SecondLevelPropGroup } from "./SecondLevelPropGroup/SecondLevelPropGroup";
import { ThirdLevelPropGroup } from "./ThirdLevelPropGroup/ThirdLevelPropGroup";

interface PropGroup {
  originId: string;
  entities: { [key: string]: IEntity };
  props: IProp[];
  territoryId: string;
  boxEntity: IResponseStatement | IResponseDetail;

  updateProp: (
    propId: string,
    changes: Partial<IProp>,
    instantUpdate?: boolean,
    languageCheck?: boolean
  ) => void;
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

  alwaysShowCreateModal?: boolean;
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

  alwaysShowCreateModal,
}) => {
  // territory query
  const {
    status,
    data: territoryActants,
    error,
    isFetching,
  } = useQuery({
    queryKey: ["territoryActants", territoryId],
    queryFn: async () => {
      if (territoryId) {
        const res = await api.entityIdsInTerritory(territoryId);
        return res.data;
      } else {
        return [];
      }
    },
    initialData: [],
    enabled: !!territoryId && api.isLoggedIn(),
  });

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
            alwaysShowCreateModal={alwaysShowCreateModal}
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
            alwaysShowCreateModal={alwaysShowCreateModal}
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
            alwaysShowCreateModal
          />
        </React.Fragment>
      );
    },
    [entities, boxEntity]
  );

  // this states are part of the spare row functionality
  const [tempTypeTyped, setTempTypeTyped] = useState("");
  const [tempValueTyped, setTempValueTyped] = useState("");
  const [fieldToUpdate, setFieldToUpdate] = useState<false | "type" | "value">(
    false
  );
  const [initTypeTyped, setInitTypeTyped] = useState("");
  const [initValueTyped, setInitValueTyped] = useState("");

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
      {/* First level meta props spare row */}
      <StyledSpareRow $marginTop={props.length > 0}>
        {/* RESOURCE */}
        <EntitySuggester
          placeholder="type"
          alwaysShowCreateModal={alwaysShowCreateModal}
          openDetailOnCreate={openDetailOnCreate}
          territoryActants={[]}
          onSelected={(newSelectedId) => {
            // onChange(
            //   [
            //     ...references,
            //     { id: uuidv4(), resource: newSelectedId, value: "" },
            //   ],
            //   true
            // );
            // if (tempValueTyped.length) {
            //   setFieldToUpdate("value");
            // }
          }}
          disableTemplatesAccept
          categoryTypes={[EntityEnums.Class.Concept]}
          isInsideTemplate={isInsideTemplate}
          territoryParentId={territoryParentId}
          disabled={!userCanEdit}
          onTyped={(typed) => setTempTypeTyped(typed)}
          externalTyped={tempTypeTyped}
        />
        {/* VALUE */}
        <EntitySuggester
          placeholder="value"
          alwaysShowCreateModal={alwaysShowCreateModal}
          excludedEntityClasses={excludedSuggesterEntities}
          openDetailOnCreate={openDetailOnCreate}
          territoryActants={[]}
          onSelected={(newSelectedId: string) => {
            // onChange(
            //   [
            //     ...references,
            //     { id: uuidv4(), resource: "", value: newSelectedId },
            //   ],
            //   true
            // );
            // if (tempResourceTyped.length) {
            //   setFieldToUpdate("resource");
            // }
          }}
          categoryTypes={classesAll}
          isInsideTemplate={isInsideTemplate}
          territoryParentId={territoryParentId}
          disabled={!userCanEdit}
          onTyped={(typed) => setTempValueTyped(typed)}
          externalTyped={tempValueTyped}
        />
      </StyledSpareRow>
    </>
  );
};
