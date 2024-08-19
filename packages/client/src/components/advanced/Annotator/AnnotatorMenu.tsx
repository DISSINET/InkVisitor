import React from "react";

import { IEntity, IResponseDocument } from "@shared/types";
import { Button } from "components/basic/Button/Button";
import { BiSolidBookAdd, BiSolidMessageSquareAdd } from "react-icons/bi";
import { BsSegmentedNav } from "react-icons/bs";
import { classesAnnotator } from "types";
import { EntitySuggester } from "../EntitySuggester/EntitySuggester";
import { EntityTag } from "../EntityTag/EntityTag";
import {
  StyledAnnotatorAnchorList,
  StyledAnnotatorItem,
  StyledAnnotatorItemContent,
  StyledAnnotatorItemTitle,
} from "./AnnotatorStyles";

interface TextAnnotatorMenuProps {
  text: string;
  document: IResponseDocument;
  anchors: string[];
  entities: Record<string, IEntity | false>;
  onAnchorAdd: (entityId: string) => void;
  handleCreateStatement: Function | false;
  handleCreateTerritory: Function | false;
  handleRemoveAnchor: Function | false;
}

export const TextAnnotatorMenu = ({
  text,
  anchors,
  entities,
  onAnchorAdd,
  handleCreateStatement = false,
  handleCreateTerritory = false,
  handleRemoveAnchor = false,
}: TextAnnotatorMenuProps) => {
  return (
    <>
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
                <BiSolidMessageSquareAdd size={15} style={{ marginRight: 2 }} />
              }
              color="primary"
              paddingX={true}
              onClick={() => {
                handleCreateStatement();
              }}
              label="Statement"
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
              label="Territory"
              tooltipLabel="Create new Sub Territory from selection"
            />
          )}
          <EntitySuggester
            categoryTypes={classesAnnotator}
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
                    unlinkButton={{
                      onClick: () => {
                        if (handleRemoveAnchor) {
                          handleRemoveAnchor(anchor);
                        }
                      },
                    }}
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
    </>
  );
};

export default TextAnnotatorMenu;
