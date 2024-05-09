import { EntityEnums, UserEnums } from "@shared/enums";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import {
  collapsedPanelWidth,
  fourthPanelBoxesHeightThirds,
  hiddenBoxHeight,
} from "Theme/constants";
import { Box, Button, Panel } from "components";
import { EntityCreateModal, PanelSeparator } from "components/advanced";
import { useSearchParams } from "hooks";
import ScrollHandler from "hooks/ScrollHandler";
import React, { useEffect, useState } from "react";
import { BiHide, BiRefresh, BiShow } from "react-icons/bi";
import { BsSquareFill, BsSquareHalf } from "react-icons/bs";
import { FaPlus } from "react-icons/fa";
import { RiMenuFoldFill, RiMenuUnfoldFill } from "react-icons/ri";
import { VscCloseAll } from "react-icons/vsc";
import { setFirstPanelExpanded } from "redux/features/layout/firstPanelExpandedSlice";
import { setFourthPanelBoxesOpened } from "redux/features/layout/fourthPanelBoxesOpenedSlice";
import { setFourthPanelExpanded } from "redux/features/layout/fourthPanelExpandedSlice";
import { setStatementListOpened } from "redux/features/layout/statementListOpenedSlice";
import { useAppDispatch, useAppSelector } from "redux/hooks";
import { MemoizedEntityBookmarkBox } from "./containers/EntityBookmarkBox/EntityBookmarkBox";
import { MemoizedEntityDetailBox } from "./containers/EntityDetailBox/EntityDetailBox";
import { MemoizedEntitySearchBox } from "./containers/EntitySearchBox/EntitySearchBox";
import { MemoizedStatementEditorBox } from "./containers/StatementEditorBox/StatementEditorBox";
import { MemoizedStatementListBox } from "./containers/StatementsListBox/StatementListBox";
import { MemoizedTemplateListBox } from "./containers/TemplateListBox/TemplateListBox";
import { MemoizedTerritoryTreeBox } from "./containers/TerritoryTreeBox/TerritoryTreeBox";
import api from "api";
import { IStatement } from "@shared/types";
import { setDisableStatementListScroll } from "redux/features/statementList/disableStatementListScrollSlice";
import { CStatement } from "constructors";
import { setIsLoading } from "redux/features/statementList/isLoadingSlice";

type FourthPanelBoxes = "search" | "bookmarks" | "templates";

interface MainPage {}

