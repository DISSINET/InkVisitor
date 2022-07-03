import api from "api";
import { Box, Button, Footer, Header, Toast } from "components";
import React, { useState } from "react";
import { Redirect } from "react-router-dom";
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
} from "./ActivateStyles";

interface ActivationPage {
  size: number[];
}

const ActivatePage: React.FC<ActivationPage> = ({ size }) => {
  const dispatch = useAppDispatch();
  const layoutWidth: number = useAppSelector(
    (state) => state.layout.layoutWidth
  );

  const urlParams = new URLSearchParams(window.location.search);
  const [hash] = useState(urlParams.get("hash") || "");
  const { status, data, error, isFetching } = useQuery(
    ["activate"],
    async () => {
      const res = await api.activate(urlParams.get("hash") || "");
      return res.data;
    }
  );

  return (
    <>
      {status === "success" && (
        <Redirect to={`/password_reset?hash=${hash}&activated=1`} />
      )}
      <StyledPage layoutWidth={layoutWidth}>
        <Header
          height={heightHeader}
          paddingY={0}
          paddingX={10}
          left={<div>InkVisitor</div>}
          right={<div></div>}
        />
        <Box css={{ textAlign: "center" }}>Activating...</Box>
        <Toast />
        <Footer height={heightFooter} />
      </StyledPage>
    </>
  );
};

export default ActivatePage;
