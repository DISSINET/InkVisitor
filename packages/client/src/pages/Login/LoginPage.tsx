import { animated, config, useSpring } from "@react-spring/web";
import { ContactOwnerFooting, Modal } from "components";
import { AttributeButtonGroup } from "components/advanced";
import React, { useMemo, useState } from "react";
import { FiLogIn } from "react-icons/fi";
import { IoEnter } from "react-icons/io5";
import { Navigate } from "react-router-dom";
import { AuthLogoBand } from "pages/AuthLogoBand";
import { StyledContentWrap } from "pages/AuthModalSharedStyles";
import { StyledAttrBtnGroupWrap, StyledLoginCitation, StyledLoginText } from "./LoginPageStyles";
import { GuestScreen } from "./screens/GuestScreen";
import { LoginScreen } from "./screens/LoginScreen";
import { PasswordRecoverScreen } from "./screens/PasswordRecoverScreen";

enum LoginMode {
  "login",
  "password",
  "guest",
}

export const LoginPage: React.FC = () => {
  const isGuestAccess = process.env.GUEST_MODE === "1";

  const [usernameLocal, setUsernameLocal] = useState("");
  const [password, setPassword] = useState("");
  const [emailLocal, setEmailLocal] = useState("");

  const [loginMode, setLoginMode] = useState<LoginMode>(
    isGuestAccess ? LoginMode.guest : LoginMode.login
  );
  const [restartScreen, setRestartScreen] = useState(false);
  const [redirectToMain, setRedirectToMain] = useState(false);

  // Password reset is reached through a link on the login screen, so the
  // switcher only appears when guest access adds a second entry mode.
  const pageOptions = useMemo(
    () => [
      {
        icon: <FiLogIn />,
        longValue: "Log In",
        shortValue: "Log In",
        optionDisabled: false,
        onClick: () => {
          setLoginMode(LoginMode.login);
        },
        selected: loginMode === LoginMode.login,
      },
      {
        icon: <IoEnter />,
        longValue: "Guest access",
        shortValue: "Guest access",
        optionDisabled: false,
        onClick: () => {
          setLoginMode(LoginMode.guest);
        },
        selected: loginMode === LoginMode.guest,
      },
    ],
    [loginMode]
  );

  const loginTitle = process.env.LOGIN_TITLE;
  const loginText = process.env.LOGIN_TEXT;
  const loginCitation = process.env.LOGIN_CITATION;

  return redirectToMain ? (
    <Navigate to="/" />
  ) : (
    <Modal showModal disableBgClick width={320} noBorder>
      <AuthLogoBand />
      <StyledContentWrap>
        {loginTitle && <h4>{loginTitle}</h4>}
        {loginText && <StyledLoginText>{loginText}</StyledLoginText>}
        {loginCitation && <StyledLoginCitation>Citation: {loginCitation}</StyledLoginCitation>}
        {isGuestAccess && loginMode !== LoginMode.password && (
          <StyledAttrBtnGroupWrap>
            <AttributeButtonGroup options={pageOptions} paddingX fullWidth />
          </StyledAttrBtnGroupWrap>
        )}
        {loginMode === LoginMode.login && (
          <LoginScreen
            usernameLocal={usernameLocal}
            setUsernameLocal={setUsernameLocal}
            password={password}
            setPassword={setPassword}
            setRedirectToMain={setRedirectToMain}
            onPasswordReset={() => setLoginMode(LoginMode.password)}
          />
        )}
        {loginMode === LoginMode.guest && <GuestScreen setRedirectToMain={setRedirectToMain} />}
        {loginMode === LoginMode.password && (
          <PasswordRecoverScreen
            emailLocal={emailLocal}
            setEmailLocal={setEmailLocal}
            restartScreen={restartScreen}
            setRestartScreen={setRestartScreen}
            onReturnToLogin={() => {
              setLoginMode(LoginMode.login);
              setEmailLocal("");
              setRestartScreen(false);
            }}
          />
        )}
        {/* <ContactOwnerFooting /> */}
      </StyledContentWrap>
    </Modal>
  );
};

export default LoginPage;
