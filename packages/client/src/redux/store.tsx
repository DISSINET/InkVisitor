import { configureStore } from "@reduxjs/toolkit";
import { combineReducers, Store } from "redux";
import contentHeightSlice from "./features/layout/contentHeightSlice";
import firstPanelExpandedSlice from "./features/layout/mainPage/firstPanelExpandedSlice";
import fourthPanelBoxesOpenedSlice from "./features/layout/mainPage/fourthPanelBoxesOpenedSlice";
import fourthPanelExpandedSlice from "./features/layout/mainPage/fourthPanelExpandedSlice";
import layoutWidthSlice from "./features/layout/layoutWidthSlice";
import panelWidthsSlice from "./features/layout/mainPage/panelWidthsSlice";
import secondPanelRealWidthSlice from "./features/layout/mainPage/secondPanelRealWidthSlice";
import thirdPanelRealWidthSlice from "./features/layout/mainPage/thirdPanelRealWidthSlice";
import statementListOpenedSlice from "./features/layout/mainPage/statementListOpenedSlice";
import thirdPanelExpandedSlice from "./features/layout/mainPage/thirdPanelExpandedSlice";
import pingSlice from "./features/pingSlice";
import draggedActantRowSlice from "./features/rowDnd/draggedActantRowSlice";
import draggedPropRowSlice from "./features/rowDnd/draggedPropRowSlice";
import showWarningsSlice from "./features/statementEditor/showWarningsSlice";
import disableStatementListScrollSlice from "./features/statementList/disableStatementListScrollSlice";
import draggedRowIdSlice from "./features/statementList/draggedRowIdSlice";
import isLoadingSlice from "./features/statementList/isLoadingSlice";
import lastClickedIndexSlice from "./features/statementList/lastClickedIndexSlice";
import rowsExpandedSlice from "./features/statementList/rowsExpandedSlice";
import disableTreeScrollSlice from "./features/territoryTree/disableTreeScrollSlice";
import draggedEntitySlice from "./features/territoryTree/draggedEntitySlice";
import filterOpenSlice from "./features/territoryTree/filterOpenSlice";
import selectedTerritoryPathSlice from "./features/territoryTree/selectedTerritoryPathSlice";
import treeInitializeSlice from "./features/territoryTree/treeInitializeSlice";
import themeSlice from "./features/themeSlice";
import usernameSlice from "./features/usernameSlice";
import detailBoxMinimizedSlice from "./features/layout/mainPage/detailBoxMinimizedSlice";
import panelWidthsPercentSlice from "./features/layout/mainPage/panelWidthsPercentSlice";

const store: Store = configureStore({
  reducer: {
    theme: themeSlice,
    username: usernameSlice,
    ping: pingSlice,
    draggedEntity: draggedEntitySlice,
    territoryTree: combineReducers({
      selectedTerritoryPath: selectedTerritoryPathSlice,
      treeInitialized: treeInitializeSlice,
      disableTreeScroll: disableTreeScrollSlice,
      filterOpen: filterOpenSlice,
    }),
    statementList: combineReducers({
      rowsExpanded: rowsExpandedSlice,
      draggedRowId: draggedRowIdSlice,
      lastClickedIndex: lastClickedIndexSlice,
      disableStatementListScroll: disableStatementListScrollSlice,
      isLoading: isLoadingSlice,
    }),
    statementEditor: combineReducers({
      showWarnings: showWarningsSlice,
    }),
    rowDnd: combineReducers({
      draggedPropRow: draggedPropRowSlice,
      draggedActantRow: draggedActantRowSlice,
    }),
    layout: combineReducers({
      layoutWidth: layoutWidthSlice,
      contentHeight: contentHeightSlice,

      mainPage: combineReducers({
        panelWidths: panelWidthsSlice,
        panelWidthsPercent: panelWidthsPercentSlice,
        firstPanelExpanded: firstPanelExpandedSlice,
        thirdPanelExpanded: thirdPanelExpandedSlice,
        fourthPanelExpanded: fourthPanelExpandedSlice,
        fourthPanelBoxesOpened: fourthPanelBoxesOpenedSlice,
        statementListOpened: statementListOpenedSlice,
        detailBoxMinimized: detailBoxMinimizedSlice,
        secondPanelRealWidth: secondPanelRealWidthSlice,
        thirdPanelRealWidth: thirdPanelRealWidthSlice,
      }),
    }),
  },
});

export default store;

export type RootState = ReturnType<typeof store.getState>;
export type AppDispatch = typeof store.dispatch;
