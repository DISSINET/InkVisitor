import api from "api";
import React, { useState } from "react";
import { useQuery } from "react-query";
import { Redirect } from "react-router-dom";
import { toast } from "react-toastify";
import { StyledText } from "./ActivateStyles";

interface ActivationPage { }

const ActivatePage: React.FC<ActivationPage> = ({ }) => {
  const urlParams = new URLSearchParams(window.location.search);
  const [hash] = useState(urlParams.get("hash") || "");
  const { status, data, error, isFetching } = useQuery(
    ["activate"],
    async () => {
      return await api.activate(urlParams.get("hash") || "").then((response) => { toast.success(response.data.message); return response.data; });
    }
  );

  if (status === "success") {
    return <Redirect to={`/login`} />;
  }

  return <StyledText>{"Activating..."}</StyledText>;
};

export default ActivatePage;
