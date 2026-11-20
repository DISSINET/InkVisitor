import { IProp, IResponseDetail, IResponseStatement } from "@inkvisitor/shared/types";
import { CMetaProp } from "constructors";
import React from "react";
import { DraggedPropRowCategory } from "types";
import {
  addChildMetaProp,
  moveMetaProp,
  removeMetaProp,
  updateMetaProp,
} from "utils/metaProps";
import { PropGroup } from "../../../PropGroup/PropGroup";
import { StyledPropGroupWrap } from "../EntityDetailStyles";

interface EntityDetailMetaProps {
  entity: IResponseDetail | IResponseStatement;
  onPropsChange: (props: IProp[]) => void;
  userCanEdit: boolean;
  territoryParentId?: string;
}
export const EntityDetailMetaProps: React.FC<EntityDetailMetaProps> = ({
  entity,
  onPropsChange,
  userCanEdit,
  territoryParentId,
}) => {
  return (
    <StyledPropGroupWrap>
      <PropGroup
        boxEntity={entity}
        originId={entity.id}
        entities={entity.entities}
        props={entity.props}
        updateProp={(propId: string, changes: Partial<IProp>) => {
          onPropsChange(updateMetaProp(entity.props, propId, changes));
        }}
        removeProp={(propId: string) => {
          onPropsChange(removeMetaProp(entity.props, propId));
        }}
        // adds only on the second or third level; the first level is added with an entity id
        addProp={(originId: string) => {
          onPropsChange(addChildMetaProp(entity.props, originId, CMetaProp()));
        }}
        addPropWithEntityId={(variables: { typeEntityId?: string; valueEntityId?: string }) => {
          onPropsChange([...entity.props, CMetaProp(variables)]);
        }}
        userCanEdit={userCanEdit}
        movePropToIndex={(propId, oldIndex, newIndex) => {
          onPropsChange(moveMetaProp(entity.props, propId, oldIndex, newIndex));
        }}
        category={DraggedPropRowCategory.META_PROP}
        // disabledAttributes={
        //   {
        //     statement: ["moodvariant", "mood", "bundleOperator"],
        //     type: ["logic", "virtuality", "partitivity"],
        //     value: ["logic", "virtuality", "partitivity"],
        //   } as PropAttributeFilter
        // }
        isInsideTemplate={entity.isTemplate || false}
        territoryParentId={territoryParentId}
        lowIdent
        alwaysShowCreateModal
      />
    </StyledPropGroupWrap>
  );
};
