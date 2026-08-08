import { IErrorSignature, NetworkError, getErrorByCode } from "@inkvisitor/shared/types/errors";
import api from "api";
import { Button, Input } from "components";
import {
  StyledErrorText,
  StyledErrorWrap,
  StyledForm,
  StyledInputRow,
  StyledLinkButton,
  StyledShowPasswordButton,
  StyledSubmitWrap,
} from "pages/AuthModalSharedStyles";
import React, { useState } from "react";
import { RiEyeLine, RiEyeOffLine } from "react-icons/ri";
import { setUsername } from "redux/features/usernameSlice";
import { useAppDispatch, useAppSelector } from "redux/hooks";
import { StyledFaLock, StyledTbMailFilled } from "./LoginScreensStyles";
import { ButtonSize } from "types";

interface LoginScreen {
  usernameLocal: string;
  setUsernameLocal: React.Dispatch<React.SetStateAction<string>>;
  password: string;
  setPassword: React.Dispatch<React.SetStateAction<string>>;
  onLoggedIn: () => void;
  onPasswordReset: () => void;
}
export const LoginScreen: React.FC<LoginScreen> = ({
  usernameLocal,
  setUsernameLocal,
  password,
  setPassword,
  onLoggedIn,
  onPasswordReset,
}) => {
  const dispatch = useAppDispatch();
  const [error, setError] = useState<{ title?: string; message: string } | false>(false);
  const [showPassword, setShowPassword] = useState(false);
  const [isLoggingIn, setIsLoggingIn] = useState(false);

  const ping: number = useAppSelector((state) => state.ping);

  const handleLogIn = async () => {
    if (ping === -1 || ping === -2) {
      setError({ title: NetworkError.title, message: NetworkError.message });
    } else {
      setIsLoggingIn(true);
      try {
        const res = await api.signIn(usernameLocal, password, {
          ignoreErrorToast: true,
        });
        if (res?.id) {
          await dispatch(setUsername(usernameLocal));
          onLoggedIn();
        }
      } catch (err) {
        const errorTemp = getErrorByCode(err as IErrorSignature);
        setError(
          err?.toString().startsWith("NetworkError")
            ? {
                title: NetworkError.title,
                message: NetworkError.message,
              }
            : {
                message: errorTemp.message,
              },
        );
      } finally {
        setIsLoggingIn(false);
      }
    }
  };

  return (
    <>
      {/* The Button below has no type, so it acts as the native submit button;
          Enter in either input submits through the same path. */}
      <StyledForm
        onSubmit={(e) => {
          e.preventDefault();
          handleLogIn();
        }}
      >
        <StyledInputRow>
          <Input
            icon={<StyledTbMailFilled size={15} $isError={error !== false} />}
            width="full"
            fullHeight
            autocomplete="username"
            placeholder="email or username"
            onChangeFn={(text: string) => setUsernameLocal(text)}
            value={usernameLocal}
            changeOnType
            autoFocus
            borderColor={error !== false ? "danger" : undefined}
          />
        </StyledInputRow>
        <StyledInputRow>
          <Input
            icon={<StyledFaLock size={13} $isError={error !== false} />}
            width="full"
            fullHeight
            autocomplete="current-password"
            type={showPassword ? "text" : "password"}
            placeholder="password"
            onChangeFn={(text: string) => setPassword(text)}
            value={password}
            changeOnType
            borderColor={error !== false ? "danger" : undefined}
            rightContent={
              <StyledShowPasswordButton
                type="button"
                tabIndex={-1}
                aria-label={showPassword ? "Hide password" : "Show password"}
                onClick={() => setShowPassword(!showPassword)}
              >
                {showPassword ? <RiEyeOffLine size={15} /> : <RiEyeLine size={15} />}
              </StyledShowPasswordButton>
            }
          />
        </StyledInputRow>

        {error !== false && (
          <StyledErrorWrap>
            {error.title && (
              <StyledErrorText>
                <b>{error.title}</b>
              </StyledErrorText>
            )}
            <StyledErrorText>{error.message}</StyledErrorText>
          </StyledErrorWrap>
        )}

        <StyledSubmitWrap>
          <Button
            label={isLoggingIn ? "Logging In…" : "Log In"}
            color="success"
            fullWidth
            disabled={isLoggingIn}
            size={ButtonSize.Large}
          />
        </StyledSubmitWrap>
        <StyledLinkButton type="button" onClick={onPasswordReset}>
          Forgot password?
        </StyledLinkButton>
      </StyledForm>
    </>
  );
};
