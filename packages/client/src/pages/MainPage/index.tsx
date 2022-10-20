import { Box, Button, Panel } from "components";
import { PanelSeparator } from "components/advanced";
import { useSearchParams } from "hooks";
import ScrollHandler from "hooks/ScrollHandler";
import React from "react";
import { BiHide, BiShow } from "react-icons/bi";
import { BsSquareFill, BsSquareHalf } from "react-icons/bs";
import { IoMdClose } from "react-icons/io";
import { RiMenuFoldFill, RiMenuUnfoldFill } from "react-icons/ri";
import { setFirstPanelExpanded } from "redux/features/layout/firstPanelExpandedSlice";
import { setFourthPanelBoxesOpened } from "redux/features/layout/fourthPanelBoxesOpenedSlice";
import { setFourthPanelExpanded } from "redux/features/layout/fourthPanelExpandedSlice";
import { setStatementListOpened } from "redux/features/layout/statementListOpenedSlice";
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
  const { detailIdArray, clearAllDetailIds, selectedDetailId } =
    useSearchParams();

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
            icon={isThisBoxHidden ? <BiShow /> : <BiHide />}
            onClick={() => handleHideBoxButtonClick(boxToHide, isThisBoxHidden)}
          />
        )}
      </>
    );
  };

  // TODO: use percentage heights in getHeight fn
  // percentage when three panels opened
  const fourthPanelBoxesHeightThirds = {
    search: 40,
    bookmarks: 27,
    templates: 33,
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
        // return contentHeight / 3;
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
      {separatorXPosition > 0 && <PanelSeparator />}
      {/* FIRST PANEL */}
      {panelWidths[0] > 0 && (
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
      )}
      {/* SECOND PANEL */}
      {panelWidths[1] > 0 && (
        <Panel
          width={
            firstPanelExpanded
              ? panelWidths[1]
              : panelWidths[1] + panelWidths[0] - collapsedPanelWidth
          }
        >
          <Box
            borderColor="white"
            height={
              detailIdArray.length
                ? statementListOpened
                  ? contentHeight / 2 - 20
                  : hiddenBoxHeight
                : contentHeight
            }
            label="Statements"
          >
            <MemoizedStatementListBox />
          </Box>
          {(selectedDetailId || detailIdArray.length > 0) && (
            <Box
              borderColor="white"
              height={
                statementListOpened
                  ? contentHeight / 2 + 20
                  : contentHeight - hiddenBoxHeight
              }
              label="Detail"
              button={[
                <Button
                  inverted
                  icon={
                    statementListOpened ? (
                      <BsSquareFill />
                    ) : (
                      <BsSquareHalf style={{ transform: "rotate(90deg)" }} />
                    )
                  }
                  onClick={() => {
                    statementListOpened
                      ? localStorage.setItem("statementListOpened", "false")
                      : localStorage.setItem("statementListOpened", "true");
                    dispatch(setStatementListOpened(!statementListOpened));
                  }}
                />,
                <Button
                  inverted
                  icon={<IoMdClose />}
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
        </Panel>
      )}
      {/* THIRD PANEL */}
      {panelWidths[2] > 0 && (
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
      )}
      {/* FOURTH PANEL */}
      {panelWidths[3] > 0 && (
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
      )}
    </>
  );
};

export default MainPage;
