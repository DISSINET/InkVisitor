import { Button, Input } from "components";
import React from "react";
import { IoReloadCircle } from "react-icons/io5";
import {
  StyledInputRow,
  StyledTbMailFilled,
  StyledErrorText,
  StyledButtonWrap,
} from "../LoginModalStyles";

interface PasswordRecoverScreen {
  emailLocal: string;
  setEmailLocal: React.Dispatch<React.SetStateAction<string>>;
  emailError: boolean;
  setEmailError: React.Dispatch<React.SetStateAction<boolean>>;
  handlePasswordReset: () => Promise<void>;
}
export const PasswordRecoverScreen: React.FC<PasswordRecoverScreen> = ({
  emailLocal,
  setEmailLocal,
  emailError,
  setEmailError,
  handlePasswordReset,
}) => {
  const validateEmail = (email: string): boolean => {
    const emailRegex: RegExp = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email);
  };

  return (
    <>
      <StyledInputRow>
        <StyledTbMailFilled size={14} isError={emailError} />
        <Input
          placeholder="email"
          onChangeFn={(text: string) => setEmailLocal(text)}
          value={emailLocal}
          changeOnType
          autoFocus
          borderColor={emailError ? "danger" : undefined}
        />
      </StyledInputRow>
      {emailError && <StyledErrorText>Invalid email entered.</StyledErrorText>}
      <StyledButtonWrap>
        <div>
          <Button
            fullWidth
            icon={<IoReloadCircle />}
            label="Recover password"
            color="success"
            onClick={() => {
              if (validateEmail(emailLocal)) {
                handlePasswordReset();
              } else {
                setEmailError(true);
              }
            }}
            disabled={emailLocal.length === 0}
          />
        </div>
      </StyledButtonWrap>
    </>
  );
};
