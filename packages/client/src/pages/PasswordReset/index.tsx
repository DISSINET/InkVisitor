import api from "api";
import { Box, Button, Input, Footer, Header, Toast } from "components";
import React, { useState } from "react";
import { toast } from "react-toastify";
import { useAppDispatch, useAppSelector } from "redux/hooks";
import { heightFooter, heightHeader } from "Theme/constants";
import {
  StyledPage,
  StyledHeading,
  StyledFaLock,
  StyledInputRow,
  StyledContentWrap,
  StyledButtonWrap,
} from "./PasswordResetStyles";

interface PasswordResetPage {
  size: number[];
}

const PasswordResetPage: React.FC<PasswordResetPage> = ({ size }) => {
  const dispatch = useAppDispatch();
  const layoutWidth: number = useAppSelector(
    (state) => state.layout.layoutWidth
  );
  const [password, setPassword] = useState("");
  const [passwordRepeat, setPasswordRepeat] = useState("");
  const urlParams = new URLSearchParams(window.location.search);
  const [hash] = useState(urlParams.get("hash") || "");
  const [activated] = useState(urlParams.get("activated"));

  const submit = async () => {
    const response = await api.resetPassword(hash, password, passwordRepeat);
    toast.success(response.data.message);
  };

  return (
    <>
      <StyledPage layoutWidth={layoutWidth}>
        <Header
          height={heightHeader}
          paddingY={0}
          paddingX={10}
          left={<div>InkVisitor</div>}
          right={<div></div>}
        />
        <Box>
          <StyledContentWrap>
            {activated && (
              <Box>Account activated. Please set your password</Box>
            )}
            <StyledHeading>{"Reset password"}</StyledHeading>
            <StyledInputRow>
              <StyledFaLock size={14} />
              <Input
                placeholder="password"
                password
                onChangeFn={(text: string) => setPassword(text)}
                value={password}
                changeOnType
                noBorder
              />
            </StyledInputRow>
            <StyledInputRow>
              <StyledFaLock size={14} />
              <Input
                placeholder="password repeat"
                password
                onChangeFn={(text: string) => setPasswordRepeat(text)}
                value={passwordRepeat}
                changeOnType
                noBorder
              />
            </StyledInputRow>
            <StyledButtonWrap>
              <Button
                fullWidth
                label="Submit"
                color="success"
                onClick={submit}
              />
            </StyledButtonWrap>
          </StyledContentWrap>
        </Box>
        <Toast />
        <Footer height={heightFooter} />
      </StyledPage>
    </>
  );
};

export default PasswordResetPage;
