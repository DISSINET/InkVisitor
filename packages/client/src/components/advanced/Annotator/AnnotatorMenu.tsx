import { IEntity } from "@shared/types";
import React from "react";
import {
  StyledAnnotatorItem,
  StyledAnnotatorItemContent,
  StyledAnnotatorItemTitle,
  StyledAnnotatorMenu,
} from "./AnnotatorStyles";
import { EntityTag } from "../EntityTag/EntityTag";
import { EntitySuggester } from "../EntitySuggester/EntitySuggester";
import { classesAll } from "types";
import { Button } from "components/basic/Button/Button";
import { BsSegmentedNav } from "react-icons/bs";
import { BiSolidMessageSquareAdd } from "react-icons/bi";

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
            <StyledAnnotatorItemTitle>Actions</StyledAnnotatorItemTitle>
            <StyledAnnotatorItemContent>
              <Button
                icon={<BiSolidMessageSquareAdd size={15} />}
                color="primary"
                paddingX={true}
                onClick={() => {
                  console.log("Create new Statement from selection");
                }}
                label="Create Statement"
                tooltipLabel="Create new Statement from selection"
              />
              <Button
                icon={<BsSegmentedNav size={22} />}
                color="primary"
                paddingX={true}
                onClick={() => {
                  console.log("Segment selection into Statements");
                }}
                label={"Segment"}
                tooltipLabel="Segment selection into Statements"
              />
            </StyledAnnotatorItemContent>
          </StyledAnnotatorItem>
          <StyledAnnotatorItem>
            <StyledAnnotatorItemTitle>
              Create new anchor
            </StyledAnnotatorItemTitle>
            <StyledAnnotatorItemContent>
              <EntitySuggester
                categoryTypes={classesAll}
                initTyped={text.length > 30 ? text.substring(0, 30) : text}
                onSelected={(newAnchorId) => {
                  onAnchorAdd(newAnchorId);
                }}
                inputWidth={200}
              />
            </StyledAnnotatorItemContent>
          </StyledAnnotatorItem>
          <StyledAnnotatorItem>
            <StyledAnnotatorItemTitle>
              Anchors in selection
            </StyledAnnotatorItemTitle>
            <StyledAnnotatorItemContent>
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
            </StyledAnnotatorItemContent>
          </StyledAnnotatorItem>
        </StyledAnnotatorMenu>
      ) : (
        <></>
      )}
    </>
  );
};

export default TextAnnotatorMenu;