const MainPage: React.FC<MainPage> = ({}) => {
  const {
    territoryId,
    detailIdArray,
    clearAllDetailIds,
    selectedDetailId,
    appendDetailId,
    setStatementId,
  } = useSearchParams();

  const dispatch = useAppDispatch();

  const queryClient = useQueryClient();

  const fourthPanelBoxesOpened: { [key: string]: boolean } = useAppSelector(
    (state) => state.layout.fourthPanelBoxesOpened
  );
  const firstPanelExpanded: boolean = useAppSelector(
    (state) => state.layout.firstPanelExpanded
  );
  const fourthPanelExpanded: boolean = useAppSelector(
    (state) => state.layout.fourthPanelExpanded
  );
  const contentHeight: number = useAppSelector(
    (state) => state.layout.contentHeight
  );
  const panelWidths: number[] = useAppSelector(
    (state) => state.layout.panelWidths
  );
  const separatorXPosition: number = useAppSelector(
    (state) => state.layout.separatorXPosition
  );
  const statementListOpened: boolean = useAppSelector(
    (state) => state.layout.statementListOpened
  );

  const toggleFirstPanel = () => {
    if (firstPanelExpanded) {
      dispatch(setFirstPanelExpanded(false));
      localStorage.setItem("firstPanelExpanded", "false");
    } else {
      dispatch(setFirstPanelExpanded(true));
      localStorage.setItem("firstPanelExpanded", "true");
    }
  };

  const firstPanelButton = () => (
    <Button
      onClick={toggleFirstPanel}
      inverted
      icon={firstPanelExpanded ? <RiMenuFoldFill /> : <RiMenuUnfoldFill />}
    />
  );

  const toggleFourthPanel = () => {
    if (fourthPanelExpanded) {
      dispatch(setFourthPanelExpanded(false));
      localStorage.setItem("fourthPanelExpanded", "false");
    } else {
      dispatch(setFourthPanelExpanded(true));
      localStorage.setItem("fourthPanelExpanded", "true");
    }
  };

  const hideFourthPanelButton = () => (
    <Button
      key="hide"
      onClick={toggleFourthPanel}
      inverted
      icon={fourthPanelExpanded ? <RiMenuUnfoldFill /> : <RiMenuFoldFill />}
    />
  );

  const handleHideBoxButtonClick = (
    boxToHide: FourthPanelBoxes,
    isThisBoxHidden: boolean
  ) => {
    if (isThisBoxHidden) {
      const newObject = {
        ...fourthPanelBoxesOpened,
        [boxToHide]: true,
      };
      dispatch(setFourthPanelBoxesOpened(newObject));
      localStorage.setItem("fourthPanelBoxesOpened", JSON.stringify(newObject));
    } else {
      const newObject = {
        ...fourthPanelBoxesOpened,
        [boxToHide]: false,
      };
      dispatch(setFourthPanelBoxesOpened(newObject));
      localStorage.setItem("fourthPanelBoxesOpened", JSON.stringify(newObject));
    }
  };

  const hideBoxButton = (boxToHide: FourthPanelBoxes) => {
    const isThisBoxHidden = !fourthPanelBoxesOpened[boxToHide];
    return (
      <>
        {fourthPanelExpanded && (
          <Button
            key={boxToHide}
            inverted
            icon={isThisBoxHidden ? <BiShow /> : <BiHide />}
            onClick={() => handleHideBoxButtonClick(boxToHide, isThisBoxHidden)}
          />
        )}
      </>
    );
  };
  const refreshBoxButton = (
    queriesToRefresh: string[],
    isThisBoxHidden: boolean
  ) => {
    return isThisBoxHidden ? (
      <></>
    ) : (
      <>
        {queriesToRefresh.length && (
          <Button
            key="refresh queries"
            tooltipLabel="refresh data"
            inverted
            icon={<BiRefresh />}
            onClick={() => {
              queriesToRefresh.forEach((queryToRefresh) => {
                queryClient.invalidateQueries({ queryKey: [queryToRefresh] });
              });
            }}
          />
        )}
      </>
    );
  };

  const getFourthPanelBoxHeight = (box: FourthPanelBoxes): number => {
    const onePercent = contentHeight / 100;

    const isThisBoxHidden = !fourthPanelBoxesOpened[box];
    const openBoxesCount = Object.values(fourthPanelBoxesOpened).filter(
      (b) => b === true
    );

    if (!fourthPanelExpanded) {
      // Hidden panel state
      return contentHeight / 3;
    } else if (isThisBoxHidden) {
      return hiddenBoxHeight;
    } else {
      if (openBoxesCount.length === 3) {
        return fourthPanelBoxesHeightThirds[box] * onePercent;
      } else if (openBoxesCount.length === 2) {
        return (contentHeight - hiddenBoxHeight) / 2;
      } else {
        return contentHeight - 2 * hiddenBoxHeight;
      }
    }
  };

  const clockPerformance = (
    profilerId: any,
    mode: any,
    actualTime: any,
    baseTime: any,
    startTime: any,
    commitTime: any
  ) => {
    console.log({
      profilerId,
      mode,
      actualTime,
      baseTime,
      startTime,
      commitTime,
    });
  };

  const [showEntityCreateModal, setShowEntityCreateModal] = useState(false);

  const toggleStatementListOpen = () => {
    statementListOpened
      ? localStorage.setItem("statementListOpened", "false")
      : localStorage.setItem("statementListOpened", "true");
    dispatch(setStatementListOpened(!statementListOpened));
  };

  const userRole = localStorage.getItem("userrole") as UserEnums.Role;

  const addStatementAtTheEndMutation = useMutation({
    mutationFn: async (newStatement: IStatement) => {
      await api.entityCreate(newStatement);
    },
    onSuccess: (data, variables) => {
      setStatementId(variables.id);
      queryClient.invalidateQueries({ queryKey: ["territory"] });
      queryClient.invalidateQueries({ queryKey: ["tree"] });
      dispatch(setDisableStatementListScroll(false));
    },
  });

  useEffect(() => {
    if (addStatementAtTheEndMutation.isPending) {
      dispatch(setIsLoading(true));
    } else {
      dispatch(setIsLoading(false));
    }
  }, [addStatementAtTheEndMutation.isPending]);

  // get user data
  const userId = localStorage.getItem("userid");
  const {
    status: statusUser,
    data: user,
    error: errorUser,
    isFetching: isFetchingUser,
  } = useQuery({
    queryKey: ["user", userId],
    queryFn: async () => {
      if (userId) {
        const res = await api.usersGet(userId);
        return res.data;
      }
    },
    enabled: !!userId && api.isLoggedIn(),
  });

  return (
    <>
      <ScrollHandler />
      {separatorXPosition > 0 && <PanelSeparator />}

      {/* FIRST PANEL */}
      <Panel width={firstPanelExpanded ? panelWidths[0] : collapsedPanelWidth}>
        <Box
          height={contentHeight}
          label="Territories"
          isExpanded={firstPanelExpanded}
          buttons={[
            refreshBoxButton(["tree", "user"], !firstPanelExpanded),
            firstPanelButton(),
          ]}
          noPadding
          onHeaderClick={toggleFirstPanel}
        >
          <MemoizedTerritoryTreeBox />
        </Box>
      </Panel>

      {/* SECOND PANEL */}
      <Panel
        width={
          firstPanelExpanded
            ? panelWidths[1]
            : panelWidths[1] + panelWidths[0] - collapsedPanelWidth
        }
      >
        <Box
          label="Statements"
          borderColor="white"
          onHeaderClick={
            !statementListOpened ? toggleStatementListOpen : undefined
          }
          height={
            detailIdArray.length
              ? statementListOpened
                ? contentHeight / 2 - 20
                : hiddenBoxHeight
              : contentHeight
          }
          buttons={[
            <>
              {userRole !== UserEnums.Role.Viewer && territoryId && (
                <Button
                  key="add"
                  icon={<FaPlus />}
                  tooltipLabel="add new statement at the end of the list"
                  color="primary"
                  label="new statement"
                  onClick={() => {
                    if (user) {
                      addStatementAtTheEndMutation.mutate(
                        CStatement(userRole, user.options, "", "", territoryId)
                      );
                    }
                  }}
                />
              )}
            </>,
            territoryId &&
              refreshBoxButton(["territory", "statement", "user"], false),
          ]}
        >
          <MemoizedStatementListBox />
        </Box>
        {(selectedDetailId || detailIdArray.length > 0) && (
          <Box
            label="Detail"
            borderColor="white"
            onHeaderClick={toggleStatementListOpen}
            height={
              statementListOpened
                ? contentHeight / 2 + 20
                : contentHeight - hiddenBoxHeight
            }
            buttons={[
              <>
                {userRole !== UserEnums.Role.Viewer && (
                  <Button
                    icon={<FaPlus />}
                    label="new entity"
                    onClick={() => setShowEntityCreateModal(true)}
                  />
                )}
              </>,
              refreshBoxButton(["entity", "user"], false),
              <Button
                inverted
                tooltipLabel={
                  statementListOpened
                    ? "maximize detail box"
                    : "shrink detail box"
                }
                icon={
                  statementListOpened ? (
                    <BsSquareFill />
                  ) : (
                    <BsSquareHalf style={{ transform: "rotate(270deg)" }} />
                  )
                }
                onClick={toggleStatementListOpen}
              />,
              <Button
                inverted
                tooltipLabel="close all tabs"
                icon={<VscCloseAll style={{ transform: "scale(1.3)" }} />}
                onClick={() => {
                  clearAllDetailIds();
                  dispatch(setStatementListOpened(true));
                }}
              />,
            ]}
          >
            <MemoizedEntityDetailBox />
          </Box>
        )}
        {showEntityCreateModal && (
          <EntityCreateModal
            closeModal={() => setShowEntityCreateModal(false)}
            onMutationSuccess={(entity) => {
              if (entity.class !== EntityEnums.Class.Value) {
                appendDetailId(entity.id);
              }
              if (entity.class === EntityEnums.Class.Territory) {
                queryClient.invalidateQueries({ queryKey: ["tree"] });
              }
            }}
          />
        )}
      </Panel>

      {/* THIRD PANEL */}
      <Panel
        width={
          fourthPanelExpanded
            ? panelWidths[2]
            : panelWidths[2] + panelWidths[3] - collapsedPanelWidth
        }
      >
        <Box borderColor="white" height={contentHeight} label="Editor">
          <MemoizedStatementEditorBox />
        </Box>
      </Panel>

      {/* FOURTH PANEL */}
      <Panel width={fourthPanelExpanded ? panelWidths[3] : collapsedPanelWidth}>
        <Box
          height={getFourthPanelBoxHeight("search")}
          label="Search"
          color="white"
          isExpanded={fourthPanelExpanded}
          buttons={[
            refreshBoxButton(
              ["search-templates", "search"],
              !fourthPanelExpanded
            ),
            hideBoxButton("search"),
            hideFourthPanelButton(),
          ]}
          onHeaderClick={toggleFourthPanel}
          disableOpenBoxHeaderClick
        >
          <MemoizedEntitySearchBox />
        </Box>
        <Box
          height={getFourthPanelBoxHeight("bookmarks")}
          label="Bookmarks"
          color="white"
          isExpanded={fourthPanelExpanded}
          buttons={[
            refreshBoxButton(["bookmarks"], !fourthPanelExpanded),
            hideBoxButton("bookmarks"),
            hideFourthPanelButton(),
          ]}
          onHeaderClick={toggleFourthPanel}
          disableOpenBoxHeaderClick
        >
          <MemoizedEntityBookmarkBox />
        </Box>
        <Box
          height={getFourthPanelBoxHeight("templates")}
          label="Templates"
          color="white"
          isExpanded={fourthPanelExpanded}
          buttons={[
            refreshBoxButton(["templates"], !fourthPanelExpanded),
            hideBoxButton("templates"),
            hideFourthPanelButton(),
          ]}
          onHeaderClick={toggleFourthPanel}
          disableOpenBoxHeaderClick
        >
          <MemoizedTemplateListBox />
        </Box>
      </Panel>
    </>
  );
};

export default MainPage;
