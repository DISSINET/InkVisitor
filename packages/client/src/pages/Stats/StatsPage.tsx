import { Box, Panel } from "components";
import { useState } from "react";
import { useAppSelector } from "redux/hooks";
import { DropdownItem } from "types";
import { DocumentTable } from "./DocumentTable/DocumentTable";
import { EntitiesTab } from "./EntitiesTab/EntitiesTab";
import {
  StyledStatsContent,
  StyledStatsTab,
  StyledStatsTabGroup,
  StyledTabsContainer,
} from "./StatsPageStyles";

type StatsTab = "entities" | "documents";

export const StatsPage = () => {
  const layoutWidth: number = useAppSelector(
    (state) => state.layout.layoutWidth
  );
  const contentHeight: number = useAppSelector(
    (state) => state.layout.contentHeight
  );

  const [activeTab, setActiveTab] = useState<StatsTab>("entities");
  // selected document for document table
  // state is here to preserve the selected document on tab switches
  const [selectedDocument, setSelectedDocument] = useState<DropdownItem | null>(
    null
  );

  return (
    <Panel width={layoutWidth}>
      <Box
        label="Statistics"
        height={contentHeight}
        noFrame
        headerComponent={
          <StyledTabsContainer>
            <StyledStatsTabGroup>
              <StyledStatsTab
                type="button"
                $isSelected={activeTab === "entities"}
                onClick={() => setActiveTab("entities")}
              >
                Entities
              </StyledStatsTab>
              <StyledStatsTab
                type="button"
                $isSelected={activeTab === "documents"}
                onClick={() => setActiveTab("documents")}
              >
                Documents
              </StyledStatsTab>
            </StyledStatsTabGroup>
          </StyledTabsContainer>
        }
      >
        <StyledStatsContent>
          {activeTab === "entities" && <EntitiesTab />}
          {activeTab === "documents" && (
            <DocumentTable
              selectedDocument={selectedDocument}
              setSelectedDocument={setSelectedDocument}
            />
          )}
        </StyledStatsContent>
      </Box>
    </Panel>
  );
};
