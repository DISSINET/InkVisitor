import React, { useEffect, useState } from "react";
import { DndProvider } from "react-dnd";
import { HTML5Backend } from "react-dnd-html5-backend";

import { toast } from "react-toastify";

import {
  Box,
  Button,
  Footer,
  Header,
  Panel,
  PanelSeparator,
  Toast,
} from "components";

import { useHistory, useParams } from "react-router-dom";
import api from "api";
import { useQueryClient } from "react-query";
import { useAppDispatch, useAppSelector } from "redux/hooks";
import { setAuthToken } from "redux/features/authTokenSlice";
import { setUsername } from "redux/features/usernameSlice";
import {
  StyledUserBox,
  StyledPanelWrap,
  StyledUser,
  StyledFaUserAlt,
  StyledText,
  StyledUsername,
  StyledButtonWrap,
  StyledPage,
} from "./MainPageStyles";
import {
  collapsedPanelWidth,
  heightFooter,
  heightHeader,
  layoutWidthBreakpoint,
} from "Theme/constants";
import { RiMenuFoldFill, RiMenuUnfoldFill } from "react-icons/ri";
import { setFirstPanelExpanded } from "redux/features/layout/firstPanelExpandedSlice";
import { setFourthPanelExpanded } from "redux/features/layout/fourthPanelExpandedSlice";
import { useQuery } from "react-query";
import { IResponsePermission, RequestPermissionUpdate } from "@shared/types";
import { userRoleDict } from "@shared/dictionaries";

interface MainPage {
  size: number[];
}

const AclPage: React.FC<MainPage> = ({ size }) => {
  const isLoggedIn = api.isLoggedIn();
  const dispatch = useAppDispatch();
  const username = useAppSelector((state) => state.username);
  const layoutWidth: number = useAppSelector(
    (state) => state.layout.layoutWidth
  );

  const [currentCtrlName, setCtrl] = useState("");
  const [currentMethod, setMethod] = useState("");

  const { status, data, error, isFetching } = useQuery(
    ["permissions"],
    async () => {
      const res = await api.getAclPermissions();
      return res.data;
    },
    { initialData: [] }
  );

  const handleLogOut = () => {
    api.signOut();
    dispatch(setUsername(""));
    dispatch(setAuthToken(""));
    toast.success("You've been successfully logged out!");
  };

  const handleSave = async (
    permissionId: string,
    data: RequestPermissionUpdate
  ) => {
    await api.updatePermission(permissionId, data);
  };

  const ctrls = (data as IResponsePermission[])?.reduce<
    Record<string, Record<string, IResponsePermission>>
  >((acc, current) => {
    if (!acc[current.controller]) {
      acc[current.controller] = {};
    }

    acc[current.controller][current.method] = current;
    return acc;
  }, {});

  return (
    <>
      <StyledPage layoutWidth>
        <Header
          height={heightHeader}
          paddingY={0}
          paddingX={10}
          left={<div>InkVisitor</div>}
          right={
            <div>
              {isLoggedIn && (
                <StyledUserBox>
                  <StyledUser>
                    <StyledText>logged as</StyledText>
                    <StyledFaUserAlt size={14} />
                    <StyledUsername>{username}</StyledUsername>
                  </StyledUser>
                  <Button
                    label="Log Out"
                    color="danger"
                    onClick={() => handleLogOut()}
                  />
                </StyledUserBox>
              )}
            </div>
          }
        />
        {Object.keys(ctrls).map((ctrlName) => (
          <div
            key={ctrlName}
            style={{
              backgroundColor:
                ctrlName == currentCtrlName ? "#ccc" : "transparent",
            }}
            onClick={() => setCtrl(ctrlName)}
          >
            {ctrlName}
          </div>
        ))}
        {currentCtrlName && (
          <Box>
            {Object.keys(ctrls[currentCtrlName]).map((method) => (
              <div
                key={method}
                style={{
                  backgroundColor:
                    method == currentMethod ? "#ccc" : "transparent",
                }}
                onClick={() => setMethod(method)}
              >
                {method}
              </div>
            ))}
            <hr />
            {currentMethod && ctrls[currentCtrlName][currentMethod] && (
              <div>
                Roles:{" "}
                <select
                  onChange={(e) =>
                    handleSave(ctrls[currentCtrlName][currentMethod].id, {
                      roles: Array.from(
                        e.target.selectedOptions,
                        (option) => option.value
                      ),
                    })
                  }
                  multiple={true}
                >
                  {userRoleDict.map((role) => (
                    <option
                      key={role.label}
                      selected={
                        ctrls[currentCtrlName][currentMethod].roles.indexOf(
                          role.label
                        ) !== -1
                      }
                      value={role.label}
                    >
                      {role.label}
                    </option>
                  ))}
                  <option
                    selected={
                      ctrls[currentCtrlName][currentMethod].roles.indexOf(
                        "*"
                      ) !== -1
                    }
                    value="*"
                  >
                    all
                  </option>
                </select>
                <button>save</button>
              </div>
            )}
          </Box>
        )}
        <Toast />
        <Footer height={heightFooter} />
      </StyledPage>
    </>
  );
};

export default AclPage;
