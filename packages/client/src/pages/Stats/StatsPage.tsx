import { useQuery } from "@tanstack/react-query";
import api from "api";
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
  const [activeTab, setActiveTab] = useState<StatsTab>("entities");

  const layoutWidth: number = useAppSelector(
    (state) => state.layout.layoutWidth
  );
  const contentHeight: number = useAppSelector(
    (state) => state.layout.contentHeight
  );

  // get user data
  const userId = localStorage.getItem("userid");
  const { data: user } = useQuery({
    queryKey: ["user", userId],
    queryFn: async () => {
      const res = await api.usersGet(userId as string);
      return res.data ?? undefined;
    },
    enabled: !!userId && api.isLoggedIn(),
  });

  const allowMaterializedStats = user?.options.allowMaterializedStats ?? false;

  return (
    <Panel width={layoutWidth}>
      <Box
        label="Statistics"
        height={contentHeight}
        noFrame
        headerComponent={
          <StyledTabsContainer>
            {/* TODO: Add materialized stats button group */}
            {/* {activeTab === "entities" && allowMaterializedStats && (
              <span
                style={{ display: "flex", zIndex: 30, marginRight: "4rem" }}
              >
                <AttributeButtonGroup
                  noMargin
                  options={[
                    {
                      icon: <FaSyncAlt size={10} />,
                      longValue: "Classic (Live Data)",
                      shortValue: "Classic",
                      onClick: () => {
                        dispatch({
                          type: "useMaterializedUpdate",
                          payload: false,
                        });
                      },
                      selected: !state.useMaterialized,
                    },
                    {
                      icon: <FaDatabase />,
                      longValue: "Fast (Pre-calculated)",
                      shortValue: "Fast",
                      onClick: () => {
                        dispatch({
                          type: "useMaterializedUpdate",
                          payload: true,
                        });
                      },
                      selected: state.useMaterialized,
                    },
                  ]}
                />
              </span>
            )} */}

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
