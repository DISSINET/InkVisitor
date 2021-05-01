import React, { useEffect, useState } from "react";
const queryString = require("query-string");

import { Button, Input } from "components";
import { StyledContent, StyledRow } from "./ActandDetailBoxStyles";
import { useHistory, useLocation } from "react-router-dom";
import api from "api";
import { QueryClient, useQuery, useQueryClient } from "react-query";
import { IActant, IOption } from "@shared/types";
import { FaTimes } from "react-icons/fa";
import { ActantTag } from "..";
import { Entities } from "types";

import { ActantType } from "@shared/enums";

interface ActantDetailBox {}
export const ActantDetailBox: React.FC<ActantDetailBox> = ({}) => {
  let history = useHistory();
  let location = useLocation();
  var hashParams = queryString.parse(location.hash);
  const actantId = hashParams.actant;

  const queryClient = useQueryClient();

  const { status, data, error, isFetching } = useQuery(
    ["actant", actantId],
    async () => {
      const res = await api.actantsGet(actantId);
      return res.data;
    },
    { enabled: !!actantId && api.isLoggedIn() }
  );

  const [selectedCategory, setSelectedCategory] = useState<string>("T");
  const [tagLabel, setTagLabel] = useState("");
  const [actant, setActant] = useState<IActant>();
  const [allCategories, setAllCategories] = useState<false | IOption[]>();

  // initial load of categories
  useEffect(() => {
    const categories: IOption[] = [];

    for (const actantType in ActantType) {
      const foundEntityCategory = Object.values(Entities).find(
        (e) => e.label === actantType
      );
      if (foundEntityCategory) {
        categories.push({
          label: foundEntityCategory.id,
          value: foundEntityCategory.id,
        });
      }
    }

    if (categories.length) {
      setAllCategories(categories);
      setSelectedCategory(categories[0].value);
    }
  }, []);

  useEffect(() => {
    if (data) {
      setTagLabel(data.label);
      setSelectedCategory(data.class);
      setActant(data);
    }
  }, [data]);

  const updateActant = (statementActantId: string, changes: any) => {
    // if (statementActantId) {
    //   const updatedActants = statement.data.actants.map((a) =>
    //     a.id === statementActantId ? { ...a, ...changes } : a
    //   );
    //   const newData = { ...statement.data, ...{ actants: updatedActants } };
    //   update(newData);
    // }
  };

  return (
    <>
      {actant && allCategories && (
        <StyledContent>
          <StyledRow>
            <Input
              type="select"
              value={selectedCategory}
              options={allCategories}
              onChangeFn={(newSelectedId: string) => {
                console.log(newSelectedId);
                //setSelectedCategory(newSelectedId);
                api.actantsUpdate(actant.id, {
                  ...actant,
                  ...{ class: newSelectedId },
                });
                queryClient.invalidateQueries(["actant", actantId]);
              }}
            />
            <ActantTag actant={actant} propId={actant.id} />
            <Input
              value={tagLabel}
              onChangeFn={(value: string) => setTagLabel(value)}
            />
            <Button
              color="danger"
              icon={<FaTimes />}
              onClick={() => {
                setActant(undefined);
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
    </>
  );
};
