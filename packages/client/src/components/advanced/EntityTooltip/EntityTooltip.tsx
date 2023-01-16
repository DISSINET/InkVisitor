import { Placement } from "@popperjs/core";
import { certaintyDict } from "@shared/dictionaries";
import { EntityEnums, RelationEnums } from "@shared/enums";
import {
  EntityTooltip as EntityTooltipNamespace,
  IEntity,
  Relation,
} from "@shared/types";
import api from "api";
import { LetterIcon, Tooltip } from "components";
import React, { useEffect, useMemo, useState } from "react";
import { AiOutlineTag } from "react-icons/ai";
import { BiCommentDetail } from "react-icons/bi";
import { BsCardText } from "react-icons/bs";
import { ImListNumbered } from "react-icons/im";
import { useQuery } from "react-query";
import {
  maxTooltipMultiRelations,
  tooltipLabelSeparator,
} from "Theme/constants";
import { Colors } from "types";
import { getEntityRelationRules, getShortLabelByLetterCount } from "utils";
import { EntityTooltipRelationTreeTable } from "./EntityTooltipRelationTreeTable/EntityTooltipRelationTreeTable";
import {
  StyledDetail,
  StyledIconWrap,
  StyledLabel,
  StyledLetterIconWrap,
  StyledRelations,
  StyledRelationTypeBlock,
  StyledRow,
} from "./EntityTooltipStyles";

interface EntityTooltip {
  // entity
  entityId: string;
  entityClass: EntityEnums.Class;
  label?: string;
  detail?: string;
  text?: string;
  itemsCount?: number;
  // settings
  position?: Placement;
  color?: typeof Colors[number];
  disabled?: boolean;

  tagHovered: boolean;

  referenceElement: HTMLDivElement | null;
}
export const EntityTooltip: React.FC<EntityTooltip> = ({
  // entity
  entityId,
  entityClass,
  label,
  detail,
  text,
  itemsCount,
  // settings
  position,
  color,
  disabled,

  tagHovered,
  //
  referenceElement,
}) => {
  const [tooltipData, setTooltipData] = useState<
    EntityTooltipNamespace.IResponse | false
  >(false);

  const { data, isFetching, isSuccess } = useQuery(
    ["tooltip", entityId, tagHovered],
    async () => {
      const res = await api.tooltipGet(entityId);
      setTooltipData(res.data);
      return res.data;
    },
    {
      enabled: api.isLoggedIn() && !!entityId && tagHovered,
    }
  );

  const renderEntityInfo = useMemo(
    () => (
      <>
        {(text || detail || label) && (
          <>
            <StyledRow>
              <StyledIconWrap>
                <AiOutlineTag />
              </StyledIconWrap>
              <StyledLabel>{label}</StyledLabel>
            </StyledRow>
            {text && (
              <StyledRow>
                <StyledIconWrap>{<BsCardText />}</StyledIconWrap>
                <StyledDetail>{text}</StyledDetail>
              </StyledRow>
            )}
            {detail && (
              <StyledRow>
                <StyledIconWrap>
                  <BiCommentDetail />
                </StyledIconWrap>

                <StyledDetail>{detail}</StyledDetail>
              </StyledRow>
            )}
            {itemsCount !== undefined && (
              <StyledRow>
                <StyledIconWrap>
                  <ImListNumbered />
                </StyledIconWrap>
                <StyledDetail>{itemsCount}</StyledDetail>
              </StyledRow>
            )}
          </>
        )}
      </>
    ),
    [text, detail, label, itemsCount]
  );

  const renderCloudRelations = (
    entities: Record<string, IEntity>,
    cloudRelationIds: string[]
  ) => {
    const filteredCloudRelationIds = cloudRelationIds.filter(
      (rId) => entities[rId]?.id !== entityId
    );
    return (
      <>
        {cloudRelationIds && (
          <StyledRelationTypeBlock>
            {filteredCloudRelationIds.map((cloudEntityId, key) => {
              const relationEntity = entities[cloudEntityId];

              return (
                <React.Fragment key={key}>
                  {`${relationEntity?.label}${
                    key !== filteredCloudRelationIds.length - 1
                      ? tooltipLabelSeparator
                      : ""
                  }`}
                </React.Fragment>
              );
            })}
          </StyledRelationTypeBlock>
        )}
      </>
    );
  };

  const renderRelations = useMemo(() => {
    if (tooltipData) {
      const { relations, entities } = tooltipData || {};

      const filteredTypes = getEntityRelationRules(
        entityClass,
        RelationEnums.TooltipTypes
      );

      const relationsCount: number[] = filteredTypes.map((t) =>
        relations[t]?.connections ? relations[t]!.connections.length : 0
      );
      const hasRelations = relationsCount.some((count) => count > 0);
      // => some relations has non related connections in data-import

      return (
        <>
          {hasRelations && (
            <StyledRelations>
              {filteredTypes.map((relationType, key) => {
                const currentRelations = relations[relationType]?.connections;

                const hasConnection =
                  currentRelations && currentRelations.length > 0;

                const relationRule: Relation.RelationRule =
                  Relation.RelationRules[relationType]!;

                return (
                  <React.Fragment key={key}>
                    {hasConnection && (
                      <>
                        <StyledLetterIconWrap>
                          <LetterIcon color="white" letter={relationType} />
                        </StyledLetterIconWrap>
                        {relationRule.cloudType &&
                        currentRelations[0]?.entityIds ? (
                          renderCloudRelations(
                            entities,
                            currentRelations[0].entityIds
                          )
                        ) : (
                          <>
                            {relationRule.treeType ? (
                              <EntityTooltipRelationTreeTable
                                relationTreeArray={currentRelations}
                                entities={entities}
                              />
                            ) : (
                              // Multiple - Identification with certainty / classification
                              <StyledRelationTypeBlock>
                                {currentRelations &&
                                  currentRelations
                                    .slice(0, maxTooltipMultiRelations)
                                    .map((connection, key) => {
                                      const entity =
                                        entities[
                                          connection.entityIds[0] === entityId
                                            ? connection.entityIds[1]
                                            : connection.entityIds[0]
                                        ];
                                      const certainty = (
                                        connection as Relation.IConnection<Relation.IIdentification>
                                      ).certainty;

                                      return (
                                        <React.Fragment key={key}>
                                          {getShortLabelByLetterCount(
                                            entity?.label,
                                            40
                                          )}
                                          {certainty
                                            ? ` (${certaintyDict[certainty]?.label})`
                                            : ""}
                                          {key < currentRelations.length - 1 &&
                                          key < maxTooltipMultiRelations - 1
                                            ? tooltipLabelSeparator
                                            : ""}
                                        </React.Fragment>
                                      );
                                    })}
                              </StyledRelationTypeBlock>
                            )}
                          </>
                        )}
                      </>
                    )}
                  </React.Fragment>
                );
              })}
            </StyledRelations>
          )}
        </>
      );
    }
  }, [tooltipData]);

  const renderContent = useMemo(
    () => (
      <>
        {renderEntityInfo}
        {renderRelations}
      </>
    ),
    [tooltipData]
  );

  const [showTooltip, setShowTooltip] = useState(false);

  useEffect(() => {
    if (!disabled) {
      setShowTooltip(true);
    } else {
      setShowTooltip(false);
    }
  }, [disabled]);

  return (
    <>
      <Tooltip
        visible={showTooltip}
        referenceElement={referenceElement}
        content={renderContent}
        position={position}
        color={color}
      />
    </>
  );
};
