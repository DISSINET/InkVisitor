import { PasswordDoesNotMatchError, UnsafePasswordError } from "@inkvisitor/shared/types/errors";
import { SAFE_PASSWORD_DESCRIPTION } from "Theme/constants";
import { Button, Input } from "components";
import {
  StyledDescription,
  StyledErrorText,
  StyledErrorWrap,
  StyledForm,
  StyledInputRow,
  StyledMail,
  StyledMailIcon,
  StyledSubmitWrap,
  StyledText,
} from "pages/AuthModalSharedStyles";
import React, { useEffect, useState } from "react";
import { isSafePassword } from "utils/utils";
import { StyledTbLockExclamation, StyledTbLockPlus } from "./ActivateSreensStyles";
import { ButtonSize } from "types";

interface PasswordScreen {
  email: string;
  password: string;
  setPassword: React.Dispatch<React.SetStateAction<string>>;
  passwordRepeat: string;
  setPasswordRepeat: React.Dispatch<React.SetStateAction<string>>;
  setUsernameScreen: React.Dispatch<React.SetStateAction<boolean>>;
}
export const PasswordScreen: React.FC<PasswordScreen> = ({
  email,
  password,
  setPassword,
  passwordRepeat,
  setPasswordRepeat,
  setUsernameScreen,
}) => {
  const [error, setError] = useState<false | string>(false);

  useEffect(() => {
    if (password.length > 0 && !isSafePassword(password)) {
      setError(UnsafePasswordError.message);
    } else if (passwordRepeat.length > 0 && password !== passwordRepeat) {
      setError(PasswordDoesNotMatchError.message);
    } else {
      setError(false);
    }
  }, [password, passwordRepeat]);

  const handleContinue = async () => {
    if (password !== passwordRepeat) {
      setError(PasswordDoesNotMatchError.message);
    } else {
      setUsernameScreen(true);
    }
  };

  return (
    <>
      <StyledText>Enter a safe password to activate the user</StyledText>
      <StyledMail>
        <StyledMailIcon size={14} />
        {email}
      </StyledMail>
      <StyledDescription>{SAFE_PASSWORD_DESCRIPTION}</StyledDescription>
      <StyledForm
        onSubmit={(e) => {
          e.preventDefault();
          handleContinue();
        }}
      >
        <StyledInputRow>
          <Input
            icon={<StyledTbLockPlus size={15} $isError={error !== false} />}
            width="full"
            fullHeight
            type="password"
            placeholder="new password"
            onChangeFn={(text: string) => setPassword(text)}
            value={password}
            changeOnType
            autoFocus
            autocomplete="new-password"
            required
            borderColor={error !== false ? "danger" : undefined}
          />
        </StyledInputRow>
        <StyledInputRow>
          <Input
            icon={<StyledTbLockExclamation size={15} $isError={error !== false} />}
            width="full"
            fullHeight
            type="password"
            placeholder="repeat password"
            onChangeFn={(text: string) => setPasswordRepeat(text)}
            value={passwordRepeat}
            changeOnType
            autocomplete="new-password"
            required
            borderColor={error !== false ? "danger" : undefined}
          />
        </StyledInputRow>

        {error !== false && (
          <StyledErrorWrap>
            <StyledErrorText>{error}</StyledErrorText>
          </StyledErrorWrap>
        )}

        <StyledSubmitWrap>
          <Button
            disabled={
              error === UnsafePasswordError.message ||
              error === PasswordDoesNotMatchError.message ||
              password.length === 0 ||
              passwordRepeat.length === 0
            }
            fullWidth
            fullHeight
            label="Activate user"
            color="info"
            shape="rounded-md"
            size={ButtonSize.Large}
          />
        </StyledSubmitWrap>
      </StyledForm>
    </>
  );
};
