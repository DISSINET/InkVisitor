import { IEntity } from "@shared/types";
import React from "react";
import {
  StyledAnnotatorItem,
  StyledAnnotatorItemTitle,
  StyledAnnotatorMenu,
} from "./AnnotatorStyles";
import { EntityTag } from "../EntityTag/EntityTag";
import { EntitySuggester } from "../EntitySuggester/EntitySuggester";
import { classesPropType } from "types";

interface TextAnnotatorMenuProps {
  text: string;
  anchors: string[];
  entities: Record<string, IEntity | false>;
  onAnchorAdd: (entityId: string) => void;
  yPosition: number;
}

export const TextAnnotatorMenu = ({
  text,
  anchors,
  entities,
  onAnchorAdd,
  yPosition,
}: TextAnnotatorMenuProps) => (
  <>
    {text ? (
      <StyledAnnotatorMenu style={{ top: `${yPosition}px` }}>
        <StyledAnnotatorItem>
          <StyledAnnotatorItemTitle>Add new anchor</StyledAnnotatorItemTitle>
          <EntitySuggester
            categoryTypes={classesPropType}
            onSelected={(newAnchorId) => {
              console.log("new anchor", newAnchorId);
              onAnchorAdd(newAnchorId);
            }}
          />
        </StyledAnnotatorItem>
        <StyledAnnotatorItem>
          <StyledAnnotatorItemTitle>Existing anchors</StyledAnnotatorItemTitle>
          <div>
            {anchors.map((anchor) => {
              if (entities[anchor]) {
                return <EntityTag entity={entities[anchor] as IEntity} />;
              } else {
                return <></>;
              }
            })}
          </div>
        </StyledAnnotatorItem>
      </StyledAnnotatorMenu>
    ) : (
      <></>
    )}
  </>
);

export default TextAnnotatorMenu;
