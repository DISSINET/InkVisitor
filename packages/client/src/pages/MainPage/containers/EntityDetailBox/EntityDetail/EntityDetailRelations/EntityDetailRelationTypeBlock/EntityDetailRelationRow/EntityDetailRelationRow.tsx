import { certaintyDict } from "@shared/dictionaries";
import { RelationEnums } from "@shared/enums";
import { IResponseEntity, IResponseGeneric, Relation } from "@shared/types";
import { AxiosResponse } from "axios";
import { Button, Dropdown } from "components";
import { EntityTag } from "components/advanced";
import React from "react";
import { FaUnlink } from "react-icons/fa";
import { UseMutationResult } from "react-query";
import {
  StyledEntityWrapper,
  StyledGrid,
  StyledRelation,
} from "../EntityDetailRelationTypeBlockStyles";

interface EntityDetailRelationRow {
  relation: Relation.IRelation;
  entityId: string;
  relationRule: Relation.RelationRule;
  relationType: RelationEnums.Type;
  entities?: IResponseEntity[];
  relationUpdateMutation: UseMutationResult<
    AxiosResponse<IResponseGeneric>,
    unknown,
    {
      relationId: string;
      changes: any;
    },
    unknown
  >;
  relationDeleteMutation: UseMutationResult<
    AxiosResponse<IResponseGeneric>,
    unknown,
    string,
    unknown
  >;
}
export const EntityDetailRelationRow: React.FC<EntityDetailRelationRow> = ({
  relation,
  relationRule,
  entityId,
  relationType,
  entities,
  relationUpdateMutation,
  relationDeleteMutation,
}) => {
  const handleMultiRemove = (relationId: string) => {
    relationDeleteMutation.mutate(relationId);
  };

  const shouldBeRendered = (key: number) =>
    !relationRule.asymmetrical || (relationRule.asymmetrical && key > 0);

  const renderCertainty = (relation: Relation.IRelation) => (
    <div>
      <Dropdown
        width={140}
        placeholder="certainty"
        options={certaintyDict}
        value={{
          value: (relation as Relation.IIdentification).certainty,
          label: certaintyDict.find(
            (c) => c.value === (relation as Relation.IIdentification).certainty
          )?.label,
        }}
        onChange={(newValue: any) => {
          relationUpdateMutation.mutate({
            relationId: relation.id,
            changes: { certainty: newValue.value as string },
          });
        }}
      />
    </div>
  );

  return (
    <StyledGrid hasAttribute={relationRule.attributes.length > 0}>
      <StyledRelation>
        {relation.entityIds.map((relationEntityId, key) => {
          const relationEntity = entities?.find(
            (e) => e.id === relationEntityId
          );
          return (
            <React.Fragment key={key}>
              {relationEntity &&
                relationEntity.id !== entityId &&
                shouldBeRendered(key) && (
                  <StyledEntityWrapper key={key}>
                    {/* <FaGripVertical /> */}
                    <EntityTag
                      fullWidth
                      entity={relationEntity}
                      button={
                        <Button
                          key="d"
                          icon={<FaUnlink />}
                          color="plain"
                          inverted
                          tooltip="unlink"
                          onClick={() => handleMultiRemove(relation.id)}
                        />
                      }
                    />
                  </StyledEntityWrapper>
                )}
            </React.Fragment>
          );
        })}
      </StyledRelation>

      {/* Certainty (Identification) */}
      {relationType === RelationEnums.Type.Identification &&
        renderCertainty(relation)}
    </StyledGrid>
  );
};
