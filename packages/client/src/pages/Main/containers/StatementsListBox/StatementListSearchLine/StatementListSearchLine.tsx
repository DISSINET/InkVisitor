import { Input } from "components";
import React from "react";
import { BiSearch } from "react-icons/bi";
import { FaRegArrowAltCircleUp, FaRegArrowAltCircleDown } from "react-icons/fa";
import theme from "Theme/theme";
import {
  StyledDocumentSearchLine,
  StyledSearchContainer,
  StyledSearchIcon,
  StyledSearchResults,
} from "../StatementListBoxStyles";
import { useTheme } from "styled-components";

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

  return (
    <StyledDocumentSearchLine marginLeft={showStatementList}>
      {isSearchAllowed && (
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
                          (searchActiveOccurence + 1) % searchOccurences.length;
                        setSearchActiveOccurence(nextOccurence);
                      }}
                    />
                  </div>
                </>
              )}
            </StyledSearchResults>
          )}
        </StyledSearchContainer>
      )}
    </StyledDocumentSearchLine>
  );
};
