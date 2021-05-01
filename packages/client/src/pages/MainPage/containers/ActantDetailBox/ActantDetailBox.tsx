import React, { useEffect, useState } from "react";
const queryString = require("query-string");

import { Button, Input, Loader } from "components";
import { StyledContent, StyledRow } from "./ActandDetailBoxStyles";
import { useHistory, useLocation } from "react-router-dom";
import api from "api";
import { QueryClient, useQuery, useQueryClient } from "react-query";
import { IActant, IOption } from "@shared/types";
import { FaTimes } from "react-icons/fa";
import { ActantTag } from "..";

import { ActantType } from "@shared/enums";

interface ActantDetailBox {}
export const ActantDetailBox: React.FC<ActantDetailBox> = ({}) => {
  let history = useHistory();
  let location = useLocation();
  var hashParams = queryString.parse(location.hash);
  const actantId = hashParams.actant;

  const queryClient = useQueryClient();

  const { status, data: actant, error, isFetching } = useQuery(
    ["actant", actantId],
    async () => {
      const res = await api.actantsGet(actantId);
      return res.data;
    },
    { enabled: !!actantId && api.isLoggedIn() }
  );

  return (
    <>
      {actant && (
        <StyledContent>
          <StyledRow>
            {/* <Input
              type="select"
              value={actant.class}
              options={ActantType.map(actantType => ({
                label: actantType,

              }))}
              onChangeFn={async (newSelectedId: string) => {
                const res = await api.actantsUpdate(actant.id, {
                  ...actant,
                  ...{ class: newSelectedId },
                });
                queryClient.invalidateQueries(["actant"]);
                queryClient.invalidateQueries(["territory"]);
              }}
            /> */}
            <ActantTag actant={actant} propId={actant.id} />
            <Input
              value={actant.label}
              onChangeFn={async (newLabel: string) => {
                const res = await api.actantsUpdate(actant.id, {
                  ...actant,
                  ...{ label: newLabel },
                });
                queryClient.invalidateQueries(["actant"]);
                queryClient.invalidateQueries(["statement"]);
                //queryClient.invalidateQueries(["territory"]);
              }}
            />
            <Button
              color="danger"
              icon={<FaTimes />}
              onClick={() => {
                hashParams["actant"] = "";
                history.push({
                  hash: queryString.stringify(hashParams),
                });
                // TODO: remove actant from URL
              }}
            />
          </StyledRow>
        </StyledContent>
      )}
      <Loader show={isFetching} />
    </>
  );
};
