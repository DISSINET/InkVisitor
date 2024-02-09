import api from "api";
import { Button, Input } from "components";
import {
  StyledButtonWrap,
  StyledErrorText,
} from "pages/PasswordReset/PasswordResetPageStyles";
import React, { useState } from "react";
import { FiLogIn } from "react-icons/fi";
import { setUsername } from "redux/features/usernameSlice";
import { useAppDispatch } from "redux/hooks";
import {
  StyledFaLock,
  StyledInputRow,
  StyledTbMailFilled,
} from "./LoginScreensStyles";

const WRONG_USERNAME_ERROR = "wrong email / username";
const WRONG_PASSWORD_ERROR = "wrong password";

interface LoginScreen {
  usernameLocal: string;
  setUsernameLocal: React.Dispatch<React.SetStateAction<string>>;
  password: string;
  setPassword: React.Dispatch<React.SetStateAction<string>>;
  setRedirectToMain: React.Dispatch<React.SetStateAction<boolean>>;
}
export const LoginScreen: React.FC<LoginScreen> = ({
  usernameLocal,
  setUsernameLocal,
  password,
  setPassword,
  setRedirectToMain,
}) => {
  const dispatch = useAppDispatch();
  const [error, setError] = useState<string | false>(false);

  const handleLogIn = async () => {
    try {
      const res = await api.signIn(usernameLocal, password, {
        ignoreErrorToast: true,
      });
      if (res?.token) {
        await dispatch(setUsername(usernameLocal));
        setRedirectToMain(true);
      }
    } catch (err) {
      // if (err && (err as any).error === "UserDoesNotExits") {
      if (err && (err as any).error === "ReferenceError") {
        // wrong username
        setError(WRONG_USERNAME_ERROR);
      } else if (err && (err as any).error === "BadCredentialsError") {
        // wrong password
        setError(WRONG_PASSWORD_ERROR);
      }
    }
  };

  return (
    <>
      <StyledInputRow>
        <StyledTbMailFilled size={14} $isError={error !== false} />
        <Input
          width={200}
          placeholder="email or username"
          onChangeFn={(text: string) => setUsernameLocal(text)}
          value={usernameLocal}
          changeOnType
          autoFocus
          borderColor={error !== false ? "danger" : undefined}
        />
      </StyledInputRow>
      <StyledInputRow>
        <StyledFaLock size={14} $isError={error !== false} />
        <Input
          width={200}
          type="password"
          placeholder="password"
          onChangeFn={(text: string) => setPassword(text)}
          value={password}
          changeOnType
          borderColor={error !== false ? "danger" : undefined}
        />
      </StyledInputRow>

      {error !== false && <StyledErrorText>{error}</StyledErrorText>}

      <StyledButtonWrap>
        <Button
          disabled={usernameLocal.length === 0 || password.length === 0}
          icon={<FiLogIn />}
          label="Log In"
          color="success"
          onClick={() => handleLogIn()}
        />
      </StyledButtonWrap>
    </>
  );
};