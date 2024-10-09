import { IErrorSignature, getErrorByCode } from "@shared/types/errors";
import api from "api";
import { Button, Input } from "components";
import { StyledButtonWrap, StyledErrorText } from "pages/AuthModalSharedStyles";
import React, { useEffect, useState } from "react";
import { FiLogIn } from "react-icons/fi";
import { setUsername } from "redux/features/usernameSlice";
import { useAppDispatch } from "redux/hooks";
import {
  StyledFaLock,
  StyledInputRow,
  StyledTbMailFilled,
} from "./LoginScreensStyles";

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

  const formRef = React.createRef<HTMLFormElement>();

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
      setError(getErrorByCode(err as IErrorSignature).message);
    }
  };

  return (
    <>
      <form ref={formRef}>
        <StyledInputRow>
          <StyledTbMailFilled size={14} $isError={error !== false} />
          <Input
            width={200}
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
          <StyledFaLock size={14} $isError={error !== false} />
          <Input
            width={200}
            autocomplete="current-password"
            type="password"
            placeholder="password"
            onChangeFn={(text: string) => setPassword(text)}
            value={password}
            changeOnType
            borderColor={error !== false ? "danger" : undefined}
          />
        </StyledInputRow>
      </form>

      {error !== false && <StyledErrorText>{error}</StyledErrorText>}

      <StyledButtonWrap>
        <Button
          icon={<FiLogIn />}
          label="Log In"
          color="success"
          onClick={() => handleLogIn()}
        />
      </StyledButtonWrap>
    </>
  );
};
