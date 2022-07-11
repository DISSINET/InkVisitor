import api from "api";
import { Box, Button, Input } from "components";
import { Page } from "components/advanced";
import React, { useState } from "react";
import { toast } from "react-toastify";
import {
  StyledButtonWrap,
  StyledContentWrap,
  StyledFaLock,
  StyledHeading,
  StyledInputRow,
} from "./PasswordResetStyles";

interface PasswordResetPage {}

const PasswordResetPage: React.FC<PasswordResetPage> = ({}) => {
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
    <Page disableRightHeader centeredContent>
      <StyledContentWrap>
        {activated && <Box>Account activated. Please set your password</Box>}
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
          <Button fullWidth label="Submit" color="success" onClick={submit} />
        </StyledButtonWrap>
      </StyledContentWrap>
    </Page>
  );
};

export default PasswordResetPage;
