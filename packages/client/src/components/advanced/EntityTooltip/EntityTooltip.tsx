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
  StyledIconWrap,
  StyledLabel,
  StyledLetterIconWrap,
  StyledLoaderWrap,
  StyledRelations,
  StyledRelationTypeBlock,
  StyledRow,
  StyledTooltipSeparator,
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
      troponymCloud,
      entities,
    } = tooltipData;
    console.log(tooltipData.entities);

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
                return `${identification.entityId} ([EClass] ${
                  certaintyDict[identification.certainty].label
                })${key !== identifications.length - 1 ? ", " : ""}`;
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
            <StyledRelationTypeBlock>
              <div style={{ display: "flex", flexDirection: "column" }}>
                {superclassTrees.map((superclass, key) => {
                  const entity = entities[superclass.entityId];
                  return <div>{/* level 1 one instance */}</div>;
                })}
              </div>
            </StyledRelationTypeBlock>
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
                    {`${synonym}${key !== synonymCloud.length - 1 ? ", " : ""}`}
                  </React.Fragment>
                );
              })}
            </StyledRelationTypeBlock>
          </>
        )}
        {/* troponymCloud - Node */}
        {troponymCloud && troponymCloud.length > 0 && (
          <>
            <StyledLetterIconWrap>
              <LetterIcon color="white" letter={RelationEnums.Type.Troponym} />
            </StyledLetterIconWrap>
            <StyledRelationTypeBlock>
              {troponymCloud.map((troponym, key) => {
                return `${troponym}${
                  key !== troponymCloud.length - 1 ? ", " : ""
                }`;
              })}
            </StyledRelationTypeBlock>
          </>
        )}
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
