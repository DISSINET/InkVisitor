import React, { useEffect, useState } from "react";
const queryString = require("query-string");

import { Input } from "components";
import { StyledContent } from "./ActandDetailBoxStyles";
import { useHistory, useLocation } from "react-router-dom";
import api from "api";
import { useQuery } from "react-query";

interface ActantDetailBox {}
export const ActantDetailBox: React.FC<ActantDetailBox> = ({}) => {
  let history = useHistory();
  let location = useLocation();
  var hashParams = queryString.parse(location.hash);
  const actantId = hashParams.actant;

  const { status, data, error, isFetching } = useQuery(
    ["actant", actantId],
    async () => {
      const res = await api.actantsGet(actantId);
      return res.data;
    },
    { enabled: !!actantId }
  );

  const [selectedCategory, setSelectedCategory] = useState<string>("T");
  const [tagLabel, setTagLabel] = useState("");

  useEffect(() => {
    if (data) {
      setTagLabel(data.label);
      setSelectedCategory(data.class);
    }
  }, [data]);

  return (
    <StyledContent>
      <Input
        type="select"
        label="Category: "
        value={selectedCategory}
        options={[]}
        onChangeFn={(newCategory: string) => setSelectedCategory(newCategory)}
      />
      <Input
        label="Label: "
        value={tagLabel}
        onChangeFn={(value: string) => setTagLabel(value)}
      />
    </StyledContent>
  );
};
