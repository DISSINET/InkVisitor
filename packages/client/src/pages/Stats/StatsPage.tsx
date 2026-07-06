import { Box, Panel } from "components";
import { useEffect, useState } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import { useAppSelector } from "redux/hooks";
import { DropdownItem } from "@inkvisitor/shared/types";
import { StatsDocumentTable } from "./StatsDocumentTable/StatsDocumentTable";
import { EntitiesTab } from "./EntitiesTab/EntitiesTab";
import { RelationsTab } from "./RelationsTab/RelationsTab";
import {
  StyledStatsContent,
  StyledStatsTab,
  StyledStatsTabGroup,
  StyledTabsContainer,
} from "./StatsPageStyles";

type StatsTab = "entities" | "documents" | "relations";

const parseStatsTab = (tab: string | null): StatsTab =>
  tab === "documents" ? "documents" : tab === "relations" ? "relations" : "entities";

export const StatsPage = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const layoutWidth: number = useAppSelector((state) => state.layout.layoutWidth);
  const contentHeight: number = useAppSelector((state) => state.layout.contentHeight);

  // URL hash of tabs handling
  const hashParams = new URLSearchParams(location.hash.substring(1));
  const rawTab = hashParams.get("tab");
  const activeTab: StatsTab = parseStatsTab(rawTab);

  useEffect(() => {
    if (rawTab === activeTab) {
      return;
    }

    navigate(
      {
        hash: (() => {
          const nextParams = new URLSearchParams(location.hash.substring(1));
          nextParams.set("tab", activeTab);
          return nextParams.toString();
        })(),
      },
      { replace: true },
    );
  }, [activeTab, location.hash, navigate, rawTab]);

  const handleTabChange = (tab: StatsTab) => {
    navigate({
      hash: (() => {
        const nextParams = new URLSearchParams(location.hash.substring(1));
        nextParams.set("tab", tab);
        return nextParams.toString();
      })(),
    });
  };

  // selected document for document table
  // state is here to preserve the selected document on tab switches
  const [selectedDocument, setSelectedDocument] = useState<DropdownItem | null>(null);
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
                onClick={() => handleTabChange("entities")}
              >
                Entities
              </StyledStatsTab>
              <StyledStatsTab
                type="button"
                $isSelected={activeTab === "documents"}
                onClick={() => handleTabChange("documents")}
              >
                Documents
              </StyledStatsTab>
              <StyledStatsTab
                type="button"
                $isSelected={activeTab === "relations"}
                onClick={() => handleTabChange("relations")}
              >
                Relations
              </StyledStatsTab>
            </StyledStatsTabGroup>
          </StyledTabsContainer>
        }
      >
        <StyledStatsContent>
          {activeTab === "entities" && <EntitiesTab />}
          {activeTab === "documents" && (
            <StatsDocumentTable
              selectedDocument={selectedDocument}
              setSelectedDocument={setSelectedDocument}
            />
          )}
          {activeTab === "relations" && <RelationsTab />}
        </StyledStatsContent>
      </Box>
    </Panel>
  );
};
