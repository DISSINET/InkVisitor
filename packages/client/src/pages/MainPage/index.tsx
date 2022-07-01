import api from "api";

import { Box, Button, Header, Panel, PanelSeparator, Toast } from "components";
import { MemoizedFooter } from "components/Footer/Footer";
import { useSearchParams } from "hooks";
import ScrollHandler from "hooks/ScrollHandler";
import React, { useState } from "react";
import { DndProvider } from "react-dnd";
import { HTML5Backend } from "react-dnd-html5-backend";
import { BiHide, BiShow } from "react-icons/bi";
import { IoMdClose } from "react-icons/io";
import { RiMenuFoldFill, RiMenuUnfoldFill } from "react-icons/ri";
import { useQuery, useQueryClient } from "react-query";
import { toast } from "react-toastify";
import { setFirstPanelExpanded } from "redux/features/layout/firstPanelExpandedSlice";
import { setFourthPanelBoxesOpened } from "redux/features/layout/fourthPanelBoxesOpenedSlice";
import { setFourthPanelExpanded } from "redux/features/layout/fourthPanelExpandedSlice";
import { setUsername } from "redux/features/usernameSlice";
import { useAppDispatch, useAppSelector } from "redux/hooks";
import {
  collapsedPanelWidth,
  heightFooter,
  heightHeader,
  hiddenBoxHeight,
} from "Theme/constants";
import { UserListModal } from "./containers";
import { MemoizedEntityBookmarkBox } from "./containers/EntityBookmarkBox/EntityBookmarkBox";
import { MemoizedEntityDetailBox } from "./containers/EntityDetailBox/EntityDetailBox";
import { MemoizedEntitySearchBox } from "./containers/EntitySearchBox/EntitySearchBox";
import { LeftHeader, RightHeader } from "./containers/Header/Header";
import { MemoizedLoginModal } from "./containers/LoginModal/LoginModal";
import { MemoizedStatementEditorBox } from "./containers/StatementEditorBox/StatementEditorBox";
import { MemoizedStatementListBox } from "./containers/StatementsListBox/StatementListBox";
import { MemoizedTemplateListBox } from "./containers/TemplateListBox/TemplateListBox";
import { MemoizedTerritoryTreeBox } from "./containers/TerritoryTreeBox/TerritoryTreeBox";
import { UserCustomizationModal } from "./containers/UserCustomizationModal/UserCustomizationModal";
import { StyledPage, StyledPanelWrap } from "./MainPageStyles";

interface MainPage {
  size: number[];
}

