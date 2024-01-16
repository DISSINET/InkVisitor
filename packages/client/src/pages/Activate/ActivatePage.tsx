import api from "api";
import React, { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { Navigate } from "react-router-dom";
import { toast } from "react-toastify";
import { StyledText } from "./ActivatePageStyles";

interface ActivationPage {}

const ActivatePage: React.FC<ActivationPage> = ({}) => {
  const urlParams = new URLSearchParams(window.location.search);
  const [hash] = useState(urlParams.get("hash") || "");
  const { status, data, error, isFetching } = useQuery(
    ["activate"],
    async () => {
      return await api
        .activation(urlParams.get("hash") || "", "", "")
        .then((response) => {
          toast.success(response.data.message);
          return response.data;
        });
    }
  );

  if (status === "success") {
    return <Navigate to={`/login`} />;
  }

  return <StyledText>{"Activating..."}</StyledText>;
};

export default ActivatePage;
