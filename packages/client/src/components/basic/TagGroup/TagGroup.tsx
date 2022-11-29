import { IEntity } from "@shared/types";
import { TooltipNew } from "components";
import { EntityTag } from "components/advanced";
import { StyledDots } from "pages/MainPage/containers/StatementsListBox/StatementLitBoxStyles";
import React, { useState } from "react";
import { StyledTagGroup } from "./TagGroupStyles";

interface TagGroup {
  definedEntities: IEntity[];
  oversizeLimit?: number;
}
export const TagGroup: React.FC<TagGroup> = ({
  definedEntities,
  oversizeLimit = 2,
}) => {
  const [showTooltip, setShowTooltip] = useState(false);
  const [referenceElement, setReferenceElement] =
    useState<HTMLDivElement | null>(null);

  const renderListActant = (actantObject: IEntity, key: number) =>
    actantObject && (
      <EntityTag
        key={key}
        entity={actantObject}
        showOnly="entity"
        tooltipPosition="bottom"
      />
    );

  const isOversized = definedEntities.length > oversizeLimit;
  return (
    <div style={{ display: "flex" }}>
      <StyledTagGroup>
        {definedEntities
          .slice(0, 2)
          .map((action: IEntity, key: number) => renderListActant(action, key))}
      </StyledTagGroup>
      {isOversized && (
        <>
          <TooltipNew
            visible={showTooltip}
            referenceElement={referenceElement}
            offsetY={-14}
            position="right"
            color="success"
            noArrow
            tagGroup
            onMouseOut={() => {
              setShowTooltip(false);
            }}
            content={
              <StyledTagGroup>
                {definedEntities
                  .slice(2)
                  .map((action: IEntity, key: number) =>
                    renderListActant(action, key)
                  )}
              </StyledTagGroup>
            }
          />
          <StyledDots
            ref={setReferenceElement}
            onMouseOver={() => {
              setShowTooltip(true);
            }}
          >
            {"..."}
          </StyledDots>
        </>
      )}
    </div>
  );
};
