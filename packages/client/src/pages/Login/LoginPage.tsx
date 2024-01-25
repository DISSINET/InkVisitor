import { ContactAdminFooting, Modal } from "components";
import { AttributeButtonGroup } from "components/advanced";
import React, { useState } from "react";
import { FiLogIn } from "react-icons/fi";
import { IoReloadCircle } from "react-icons/io5";
import { Navigate } from "react-router";
import { StyledAttrBtnGroupWrap, StyledContentWrap } from "./LoginPageStyles";
import { LoginScreen } from "./Screens/LoginScreen";
import { PasswordRecoverScreen } from "./Screens/PasswordRecoverScreen";

export const LoginPage: React.FC = () => {
  const [usernameLocal, setUsernameLocal] = useState("");
  const [password, setPassword] = useState("");

  const [emailLocal, setEmailLocal] = useState("");

  const [logInPage, setLogInPage] = useState(true);
  const [restartScreen, setRestartScreen] = useState(false);
  const [redirectToMain, setRedirectToMain] = useState(false);

  return redirectToMain ? (
    <Navigate to="/" />
  ) : (
    <Modal showModal disableBgClick width="auto">
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
            setRedirectToMain={setRedirectToMain}
          />
        ) : (
          <PasswordRecoverScreen
            emailLocal={emailLocal}
            setEmailLocal={setEmailLocal}
            restartScreen={restartScreen}
            setRestartScreen={setRestartScreen}
          />
        )}
        <ContactAdminFooting />
      </StyledContentWrap>
    </Modal>
  );
};

export default LoginPage;
