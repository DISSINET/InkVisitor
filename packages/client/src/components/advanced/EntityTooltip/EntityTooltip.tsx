import { Placement } from "@popperjs/core";
import { certaintyDict } from "@shared/dictionaries";
import { RelationEnums } from "@shared/enums";
import { EntityTooltip as EntityTooltipNamespace } from "@shared/types";
import api from "api";
import { LetterIcon, TooltipNew } from "components";
import React, { useEffect, useMemo, useState } from "react";
import { AiOutlineTag } from "react-icons/ai";
import { BiCommentDetail } from "react-icons/bi";
import { BsCardText } from "react-icons/bs";
import { ImListNumbered } from "react-icons/im";
import { useQuery } from "react-query";
import { Colors } from "types";
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
  label?: string;
  detail?: string;
  text?: string;
  itemsCount?: number;
  // settings
  position?: Placement;
  // on?: EventType | EventType[];
  // noArrow?: boolean;
  color?: typeof Colors[number];
  disabled?: boolean;

  tagHovered: boolean;

  referenceElement: HTMLDivElement | null;
}
export const EntityTooltip: React.FC<EntityTooltip> = ({
  // entity
  entityId,
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
  const [tooltipData, setTooltipData] =
    useState<EntityTooltipNamespace.IResponse | false>(false);

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

  const renderRelations = useMemo(() => {
    if (tooltipData) {
      const {
        actionEventEquivalent,
        identifications,
        superclassTrees,
        superordinateLocationTrees,
        synonymCloud,
        entities,
      } = tooltipData;

      const hasRelations =
        actionEventEquivalent.length > 0 ||
        identifications.length > 0 ||
        superclassTrees.length > 0 ||
        superordinateLocationTrees.length > 0 ||
        (synonymCloud && synonymCloud.length > 0);

      return (
        <>
          {hasRelations && (
            <StyledRelations>
              {/* actionEventEquivalent - Node */}
              {actionEventEquivalent.length > 0 && (
                <>
                  <StyledLetterIconWrap>
                    <LetterIcon
                      color="white"
                      letter={RelationEnums.Type.ActionEventEquivalent}
                    />
                  </StyledLetterIconWrap>
                  <EntityTooltipRelationTreeTable
                    relationTreeArray={actionEventEquivalent}
                    entities={entities}
                  />
                </>
              )}
              {/* identifications - [] */}
              {identifications.length > 0 && (
                <>
                  <StyledLetterIconWrap>
                    <LetterIcon
                      color="white"
                      letter={RelationEnums.Type.Identification}
                    />
                  </StyledLetterIconWrap>
                  <StyledRelationTypeBlock>
                    {identifications.map((identification, key) => {
                      const entity = entities[identification.entityId];
                      // TODO: show class in text
                      return (
                        <React.Fragment key={key}>
                          {`${entity?.label} (`}
                          {certaintyDict[identification.certainty]?.label}
                          {`)${key !== identifications.length - 1 ? ", " : ""}`}
                        </React.Fragment>
                      );
                    })}
                  </StyledRelationTypeBlock>
                </>
              )}
              {/* superclassTrees - Node */}
              {superclassTrees.length > 0 && (
                <>
                  <StyledLetterIconWrap>
                    <LetterIcon
                      color="white"
                      letter={RelationEnums.Type.Superclass}
                    />
                  </StyledLetterIconWrap>
                  {/* Render tree table */}
                  <EntityTooltipRelationTreeTable
                    relationTreeArray={superclassTrees}
                    entities={entities}
                  />
                </>
              )}
              {/* superordinateLocationTrees - Node */}
              {superordinateLocationTrees.length > 0 && (
                <>
                  <StyledLetterIconWrap>
                    <LetterIcon
                      color="white"
                      letter={RelationEnums.Type.SuperordinateLocation}
                    />
                  </StyledLetterIconWrap>
                  <EntityTooltipRelationTreeTable
                    relationTreeArray={superordinateLocationTrees}
                    entities={entities}
                  />
                </>
              )}
              {/* synonymCloud - string[] */}
              {synonymCloud && synonymCloud.length > 0 && (
                <>
                  <StyledLetterIconWrap>
                    <LetterIcon
                      color="white"
                      letter={RelationEnums.Type.Synonym}
                    />
                  </StyledLetterIconWrap>
                  <StyledRelationTypeBlock>
                    {synonymCloud.map((synonym, key) => {
                      const entity = entities[synonym];
                      if (entityId === entity.id) return;

                      return (
                        <React.Fragment key={key}>
                          {`${entity?.label}${
                            key !== synonymCloud.length - 1 ? ", " : ""
                          }`}
                        </React.Fragment>
                      );
                    })}
                  </StyledRelationTypeBlock>
                </>
              )}
              {/* TODO: add new relations */}
            </StyledRelations>
          )}
        </>
      );
    }
  }, [tooltipData]);

  // TODO: tweak lifecycle - consistency when loading (check arrow)
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
      <TooltipNew
        instanceName="entity-tooltip"
        visible={showTooltip}
        referenceElement={referenceElement}
        content={renderContent}
        position={position}
        color={color}
      />
    </>
  );
};
