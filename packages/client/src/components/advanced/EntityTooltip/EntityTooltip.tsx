import api from "api";
import { LetterIcon, Loader, Tooltip } from "components";
import React, { ReactElement, useEffect, useState } from "react";
import { AiOutlineTag } from "react-icons/ai";
import { BiCommentDetail } from "react-icons/bi";
import { BsCardText } from "react-icons/bs";
import { ImListNumbered } from "react-icons/im";
import { useQuery } from "react-query";
import { EventType, PopupPosition } from "reactjs-popup/dist/types";
import { Colors } from "types";
import {
  StyledDetail,
  StyledFlexColumn,
  StyledFlexRow,
  StyledGridRowHalf,
  StyledGridRowThird,
  StyledIconWrap,
  StyledLabel,
  StyledLetterIconWrap,
  StyledLoaderWrap,
  StyledRelations,
  StyledRelationTypeBlock,
  StyledRelationTypeTreeBlock,
  StyledRow,
  StyledTooltipSeparator,
  StyledTreeBlock,
} from "./EntityTooltipStyles";
import { EntityTooltip as EntityTooltipNamespace } from "@shared/types";
import { RelationEnums } from "@shared/enums";
import { certaintyDict } from "@shared/dictionaries";

interface EntityTooltip {
  // trigger
  children: ReactElement;
  // entity
  entityId: string;
  label?: string;
  detail?: string;
  text?: string;
  itemsCount?: number;
  // settings
  position?: PopupPosition | PopupPosition[];
  on?: EventType | EventType[];
  noArrow?: boolean;
  color?: typeof Colors[number];
  disabled?: boolean;
  offsetX?: number;
  offsetY?: number;
  onOpen?: () => void;
  onClose?: () => void;
}
export const EntityTooltip: React.FC<EntityTooltip> = ({
  // trigger
  children,
  // entity
  entityId,
  label,
  detail,
  text,
  itemsCount,
  // settings
  position,
  on,
  noArrow,
  color,
  disabled,
  offsetX,
  offsetY,
  onOpen,
  onClose,
}) => {
  const [tooltipOpened, setTooltipOpened] = useState(false);

  const { data: tooltipData } = useQuery(
    ["tooltip", entityId, tooltipOpened],
    async () => {
      const res = await api.tooltipGet(entityId);
      return res.data;
    },
    {
      enabled: api.isLoggedIn() && !!entityId && tooltipOpened,
    }
  );

  const renderEntityInfo = () => (
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
  );

  const renderRelations = (tooltipData: EntityTooltipNamespace.IResponse) => {
    const {
      actionEventEquivalent,
      identifications,
      superclassTrees,
      superordinateLocationTrees,
      synonymCloud,
      entities,
    } = tooltipData;

    return (
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
            <StyledRelationTypeBlock>
              {"actionEventEquivalent"}
            </StyledRelationTypeBlock>
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
                    {`${entity.label} (`}
                    {/* <div style={{ textTransform: "uppercase" }}> */}
                    {certaintyDict[identification.certainty].label}
                    {/* </div> */}
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
            <StyledRelationTypeTreeBlock>
              {superclassTrees.map((superclass, key) => {
                const entity = entities[superclass.entityId];
                return (
                  <StyledGridRowThird key={key}>
                    {/* First level */}
                    <StyledTreeBlock>{entity.label}</StyledTreeBlock>
                    <StyledFlexColumn>
                      {superclass.subtrees.length > 0 ? (
                        superclass.subtrees.map((subtree, key) => {
                          const entity = entities[subtree.entityId];
                          return (
                            <StyledGridRowHalf key={key}>
                              {/* Second level */}
                              <StyledTreeBlock>{entity.label}</StyledTreeBlock>
                              <StyledFlexColumn>
                                {subtree.subtrees.length > 0 ? (
                                  subtree.subtrees.map((subtree, key) => {
                                    const entity = entities[subtree.entityId];
                                    /* third level */
                                    return (
                                      <StyledTreeBlock>
                                        {entity.label}
                                      </StyledTreeBlock>
                                    );
                                  })
                                ) : (
                                  <StyledTreeBlock />
                                )}
                              </StyledFlexColumn>
                            </StyledGridRowHalf>
                          );
                        })
                      ) : (
                        <StyledTreeBlock />
                      )}
                    </StyledFlexColumn>
                  </StyledGridRowThird>
                );
              })}
            </StyledRelationTypeTreeBlock>
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
            <StyledRelationTypeBlock>
              {"superordinateLocationTrees"}
            </StyledRelationTypeBlock>
          </>
        )}
        {/* synonymCloud - string[] */}
        {synonymCloud && synonymCloud.length > 0 && (
          <>
            <StyledLetterIconWrap>
              <LetterIcon color="white" letter={RelationEnums.Type.Synonym} />
            </StyledLetterIconWrap>
            <StyledRelationTypeBlock>
              {synonymCloud.map((synonym, key) => {
                const entity = entities[synonym];
                return (
                  <React.Fragment key={key}>
                    {`${entity.label}${
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
    );
  };

  const renderContent = () => (
    <>
      {renderEntityInfo()}
      {tooltipData ? (
        renderRelations(tooltipData)
      ) : (
        <StyledLoaderWrap>
          <Loader size={10} inverted />
        </StyledLoaderWrap>
      )}
    </>
  );

  return (
    <Tooltip
      content={renderContent()}
      position={position}
      on={on}
      noArrow={noArrow}
      color={color}
      disabled={disabled}
      offsetX={offsetX}
      offsetY={offsetY}
      onOpen={() => setTooltipOpened(true)}
      onClose={() => setTooltipOpened(false)}
    >
      <StyledTooltipSeparator>{children}</StyledTooltipSeparator>
    </Tooltip>
  );
};