const MainPage: React.FC<MainPage> = ({ size }) => {
  const {
    detailId,
    setDetailId,
    statementId,
    setStatementId,
    territoryId,
    setTerritoryId,
  } = useSearchParams();

  const [width, height] = size;

  const isLoggedIn = api.isLoggedIn();
  const dispatch = useAppDispatch();
  const username: string = useAppSelector((state) => state.username);
  const fourthPanelBoxesOpened: { [key: string]: boolean } = useAppSelector(
    (state) => state.layout.fourthPanelBoxesOpened
  );
  const userId = localStorage.getItem("userid");
  const userRole = localStorage.getItem("userrole");

  const firstPanelExpanded: boolean = useAppSelector(
    (state) => state.layout.firstPanelExpanded
  );
  const fourthPanelExpanded: boolean = useAppSelector(
    (state) => state.layout.fourthPanelExpanded
  );
  const layoutWidth: number = useAppSelector(
    (state) => state.layout.layoutWidth
  );
  const panelWidths: number[] = useAppSelector(
    (state) => state.layout.panelWidths
  );
  const separatorXPosition: number = useAppSelector(
    (state) => state.layout.separatorXPosition
  );
  const queryClient = useQueryClient();

  const {
    status: statusUser,
    data: user,
    error: errorUser,
    isFetching: isFetchingUser,
  } = useQuery(
    ["user", username],
    async () => {
      if (userId) {
        const res = await api.usersGet(userId);
        return res.data;
      } else {
        return false;
      }
    },
    { enabled: !!userId && api.isLoggedIn() }
  );

  const [userAdministrationModalOpen, setUserAdministrationModalOpen] =
    useState<boolean>(false);
  const handleLogOut = () => {
    api.signOut();
    dispatch(setUsername(""));
    toast.success("You've been successfully logged out!");
    queryClient.removeQueries();
    setDetailId("");
    setStatementId("");
    setTerritoryId("");
  };

  const handleUsersModalClick = () => {
    setUserAdministrationModalOpen(true);
  };

  const handleUsersModalCancelClick = () => {
    setUserAdministrationModalOpen(false);
  };

  const environmentName = (process.env.ROOT_URL || "").replace(
    /apps\/inkvisitor[-]?/,
    ""
  );

  const heightContent = height - heightHeader - heightFooter;

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

  const [userCustomizationOpen, setUserCustomizationOpen] = useState(false);

  const [hiddenBox, setHiddenBox] = useState<
    false | "search" | "bookmarks" | "templates"
  >(false);

  const hideBoxButton = (boxToHide: "search" | "bookmarks" | "templates") => {
    const isThisBoxHidden = !fourthPanelBoxesOpened[boxToHide];
    return (
      <>
        {fourthPanelExpanded && (
          <Button
            inverted
            icon={isThisBoxHidden ? <BiHide /> : <BiShow />}
            onClick={() =>
              isThisBoxHidden
                ? dispatch(
                    setFourthPanelBoxesOpened({
                      ...fourthPanelBoxesOpened,
                      [boxToHide]: true,
                    })
                  )
                : dispatch(
                    setFourthPanelBoxesOpened({
                      ...fourthPanelBoxesOpened,
                      [boxToHide]: false,
                    })
                  )
            }
          />
        )}
      </>
    );
  };

  return (
    <>
      <StyledPage layoutWidth={layoutWidth}>
        <Header
          height={heightHeader}
          paddingY={0}
          paddingX={10}
          color={
            ["production", ""].indexOf(environmentName) === -1
              ? environmentName
              : "primary"
          }
          left={<LeftHeader />}
          right={
            isLoggedIn ? (
              <RightHeader
                setUserCustomizationOpen={setUserCustomizationOpen}
                handleUsersModalClick={handleUsersModalClick}
                handleLogOut={handleLogOut}
                userName={user ? user.name : ""}
                userRole={userRole || ""}
              />
            ) : undefined
          }
        />
        <DndProvider backend={HTML5Backend}>
          <ScrollHandler />
          <StyledPanelWrap>
            {separatorXPosition > 0 && <PanelSeparator />}
            {/* FIRST PANEL */}
            <Panel
              width={firstPanelExpanded ? panelWidths[0] : collapsedPanelWidth}
            >
              <Box
                height={heightContent}
                label="Territories"
                isExpanded={firstPanelExpanded}
                button={firstPanelButton()}
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
                height={detailId ? heightContent / 2 - 20 : heightContent}
                label="Statements"
              >
                <MemoizedStatementListBox />
              </Box>
              {detailId && (
                <Box
                  height={heightContent / 2 + 20}
                  label="Detail"
                  button={
                    detailId && (
                      <Button
                        inverted
                        icon={<IoMdClose />}
                        onClick={() => {
                          setDetailId("");
                        }}
                      />
                    )
                  }
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
              <Box height={heightContent} label="Editor">
                <MemoizedStatementEditorBox />
              </Box>
            </Panel>
            {/* FOURTH PANEL */}
            <Panel
              width={fourthPanelExpanded ? panelWidths[3] : collapsedPanelWidth}
            >
              <Box
                height={
                  fourthPanelBoxesOpened["search"] ? undefined : hiddenBoxHeight
                }
                label="Search"
                color="white"
                isExpanded={fourthPanelExpanded}
                button={[hideBoxButton("search"), hideFourthPanelButton()]}
              >
                <MemoizedEntitySearchBox />
              </Box>
              <Box
                height={
                  fourthPanelBoxesOpened["bookmarks"]
                    ? undefined
                    : hiddenBoxHeight
                }
                label="Bookmarks"
                color="white"
                isExpanded={fourthPanelExpanded}
                button={[hideBoxButton("bookmarks"), hideFourthPanelButton()]}
              >
                <MemoizedEntityBookmarkBox />
              </Box>
              <Box
                height={
                  fourthPanelBoxesOpened["templates"]
                    ? undefined
                    : hiddenBoxHeight
                }
                label="Templates"
                color="white"
                isExpanded={fourthPanelExpanded}
                button={[hideBoxButton("templates"), hideFourthPanelButton()]}
              >
                <MemoizedTemplateListBox />
              </Box>
            </Panel>
          </StyledPanelWrap>
          <UserListModal
            isOpen={userAdministrationModalOpen}
            onCloseFn={handleUsersModalCancelClick}
          />
          {user && userCustomizationOpen && (
            <UserCustomizationModal
              user={user}
              onClose={() => setUserCustomizationOpen(false)}
            />
          )}
        </DndProvider>

        <Toast />
        <MemoizedFooter height={heightFooter} />
        {!isLoggedIn && <MemoizedLoginModal />}
      </StyledPage>
    </>
  );
};

export default MainPage;
