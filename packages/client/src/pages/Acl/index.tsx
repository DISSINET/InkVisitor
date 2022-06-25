import { userRoleDict } from "@shared/dictionaries";
import { IResponsePermission, RequestPermissionUpdate } from "@shared/types";
import api from "api";
import { Box, Button, Footer, Header, Toast } from "components";
import React, { useState } from "react";
import { useQuery } from "react-query";
import { toast } from "react-toastify";
import { setUsername } from "redux/features/usernameSlice";
import { useAppDispatch, useAppSelector } from "redux/hooks";
import { heightFooter, heightHeader } from "Theme/constants";
import {
  StyledFaUserAlt,
  StyledPage,
  StyledText,
  StyledUser,
  StyledUserBox,
  StyledUsername,
} from "./AclStyles";

interface AclPage {
  size: number[];
}

const initialData: IResponsePermission = {
  id: "",
  controller: "",
  method: "",
  roles: [],
};

const AclPage: React.FC<AclPage> = ({ size }) => {
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
    { initialData: initialData }
  );

  const handleLogOut = () => {
    api.signOut();
    dispatch(setUsername(""));
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
      <StyledPage layoutWidth={layoutWidth}>
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
