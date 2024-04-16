import { IEntity } from "@shared/types";
import React from "react";
import {
  StyledAnnotatorItem,
  StyledAnnotatorItemOption,
  StyledAnnotatorMenu,
} from "./AnnotatorStyles";
import { EntityTag } from "../EntityTag/EntityTag";

interface TextAnnotatorMenuProps {
  text: string;
  anchors: string[];
  entities: Record<string, IEntity | false>;
}

export const TextAnnotatorMenu = ({
  text,
  anchors,
  entities,
}: TextAnnotatorMenuProps) => {
  return (
    <>
      {text ? (
        <StyledAnnotatorMenu style={{}}>
          <StyledAnnotatorItem>
            <StyledAnnotatorItemOption>
              Add new anchor
            </StyledAnnotatorItemOption>
          </StyledAnnotatorItem>
          {anchors.map((anchor) => {
            return (
              <StyledAnnotatorItem>
                {entities[anchor] ? (
                  <EntityTag entity={entities[anchor] as IEntity} />
                ) : (
                  <></>
                )}
              </StyledAnnotatorItem>
            );
          })}
        </StyledAnnotatorMenu>
      ) : (
        <></>
      )}
    </>
  );
};

export default TextAnnotatorMenu;
