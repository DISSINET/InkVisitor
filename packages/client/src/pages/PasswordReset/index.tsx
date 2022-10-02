import api from "api";
import { Button, Input } from "components";
import React, { useState } from "react";
import { toast } from "react-toastify";
import {
  StyledBoxWrap,
  StyledButtonWrap,
  StyledContent,
  StyledDescription,
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
    <StyledContent>
      <StyledBoxWrap>
        {activated && (
          <StyledDescription>
            {"Account activated. Please set your password"}
          </StyledDescription>
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
          <Button fullWidth label="Submit" color="success" onClick={submit} />
        </StyledButtonWrap>
      </StyledBoxWrap>
    </StyledContent>
  );
};

export default PasswordResetPage;
