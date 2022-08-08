import { Box, Button, Panel, PanelSeparator } from "components";
import { Page } from "components/advanced";
import { useSearchParams } from "hooks";
import ScrollHandler from "hooks/ScrollHandler";
import React from "react";
import { BiHide, BiShow } from "react-icons/bi";
import { IoMdClose } from "react-icons/io";
import { RiMenuFoldFill, RiMenuUnfoldFill } from "react-icons/ri";
import { setFirstPanelExpanded } from "redux/features/layout/firstPanelExpandedSlice";
import { setFourthPanelBoxesOpened } from "redux/features/layout/fourthPanelBoxesOpenedSlice";
import { setFourthPanelExpanded } from "redux/features/layout/fourthPanelExpandedSlice";
import { useAppDispatch, useAppSelector } from "redux/hooks";
import { collapsedPanelWidth, hiddenBoxHeight } from "Theme/constants";
import { MemoizedEntityBookmarkBox } from "./containers/EntityBookmarkBox/EntityBookmarkBox";
import { MemoizedEntityDetailBox } from "./containers/EntityDetailBox/EntityDetailBox";
import { MemoizedEntitySearchBox } from "./containers/EntitySearchBox/EntitySearchBox";
import { MemoizedStatementEditorBox } from "./containers/StatementEditorBox/StatementEditorBox";
import { MemoizedStatementListBox } from "./containers/StatementsListBox/StatementListBox";
import { MemoizedTemplateListBox } from "./containers/TemplateListBox/TemplateListBox";
import { MemoizedTerritoryTreeBox } from "./containers/TerritoryTreeBox/TerritoryTreeBox";

type FourthPanelBoxes = "search" | "bookmarks" | "templates";

interface MainPage {}

const MainPage: React.FC<MainPage> = ({}) => {
  const {
    detailIdArray,
    setStatementId,
    setTerritoryId,
    clearAllDetailIds,
    selectedDetailId,
  } = useSearchParams();

  const dispatch = useAppDispatch();

  const fourthPanelBoxesOpened: { [key: string]: boolean } = useAppSelector(
    (state) => state.layout.fourthPanelBoxesOpened
  );

  const firstPanelExpanded: boolean = useAppSelector(
    (state) => state.layout.firstPanelExpanded
  );
  const fourthPanelExpanded: boolean = useAppSelector(
    (state) => state.layout.fourthPanelExpanded
  );
  const layoutWidth: number = useAppSelector(
    (state) => state.layout.layoutWidth
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

  const logOutCleanUp = () => {
    clearAllDetailIds();
    setStatementId("");
    setTerritoryId("");
  };

  const firstPanelButton = () => (
    <Button
      onClick={() => {
        if (firstPanelExpanded) {
          dispatch(setFirstPanelExpanded(false));
          localStorage.setItem("firstPanelExpanded", "false");
        } else {
          dispatch(setFirstPanelExpanded(true));
          localStorage.setItem("firstPanelExpanded", "true");
        }
      }}
      inverted
      icon={firstPanelExpanded ? <RiMenuFoldFill /> : <RiMenuUnfoldFill />}
    />
  );
  const hideFourthPanelButton = () => (
    <Button
      key="hide"
      onClick={() => {
        if (fourthPanelExpanded) {
          dispatch(setFourthPanelExpanded(false));
          localStorage.setItem("fourthPanelExpanded", "false");
        } else {
          dispatch(setFourthPanelExpanded(true));
          localStorage.setItem("fourthPanelExpanded", "true");
        }
      }}
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
            icon={isThisBoxHidden ? <BiHide /> : <BiShow />}
            onClick={() => handleHideBoxButtonClick(boxToHide, isThisBoxHidden)}
          />
        )}
      </>
    );
  };

  const getFourthPanelBoxHeight = (box: FourthPanelBoxes): number => {
    const isThisBoxHidden = !fourthPanelBoxesOpened[box];
    const openBoxesCount = Object.values(fourthPanelBoxesOpened).filter(
      (b) => b === true
    );

    if (!fourthPanelExpanded) {
      return contentHeight / 3;
    } else if (isThisBoxHidden) {
      return hiddenBoxHeight;
    } else {
      if (openBoxesCount.length === 3) {
        return contentHeight / 3;
      } else if (openBoxesCount.length === 2) {
        return (contentHeight - hiddenBoxHeight) / 2;
      } else {
        return contentHeight - 2 * hiddenBoxHeight;
      }
    }
  };

  return (
    <>
      <ScrollHandler />
      <Page logOutCleanUp={logOutCleanUp}>
        {separatorXPosition > 0 && <PanelSeparator />}
        {/* FIRST PANEL */}
        <Panel
          width={firstPanelExpanded ? panelWidths[0] : collapsedPanelWidth}
        >
          <Box
            height={contentHeight}
            label="Territories"
            isExpanded={firstPanelExpanded}
            button={[firstPanelButton()]}
            noPadding
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
            height={
              detailIdArray.length ? contentHeight / 2 - 20 : contentHeight
            }
            label="Statements"
          >
            <MemoizedStatementListBox />
          </Box>
          {(selectedDetailId || detailIdArray.length > 0) && (
            <Box
              height={contentHeight / 2 + 20}
              label="Detail"
              button={[
                <Button
                  inverted
                  icon={<IoMdClose />}
                  onClick={() => {
                    clearAllDetailIds();
                  }}
                />,
              ]}
            >
              <MemoizedEntityDetailBox />
            </Box>
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
          <Box height={contentHeight} label="Editor">
            <MemoizedStatementEditorBox />
          </Box>
        </Panel>
        {/* FOURTH PANEL */}
        <Panel
          width={fourthPanelExpanded ? panelWidths[3] : collapsedPanelWidth}
        >
          <Box
            height={getFourthPanelBoxHeight("search")}
            label="Search"
            color="white"
            isExpanded={fourthPanelExpanded}
            button={[hideBoxButton("search"), hideFourthPanelButton()]}
          >
            <MemoizedEntitySearchBox />
          </Box>
          <Box
            height={getFourthPanelBoxHeight("bookmarks")}
            label="Bookmarks"
            color="white"
            isExpanded={fourthPanelExpanded}
            button={[hideBoxButton("bookmarks"), hideFourthPanelButton()]}
          >
            <MemoizedEntityBookmarkBox />
          </Box>
          <Box
            height={getFourthPanelBoxHeight("templates")}
            label="Templates"
            color="white"
            isExpanded={fourthPanelExpanded}
            button={[hideBoxButton("templates"), hideFourthPanelButton()]}
          >
            <MemoizedTemplateListBox />
          </Box>
        </Panel>
      </Page>
    </>
  );
};

export default MainPage;
