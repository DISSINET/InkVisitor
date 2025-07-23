import { Button, Input } from "components";
import {
  AttributeButtonGroup,
  EntitySuggester,
  EntityTag,
} from "components/advanced";
import React, { useState } from "react";
import { BiSearch } from "react-icons/bi";
import {
  FaAnchor,
  FaRegArrowAltCircleDown,
  FaRegArrowAltCircleUp,
} from "react-icons/fa";
import { TbReplace } from "react-icons/tb";
import { useTheme } from "styled-components";
import {
  StyledSearchContainer,
  StyledSearchIcon,
  StyledSearchLine,
  StyledSearchResults,
} from "../StatementListBoxStyles";
import { IEntity } from "@shared/types";
import { LuReplace, LuReplaceAll } from "react-icons/lu";

interface StatementListSearchLine {
  searchTerm: string;
  setSearchTerm: (searchTerm: string) => void;
  isSearchTermValid: boolean;
  searchOccurences: {
    segmentIndex: number;
    lineIndex: number;
    start: number;
    end: number;
  }[];
  searchActiveOccurence: number;
  setSearchActiveOccurence: (searchActiveOccurence: number) => void;
  isSearchAllowed: boolean;
  annotatorWidthTooSmall: boolean;
  showStatementList: boolean;
}
export const StatementListSearchLine: React.FC<StatementListSearchLine> = ({
  searchTerm,
  setSearchTerm,
  isSearchTermValid,
  searchOccurences,
  searchActiveOccurence,
  isSearchAllowed,
  annotatorWidthTooSmall,
  setSearchActiveOccurence,
  showStatementList,
}) => {
  const theme = useTheme();
  const [replaceSection, setReplaceSection] = useState(false);
  const [entityToAnchor, setEntityToAnchor] = useState<IEntity | null>(null);
  const [replaceWith, setReplaceWith] = useState<string>("");
  return (
    <StyledSearchLine marginLeft={showStatementList}>
      {isSearchAllowed && (
        <>
          <StyledSearchContainer>
            <StyledSearchIcon>
              <BiSearch color={theme.color.info} />
            </StyledSearchIcon>
            <Input
              value={searchTerm}
              onChangeFn={(newText: string) => {
                setSearchTerm(newText);
              }}
              changeOnType
              width={130}
              minWidth={50}
            />
            {isSearchTermValid && (
              <StyledSearchResults
                $annotatorWidthTooSmall={annotatorWidthTooSmall}
              >
                {searchOccurences.length === 0 ? (
                  <div style={{ marginLeft: "0.2rem" }}>no results</div>
                ) : (
                  <>
                    <div style={{ display: "flex" }}>
                      {searchActiveOccurence + 1} of {searchOccurences.length}
                    </div>
                    <div style={{ display: "flex", gap: "0.5rem" }}>
                      <FaRegArrowAltCircleUp
                        size={15}
                        color={theme.color.info}
                        style={{ cursor: "pointer" }}
                        title="previous occurence"
                        onClick={() => {
                          const previousOccurence =
                            (searchActiveOccurence -
                              1 +
                              searchOccurences.length) %
                            searchOccurences.length;
                          setSearchActiveOccurence(previousOccurence);
                        }}
                      />
                      <FaRegArrowAltCircleDown
                        size={15}
                        color={theme.color.info}
                        style={{ cursor: "pointer" }}
                        title="next occurence"
                        onClick={() => {
                          const nextOccurence =
                            (searchActiveOccurence + 1) %
                            searchOccurences.length;
                          setSearchActiveOccurence(nextOccurence);
                        }}
                      />
                    </div>
                  </>
                )}
              </StyledSearchResults>
            )}
          </StyledSearchContainer>

          <AttributeButtonGroup
            disabled={!isSearchTermValid}
            options={[
              {
                longValue: "replace",
                shortValue: "",
                onClick: () => setReplaceSection(true),
                selected: replaceSection,
                icon: <TbReplace />,
              },
              {
                longValue: "annotate",
                shortValue: "",
                onClick: () => setReplaceSection(false),
                selected: !replaceSection,
                // shortIcon: <FaPlus />,
                icon: <FaAnchor />,
              },
            ]}
          />

          {!replaceSection ? (
            <>
              <Button
                tooltipLabel="wrap selection with anchor of a given entity and go to the next one"
                icon={<FaAnchor />}
                label="+"
                color="success"
                onClick={() => {
                  console.log("annotate");
                }}
                disabled={!isSearchTermValid || !entityToAnchor}
              />
              {!entityToAnchor ? (
                <EntitySuggester
                  placeholder="select entity"
                  onPicked={(entity) => {
                    setEntityToAnchor(entity);
                  }}
                />
              ) : (
                <EntityTag
                  entity={entityToAnchor}
                  unlinkButton={{
                    onClick: () => setEntityToAnchor(null),
                  }}
                />
              )}
            </>
          ) : (
            <>
              <Input
                placeholder="replace with"
                value={replaceWith}
                onChangeFn={(value: string) => {
                  setReplaceWith(value);
                }}
              />
              <Button
                circular
                color="info"
                inverted
                tooltipLabel="replace one occurence"
                noBackground
                icon={<LuReplace size={12} />}
                onClick={() => {
                  console.log("replace one");
                }}
              />
              <Button
                circular
                color="info"
                inverted
                tooltipLabel="replace all occurences"
                noBackground
                icon={<LuReplaceAll size={12} />}
                onClick={() => {
                  console.log("replace all");
                }}
              />
            </>
          )}
        </>
      )}
    </StyledSearchLine>
  );
};
