import { EntityEnums } from "@inkvisitor/shared/enums";
import {
  IEntity,
  IProp,
  IResponseDetail,
  IResponseStatement,
} from "@inkvisitor/shared/types";
import { excludedSuggesterEntities } from "Theme/constants";
import { EntitySuggester } from "components/advanced";
import React, { useCallback, useEffect, useState } from "react";
import { DraggedPropRowCategory, ItemTypes, PropAttributeFilter } from "types";
import { FirstLevelPropGroup } from "./FirstLevelPropGroup/FirstLevelPropGroup";
import { PropGroupRow } from "./PropGroupRow/PropGroupRow";
import { StyledSpareRow } from "./PropGroupStyles";
import { SecondLevelPropGroup } from "./SecondLevelPropGroup/SecondLevelPropGroup";
import { ThirdLevelPropGroup } from "./ThirdLevelPropGroup/ThirdLevelPropGroup";
import { FirstLevelPropGroupRow } from "./FirstLevelPropGroupRow/FirstLevelPropGroupRow";
import { classesAll } from "@inkvisitor/shared/dictionaries/entity";

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
  addPropWithEntityId?: (variables: {
    typeEntityId?: string;
    valueEntityId?: string;
  }) => void;

  userCanEdit: boolean;
  openDetailOnCreate?: boolean;
  category: DraggedPropRowCategory;
  disabledAttributes?: PropAttributeFilter;
  isInsideTemplate: boolean;
  territoryParentId?: string;
  lowIdent?: boolean;

  alwaysShowCreateModal?: boolean;
  disableSpareRow?: boolean;
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
  addPropWithEntityId,

  userCanEdit,
  openDetailOnCreate = false,
  category,
  disabledAttributes = {} as PropAttributeFilter,
  isInsideTemplate,
  territoryParentId,
  lowIdent,

  alwaysShowCreateModal,
  disableSpareRow,
}) => {
  // this states are part of the spare row functionality
  const [tempTypeTyped, setTempTypeTyped] = useState("");
  const [tempValueTyped, setTempValueTyped] = useState("");
  const [fieldToUpdate, setFieldToUpdate] = useState<false | "type" | "value">(
    false
  );
  const [initTypeTyped, setInitTypeTyped] = useState("");
  const [initValueTyped, setInitValueTyped] = useState("");
  const [autoFocusField, setAutoFocusField] = useState<false | "type" | "value">(false);

  useEffect(() => {
    if (fieldToUpdate === "type") {
      setInitTypeTyped(tempTypeTyped);
      setInitValueTyped("");
      setTempTypeTyped("");
      setFieldToUpdate(false);
    } else if (fieldToUpdate === "value") {
      setInitValueTyped(tempValueTyped);
      setInitTypeTyped("");
      setTempValueTyped("");
      setFieldToUpdate(false);
    }
    if (autoFocusField) {
      setTimeout(() => setAutoFocusField(false), 0);
    }
  }, [props]);

  const renderFirstLevelPropRow = useCallback(
    (
      prop1: IProp,
      pi1: number,
      moveProp: (dragIndex: number, hoverIndex: number) => void,
      hasOrder: boolean,
      isLast: boolean
    ) => (
      <React.Fragment
        key={pi1}
        // key={prop1.id}
      >
        <FirstLevelPropGroupRow
          prop1={prop1}
          pi1={pi1}
          moveProp={moveProp}
          hasOrder={hasOrder}
          isLast={isLast}
          addProp={addProp}
          removeProp={removeProp}
          setInitTypeTyped={setInitTypeTyped}
          setInitValueTyped={setInitValueTyped}
          updateProp={updateProp}
          movePropToIndex={movePropToIndex}
          userCanEdit={userCanEdit}
          addPropWithEntityId={addPropWithEntityId}
          territoryId={territoryId}
          entities={entities}
          disabledAttributes={disabledAttributes}
          originId={originId}
          openDetailOnCreate={openDetailOnCreate}
          category={category}
          isInsideTemplate={isInsideTemplate}
          territoryParentId={territoryParentId}
          lowIdent={lowIdent}
          alwaysShowCreateModal={alwaysShowCreateModal}
          // initTypeTyped={isLast ? initTypeTyped : undefined}
          // initValueTyped={isLast ? initValueTyped : undefined}
          autoFocusType={isLast && autoFocusField === "type"}
          autoFocusValue={isLast && autoFocusField === "value"}
        />
        {/* 2nd level */}
        <SecondLevelPropGroup
          prop1={prop1}
          renderSecondLevelPropRow={renderSecondLevelPropRow}
          secondLevelProps={prop1.children}
          category={category}
        />
      </React.Fragment>
    ),

    [entities, boxEntity, initTypeTyped, initValueTyped]
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
        <React.Fragment
          key={pi2}
          // key={prop2.id}
        >
          <PropGroupRow
            key={pi2}
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
            territoryId={territoryId}
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
        <React.Fragment
          key={pi3}
          // key={prop3.id}
        >
          <PropGroupRow
            key={pi3}
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
            territoryId={territoryId}
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

  return (
    <>
      {props.length > 0 && (
        <React.Fragment key={originId}>
          {/* Rows */}
          <FirstLevelPropGroup
            props={props}
            renderFirstLevelPropRow={renderFirstLevelPropRow}
          />
        </React.Fragment>
      )}
      {/* First level meta props spare row */}
      {userCanEdit && !disableSpareRow && (
        <StyledSpareRow $marginTop={props.length > 0}>
          {/* TYPE */}
          <EntitySuggester
            placeholder="type"
            alwaysShowCreateModal={alwaysShowCreateModal}
            openDetailOnCreate={openDetailOnCreate}
            onSelected={(newSelectedId) => {
              if (addPropWithEntityId) {
                addPropWithEntityId({ typeEntityId: newSelectedId });
                setAutoFocusField("value");
                if (tempValueTyped.length) {
                  setFieldToUpdate("value");
                }
              }
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
            onSelected={(newSelectedId: string) => {
              if (addPropWithEntityId) {
                addPropWithEntityId({ valueEntityId: newSelectedId });
                setAutoFocusField("type");
                if (tempTypeTyped.length) {
                  setFieldToUpdate("type");
                }
              }
            }}
            categoryTypes={classesAll}
            isInsideTemplate={isInsideTemplate}
            territoryParentId={territoryParentId}
            isHidden={!userCanEdit}
            onTyped={(typed) => setTempValueTyped(typed)}
            externalTyped={tempValueTyped}
          />
        </StyledSpareRow>
      )}
    </>
  );
};
