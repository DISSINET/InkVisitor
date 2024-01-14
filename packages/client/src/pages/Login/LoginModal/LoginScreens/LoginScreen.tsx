import { Button, Input } from "components";
import React from "react";
import { FiLogIn } from "react-icons/fi";
import {
  StyledInputRow,
  StyledFaUserAlt,
  StyledFaLock,
  StyledErrorText,
  StyledButtonWrap,
} from "../LoginModalStyles";

interface LoginScreen {
  usernameLocal: string;
  setUsernameLocal: React.Dispatch<React.SetStateAction<string>>;
  password: string;
  setPassword: React.Dispatch<React.SetStateAction<string>>;
  handleLogIn: () => void;

  credentialsError: boolean;
}
export const LoginScreen: React.FC<LoginScreen> = ({
  usernameLocal,
  setUsernameLocal,
  password,
  setPassword,
  handleLogIn,

  credentialsError,
}) => {
  return (
    <>
      <StyledInputRow>
        <StyledFaUserAlt size={14} isError={credentialsError} />
        <Input
          placeholder="username"
          onChangeFn={(text: string) => setUsernameLocal(text)}
          value={usernameLocal}
          changeOnType
          autoFocus
          borderColor={credentialsError ? "danger" : undefined}
        />
      </StyledInputRow>
      <StyledInputRow>
        <StyledFaLock size={14} isError={credentialsError} />
        <Input
          type="password"
          placeholder="password"
          onChangeFn={(text: string) => setPassword(text)}
          value={password}
          changeOnType
          borderColor={credentialsError ? "danger" : undefined}
        />
      </StyledInputRow>
      {credentialsError && (
        <StyledErrorText>
          Wrong username or password. Please try again.
        </StyledErrorText>
      )}
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
