import api from "api";
import { ContactAdminFooting, Modal } from "components";
import React, { useState } from "react";
import { FiLogIn } from "react-icons/fi";
import { IoReloadCircle } from "react-icons/io5";
import { Navigate } from "react-router";
import { toast } from "react-toastify";
import { setUsername } from "redux/features/usernameSlice";
import { useAppDispatch } from "redux/hooks";
import { AttributeButtonGroup } from "../../../components/advanced";
import { StyledAttrBtnGroupWrap, StyledContentWrap } from "./LoginModalStyles";
import { LoginScreen } from "./LoginScreens/LoginScreen";
import { PasswordRecoverScreen } from "./LoginScreens/PasswordRecoverScreen";

export const LoginModal: React.FC = () => {
  const dispatch = useAppDispatch();
  const [redirectToMain, setRedirectToMain] = useState(false);

  const [usernameLocal, setUsernameLocal] = useState("");
  const [password, setPassword] = useState("");
  const [credentialsError, setCredentialsError] = useState(false);

  const [emailLocal, setEmailLocal] = useState("");
  const [emailError, setEmailError] = useState<false | string>(false);

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
      const res = await api.passwordChangeRequest(emailLocal, {
        ignoreErrorToast: true,
      });
      if (res.status === 200) {
        setEmailError(false);
        toast.success("Link to password recover sent successfully");
        setRestartScreen(true);
      }
    } catch (err) {
      if (err && (err as any).error === "UserDoesNotExits") {
        setEmailError("User with this email does not exist");
      }
    }
  };

  const [logInPage, setLogInPage] = useState(true);
  const [restartScreen, setRestartScreen] = useState(false);

  return redirectToMain ? (
    <Navigate to="/" />
  ) : (
    <Modal
      showModal
      disableBgClick
      width="auto"
      onEnterPress={logInPage ? handleLogIn : handlePasswordReset}
    >
      <StyledContentWrap>
        <StyledAttrBtnGroupWrap>
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
                longValue: "Password reset",
                shortValue: "Password reset",
                onClick: () => {
                  setLogInPage(false);
                },
                selected: !logInPage,
              },
            ]}
          />
        </StyledAttrBtnGroupWrap>
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
            restartScreen={restartScreen}
            setRestartScreen={setRestartScreen}
          />
        )}
        <ContactAdminFooting />
      </StyledContentWrap>
    </Modal>
  );
};

export const MemoizedLoginModal = React.memo(LoginModal);
