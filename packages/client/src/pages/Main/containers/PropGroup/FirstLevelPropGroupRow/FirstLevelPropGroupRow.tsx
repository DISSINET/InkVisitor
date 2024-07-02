import { IEntity, IProp } from "@shared/types";
import React, { useEffect } from "react";
import { DraggedPropRowCategory, ItemTypes, PropAttributeFilter } from "types";
import { PropGroupRow } from "../PropGroupRow/PropGroupRow";

interface FirstLevelPropGroupRow {
  prop1: IProp;
  pi1: number;
  moveProp: (dragIndex: number, hoverIndex: number) => void;
  hasOrder: boolean;
  isLast: boolean;

  updateProp: (
    propId: string,
    changes: Partial<IProp>,
    instantUpdate?: boolean,
    languageCheck?: boolean
  ) => void;
  removeProp: (propId: string) => void;
  addProp: (originId: string) => void;
  movePropToIndex: (propId: string, oldIndex: number, newIndex: number) => void;
  addPropWithEntityId: (variables: {
    typeEntityId?: string;
    valueEntityId?: string;
  }) => void;

  setInitTypeTyped: (value: React.SetStateAction<string>) => void;
  setInitValueTyped: (value: React.SetStateAction<string>) => void;

  userCanEdit: boolean;
  territoryActants: string[];
  entities: {
    [key: string]: IEntity;
  };
  disabledAttributes: PropAttributeFilter;
  originId: string;
  openDetailOnCreate: boolean;
  category: DraggedPropRowCategory;
  isInsideTemplate: boolean;
  territoryParentId?: string;
  lowIdent?: boolean;
  alwaysShowCreateModal?: boolean;
  initTypeTyped?: string;
  initValueTyped?: string;
}
export const FirstLevelPropGroupRow: React.FC<FirstLevelPropGroupRow> = ({
  prop1,
  pi1,
  hasOrder,
  isLast,
  moveProp,
  updateProp,
  removeProp,
  addProp,
  movePropToIndex,
  setInitTypeTyped,
  setInitValueTyped,

  userCanEdit,
  territoryActants,
  entities,
  disabledAttributes,
  originId,
  openDetailOnCreate,
  category,

  isInsideTemplate,
  territoryParentId,
  lowIdent,
  alwaysShowCreateModal,
  initTypeTyped,
  initValueTyped,
}) => {
  useEffect(() => {
    setInitTypeTyped("");
    setInitValueTyped("");
  }, []);

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
        initTypeTyped={isLast ? initTypeTyped : undefined}
        initValueTyped={isLast ? initValueTyped : undefined}
      />
    </React.Fragment>
  );
};
