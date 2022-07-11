import api from "api";
import { Box } from "components";
import { Page } from "components/advanced";
import React, { useState } from "react";
import { useQuery } from "react-query";
import { Redirect } from "react-router-dom";

interface ActivationPage {}

const ActivatePage: React.FC<ActivationPage> = ({}) => {
  const urlParams = new URLSearchParams(window.location.search);
  const [hash] = useState(urlParams.get("hash") || "");
  const { status, data, error, isFetching } = useQuery(
    ["activate"],
    async () => {
      const res = await api.activate(urlParams.get("hash") || "");
      return res.data;
    }
  );

  if (status === "success") {
    return <Redirect to={`/password_reset?hash=${hash}&activated=1`} />;
  }

  return (
    <Page disableRightHeader>
      <Box css={{ textAlign: "center" }}>Activating...</Box>
    </Page>
  );
};

export default ActivatePage;
