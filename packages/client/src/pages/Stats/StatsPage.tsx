import { Box, Panel } from "components";
import { useState } from "react";
import { useAppSelector } from "redux/hooks";
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
          {activeTab === "documents" && <DocumentTable />}
        </StyledStatsContent>
      </Box>
    </Panel>
  );
};
