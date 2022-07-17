import { userRoleDict } from "@shared/dictionaries";
import { UserRole } from "@shared/enums";
import { IResponsePermission, RequestPermissionUpdate } from "@shared/types";
import api from "api";
import { Box } from "components";
import { Page } from "components/advanced";
import React, { useState } from "react";
import { useQuery } from "react-query";

interface AclPage {}

const initialData: IResponsePermission[] = [
  {
    id: "",
    controller: "",
    route: "",
    roles: [],
  },
];

const AclPage: React.FC<AclPage> = ({}) => {
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

  const handleSave = async (
    permissionId: string,
    data: RequestPermissionUpdate
  ) => {
    await api.updatePermission(permissionId, data);
  };

  const ctrls = data
    ? (data as IResponsePermission[]).reduce<
        Record<string, Record<string, IResponsePermission>>
      >((acc, current) => {
        if (!acc[current.controller]) {
          acc[current.controller] = {};
        }

        acc[current.controller][current.route] = current;
        return acc;
      }, {})
    : {};

  return (
    <Page>
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
                      (option) => option.value as UserRole
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
                    ctrls[currentCtrlName][currentMethod].roles.indexOf("*") !==
                    -1
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
    </Page>
  );
};

export default AclPage;
