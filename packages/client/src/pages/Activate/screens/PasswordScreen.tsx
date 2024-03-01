import {
  PasswordDoesNotMatchError,
  UnsafePasswordError,
} from "@shared/types/errors";
import { Button, Input, ModalInputWrap } from "components";
import {
  StyledButtonWrap,
  StyledDescription,
  StyledErrorText,
  StyledInputRow,
  StyledMail,
} from "pages/PasswordReset/PasswordResetPageStyles";
import React, { useEffect, useState } from "react";
import { FaUserPlus } from "react-icons/fa";
import { TbMailFilled } from "react-icons/tb";
import { isSafePassword } from "utils/utils";
import {
  StyledTbLockExclamation,
  StyledTbLockPlus,
} from "./ActivateSreensStyles";

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
      <p>Enter a safe password to activate the user</p>
      <StyledMail>
        <TbMailFilled size={14} style={{ marginRight: "0.5rem" }} />
        {email}
      </StyledMail>
      <StyledDescription>
        A safe password: at least 12 characters, a combination of uppercase
        letters, lowercase letters, numbers, and symbols.
      </StyledDescription>
      <form>
        <ModalInputWrap>
          <StyledInputRow>
            <StyledTbLockPlus size={16} $isError={error !== false} />
            <Input
              type="password"
              placeholder="new password"
              onChangeFn={(text: string) => setPassword(text)}
              value={password}
              changeOnType
              autoFocus
              autocomplete="new-password"
              required
              borderColor={error !== false ? "danger" : "primary"}
            />
          </StyledInputRow>
        </ModalInputWrap>
        <ModalInputWrap>
          <StyledInputRow>
            <StyledTbLockExclamation size={16} $isError={error !== false} />
            <Input
              type="password"
              placeholder="repeat password"
              onChangeFn={(text: string) => setPasswordRepeat(text)}
              value={passwordRepeat}
              changeOnType
              autocomplete="new-password"
              required
              borderColor={error !== false ? "danger" : "primary"}
            />
          </StyledInputRow>
        </ModalInputWrap>
      </form>

      <div style={{ minHeight: "2rem" }}>
        {error !== false && <StyledErrorText>{error}</StyledErrorText>}
      </div>

      <StyledButtonWrap>
        <Button
          disabled={
            error === UnsafePasswordError.message ||
            error === PasswordDoesNotMatchError.message ||
            password.length === 0 ||
            passwordRepeat.length === 0
          }
          icon={<FaUserPlus />}
          label="Activate user"
          color="success"
          onClick={handleContinue}
        />
      </StyledButtonWrap>
    </>
  );
};
