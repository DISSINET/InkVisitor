import api from "api";
import { Button, Input, Modal } from "components";
import React, { useState } from "react";
import { FiLogIn } from "react-icons/fi";
import { IoReloadCircle } from "react-icons/io5";
import { Navigate } from "react-router";
import { toast } from "react-toastify";
import { setUsername } from "redux/features/usernameSlice";
import { useAppDispatch } from "redux/hooks";
import { AttributeButtonGroup } from "../../../components/advanced";
import {
  StyledButtonWrap,
  StyledContentWrap,
  StyledErrorText,
  StyledFaLock,
  StyledFaUserAlt,
  StyledHeading,
  StyledInputRow,
  StyledTbMailFilled,
} from "./LoginModalStyles";
import { LoginScreen } from "./LoginScreens/LoginScreen";
import { PasswordRecoverScreen } from "./LoginScreens/PasswordRecoverScreen";

export const LoginModal: React.FC = () => {
  const dispatch = useAppDispatch();
  const [redirectToMain, setRedirectToMain] = useState(false);

  const [usernameLocal, setUsernameLocal] = useState("");
  const [password, setPassword] = useState("");
  const [credentialsError, setCredentialsError] = useState(false);

  const [emailLocal, setEmailLocal] = useState("");
  const [emailError, setEmailError] = useState(false);

  const handleLogIn = async () => {
    if (usernameLocal.length === 0) {
      toast.warn("Fill username");
      return;
    }
    if (password.length === 0) {
      toast.warn("Fill password");
      return;
    }
    try {
      const res = await api.signIn(usernameLocal, password);
      if (res?.token) {
        await dispatch(setUsername(usernameLocal));
        setRedirectToMain(true);
      }
    } catch (err) {
      if (err && (err as any).error === "UserDoesNotExits") {
        // wrong username
        setCredentialsError(true);
      } else if (err && (err as any).error === "BadCredentialsError") {
        // wrong password
        setCredentialsError(true);
      }
    }
  };

  const handlePasswordReset = async () => {
    try {
      const res = await api.passwordChangeRequest(emailLocal);
      if (res.status === 200) {
        setEmailError(false);
        toast.success("Link to password recover sent successfully");
      }
    } catch (err) {
      if (err && (err as any).error === "UserDoesNotExits") {
        setEmailError(true);
      }
    }
  };

  const [logInPage, setLogInPage] = useState(true);

  return redirectToMain ? (
    <Navigate to="/" />
  ) : (
    <Modal
      showModal
      disableBgClick
      width="thin"
      // onEnterPress={logInPage ? handleLogIn : handlePasswordReset}
    >
      <StyledContentWrap>
        <StyledHeading>{"Log In"}</StyledHeading>
        <div style={{ marginBottom: "1.5rem" }}>
          <AttributeButtonGroup
            options={[
              {
                icon: <FiLogIn />,
                longValue: "Log In",
                shortValue: "Log In",
                onClick: () => {
                  setLogInPage(true);
                },
                selected: logInPage,
              },
              {
                icon: <IoReloadCircle />,
                longValue: "Password recover",
                shortValue: "Password recover",
                onClick: () => {
                  setLogInPage(false);
                },
                selected: !logInPage,
              },
            ]}
          />
        </div>
        {logInPage ? (
          <LoginScreen
            usernameLocal={usernameLocal}
            setUsernameLocal={setUsernameLocal}
            password={password}
            setPassword={setPassword}
            credentialsError={credentialsError}
            handleLogIn={handleLogIn}
          />
        ) : (
          <PasswordRecoverScreen
            emailLocal={emailLocal}
            setEmailLocal={setEmailLocal}
            emailError={emailError}
            handlePasswordReset={handlePasswordReset}
            setEmailError={setEmailError}
          />
        )}
      </StyledContentWrap>
    </Modal>
  );
};

export const MemoizedLoginModal = React.memo(LoginModal);
