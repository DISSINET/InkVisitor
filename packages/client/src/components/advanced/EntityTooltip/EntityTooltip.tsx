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
import { Colors } from "types";
import { getEntityRelationRules } from "utils";
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
    cloudRelationIds?: string[]
  ) => {
    return (
      <>
        {cloudRelationIds && (
          <StyledRelationTypeBlock>
            {cloudRelationIds.map((cloudEntityId, key) => {
              const entity = entities[cloudEntityId];
              if (!entity || entityId === entity.id) return;

              return (
                <React.Fragment key={key}>
                  {`${entity?.label}${
                    key !== cloudRelationIds.length! - 1 ? ", " : ""
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

      const { AEE, CLA, IDE, SCL, SOL, SYN } = relations;

      const filteredTypes = getEntityRelationRules(
        entityClass,
        RelationEnums.TooltipTypes
      );

      const relationsCount: number[] = filteredTypes.map((t) =>
        relations[t]?.connections ? relations[t]!.connections.length : 0
      );
      const hasRelations = relationsCount.some((count) => count > 0);
      // TODO: filter relations related to entity class
      // => some relations has non related connections in data-import
      console.log(relationsCount);
      console.log(relations);
      console.log(filteredTypes);

      return (
        <>
          {hasRelations && (
            <StyledRelations>
              {filteredTypes.map((relationType, key) => {
                const hasConnection =
                  relations[relationType]?.connections &&
                  relations[relationType]?.connections.length! > 0;

                const relationRule: Relation.RelationRule =
                  Relation.RelationRules[relationType]!;

                return (
                  <React.Fragment key={key}>
                    {hasConnection && (
                      <>
                        <StyledLetterIconWrap>
                          <LetterIcon color="white" letter={relationType} />
                        </StyledLetterIconWrap>
                        {relationRule.cloudType ? (
                          renderCloudRelations(
                            entities,
                            relations[relationType]?.connections[0]?.entityIds
                          )
                        ) : (
                          <>
                            {relationRule.treeType ? (
                              // Tree type
                              <div />
                            ) : (
                              // Multiple - Identification with certainty / classification
                              <div />
                            )}
                          </>
                        )}
                      </>
                    )}
                  </React.Fragment>
                );
              })}
              {/* {AEE?.connections.length! > 0 && (
                 <>
                   <StyledLetterIconWrap>
                     <LetterIcon
                       color="white"
                       letter={RelationEnums.Type.ActionEventEquivalent}
                     />
                   </StyledLetterIconWrap>
                   <EntityTooltipRelationTreeTable
                     relationTreeArray={AEE?.connections[0]}
                     entities={entities}
                   />
                 </>
               )} */}
            </StyledRelations>
          )}
        </>
      );
      // return (
      //   <>
      //     {hasRelations && (
      //       <StyledRelations>
      //         {/* actionEventEquivalent - Node */}
      //         {actionEventEquivalent.length > 0 && (
      //           <>
      //             <StyledLetterIconWrap>
      //               <LetterIcon
      //                 color="white"
      //                 letter={RelationEnums.Type.ActionEventEquivalent}
      //               />
      //             </StyledLetterIconWrap>
      //             <EntityTooltipRelationTreeTable
      //               relationTreeArray={actionEventEquivalent}
      //               entities={entities}
      //             />
      //           </>
      //         )}
      //         {/* identifications - [] */}
      //         {identifications.length > 0 && (
      //           <>
      //             <StyledLetterIconWrap>
      //               <LetterIcon
      //                 color="white"
      //                 letter={RelationEnums.Type.Identification}
      //               />
      //             </StyledLetterIconWrap>
      //             <StyledRelationTypeBlock>
      //               {identifications.map((identification, key) => {
      //                 const entity = entities[identification.entityId];
      //                 // TODO: show class in text
      //                 return entity ? (
      //                   <React.Fragment key={key}>
      //                     {`${entity?.label} (`}
      //                     {certaintyDict[identification.certainty]?.label}
      //                     {`)${key !== identifications.length - 1 ? ", " : ""}`}
      //                   </React.Fragment>
      //                 ) : null;
      //               })}
      //             </StyledRelationTypeBlock>
      //           </>
      //         )}
      //         {/* superclassTrees - Node */}
      //         {superclassTrees.length > 0 && (
      //           <>
      //             <StyledLetterIconWrap>
      //               <LetterIcon
      //                 color="white"
      //                 letter={RelationEnums.Type.Superclass}
      //               />
      //             </StyledLetterIconWrap>
      //             {/* Render tree table */}
      //             <EntityTooltipRelationTreeTable
      //               relationTreeArray={superclassTrees}
      //               entities={entities}
      //             />
      //           </>
      //         )}
      //         {/* superordinateLocationTrees - Node */}
      //         {superordinateLocationTrees.length > 0 && (
      //           <>
      //             <StyledLetterIconWrap>
      //               <LetterIcon
      //                 color="white"
      //                 letter={RelationEnums.Type.SuperordinateLocation}
      //               />
      //             </StyledLetterIconWrap>
      //             <EntityTooltipRelationTreeTable
      //               relationTreeArray={superordinateLocationTrees}
      //               entities={entities}
      //             />
      //           </>
      //         )}
      //         {/* synonymCloud - string[] */}
      //         {synonymCloud && synonymCloud.length > 0 && (
      //           <>
      //             <StyledLetterIconWrap>
      //               <LetterIcon
      //                 color="white"
      //                 letter={RelationEnums.Type.Synonym}
      //               />
      //             </StyledLetterIconWrap>
      //             <StyledRelationTypeBlock>
      //               {synonymCloud.map((synonym, key) => {
      //                 const entity = entities[synonym];
      //                 if (!entity || entityId === entity.id) return;

      //                 return (
      //                   <React.Fragment key={key}>
      //                     {`${entity?.label}${
      //                       key !== synonymCloud.length - 1 ? ", " : ""
      //                     }`}
      //                   </React.Fragment>
      //                 );
      //               })}
      //             </StyledRelationTypeBlock>
      //           </>
      //         )}
      //         {/* TODO: add new relations */}
      //       </StyledRelations>
      //     )}
      //   </>
      // );
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
