import api from "api";
import React, { useEffect, useMemo, useState } from "react";
import { useQuery } from "react-query";
import { StyledBoxContent } from "./TemplateListBoxStyles";

interface TemplateListBox {}
export const TemplateListBox: React.FC<TemplateListBox> = ({}) => {
  const {
    status,
    data: templatesData,
    error,
    isFetching,
  } = useQuery(
    ["templates"],
    async () => {
      const res = await api.entitiesGetMore({
        class: "*",
        onlyTemplates: true,
      });
      return res.data;
    },
    {
      enabled: api.isLoggedIn(),
      initialData: [],
    }
  );

  return (
    <StyledBoxContent>
      {templatesData?.map((templateData) => {
        <div>{templateData.id}</div>;
      })}
    </StyledBoxContent>
  );
};
