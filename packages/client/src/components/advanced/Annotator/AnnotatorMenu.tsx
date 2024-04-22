import { IEntity, IResponseDocument } from "@shared/types";
import React from "react";
import {
  StyledAnnotatorAnchorList,
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
import { BiSolidBookAdd, BiSolidMessageSquareAdd } from "react-icons/bi";

interface TextAnnotatorMenuProps {
  text: string;
  document: IResponseDocument;
  anchors: string[];
  entities: Record<string, IEntity | false>;
  onAnchorAdd: (entityId: string) => void;
  yPosition: number;
  topBottomSelection: boolean;
  handleCreateStatement: Function | false;
  handleCreateTerritory: Function | false;
}

export const TextAnnotatorMenu = ({
  text,
  anchors,
  entities,
  onAnchorAdd,
  yPosition,
  topBottomSelection,
  handleCreateStatement = false,
  handleCreateTerritory = false,
}: TextAnnotatorMenuProps) => {
  return (
    <>
      {text ? (
        <StyledAnnotatorMenu
          $top={yPosition}
          $left={100}
          $translateY={topBottomSelection ? "0%" : "-100%"}
        >
          <StyledAnnotatorItem>
            <StyledAnnotatorItemTitle>Actions</StyledAnnotatorItemTitle>
            <StyledAnnotatorItemContent>
              <Button
                icon={<BsSegmentedNav size={22} />}
                color="primary"
                paddingX={true}
                onClick={() => {
                  console.log("Segment selection into Statements");
                }}
                label={"Segment"}
                tooltipLabel="Segment selection into Statements"
                disabled
              />
            </StyledAnnotatorItemContent>
          </StyledAnnotatorItem>
          <StyledAnnotatorItem>
            <StyledAnnotatorItemTitle>
              Create new anchor from selection
            </StyledAnnotatorItemTitle>
            <StyledAnnotatorItemContent>
              {handleCreateStatement && (
                <Button
                  icon={
                    <BiSolidMessageSquareAdd
                      size={15}
                      style={{ marginRight: 2 }}
                    />
                  }
                  color="primary"
                  paddingX={true}
                  onClick={() => {
                    console.log("Create new Statement from selection");
                    handleCreateStatement();
                  }}
                  label="Territory Statement"
                  tooltipLabel="Create new Statement from selection"
                />
              )}
              {handleCreateTerritory && (
                <Button
                  icon={<BiSolidBookAdd size={15} style={{ marginRight: 2 }} />}
                  color="primary"
                  paddingX={true}
                  onClick={() => {
                    handleCreateTerritory();
                  }}
                  label="Sub Territory"
                  tooltipLabel="Create new Sub Territory from selection"
                />
              )}
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
              <StyledAnnotatorAnchorList>
                {anchors.map((anchor) => {
                  if (entities[anchor]) {
                    return (
                      <EntityTag
                        key={anchor}
                        entity={entities[anchor] as IEntity}
                      />
                    );
                  } else {
                    return <React.Fragment key={anchor} />;
                  }
                })}
              </StyledAnnotatorAnchorList>
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
