import { IEntity } from "@shared/types";
import React from "react";
import {
  StyledAnnotatorItem,
  StyledAnnotatorItemTitle,
  StyledAnnotatorMenu,
} from "./AnnotatorStyles";
import { EntityTag } from "../EntityTag/EntityTag";
import { EntitySuggester } from "../EntitySuggester/EntitySuggester";
import { classesAll } from "types";

interface TextAnnotatorMenuProps {
  text: string;
  anchors: string[];
  entities: Record<string, IEntity | false>;
  onAnchorAdd: (entityId: string) => void;
  yPosition: number;
  topBottomSelection: boolean;
}

export const TextAnnotatorMenu = ({
  text,
  anchors,
  entities,
  onAnchorAdd,
  yPosition,
  topBottomSelection,
}: TextAnnotatorMenuProps) => {
  return (
    <>
      {text ? (
        <StyledAnnotatorMenu
          style={{
            top: `${yPosition}px`,
            transform: `translate(0%, ${topBottomSelection ? "0%" : "-100%"})`,
          }}
        >
          <StyledAnnotatorItem>
            <StyledAnnotatorItemTitle>
              Create new anchor
            </StyledAnnotatorItemTitle>
            <EntitySuggester
              categoryTypes={classesAll}
              initTyped={text.length > 30 ? text.substring(0, 30) : text}
              onSelected={(newAnchorId) => {
                onAnchorAdd(newAnchorId);
              }}
              inputWidth={200}
            />
          </StyledAnnotatorItem>
          <StyledAnnotatorItem>
            <StyledAnnotatorItemTitle>
              Create new Statement from selection
            </StyledAnnotatorItemTitle>
          </StyledAnnotatorItem>
          <StyledAnnotatorItem>
            <StyledAnnotatorItemTitle>
              Segment selection into Statements
            </StyledAnnotatorItemTitle>
          </StyledAnnotatorItem>
          <StyledAnnotatorItem>
            <StyledAnnotatorItemTitle>
              Anchors in selection
            </StyledAnnotatorItemTitle>
            <div style={{ display: "inline-flex", gap: "3px" }}>
              {anchors.map((anchor) => {
                if (entities[anchor]) {
                  return (
                    <EntityTag
                      key={anchor}
                      fullWidth
                      entity={entities[anchor] as IEntity}
                    />
                  );
                } else {
                  return <React.Fragment key={anchor} />;
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
};

export default TextAnnotatorMenu;
