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

export const LoginModal: React.FC = () => {
  const dispatch = useAppDispatch();
  const [usernameLocal, setUsernameLocal] = useState("");
  const [password, setPassword] = useState("");
  const [redirectToMain, setRedirectToMain] = useState(false);
  const [emailLocal, setEmailLocal] = useState("");

  const [credentialsError, setCredentialsError] = useState(false);
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

  const [logInPage, setLogInPage] = useState(true);

  const validateEmail = (email: string) => {
    const regex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return regex.test(email);
  };

  const handlePasswordReset = async () => {
    try {
      const res = await api.passwordChangeRequest(emailLocal);
      if (res.status === 200) {
        setEmailLocal("");
        setEmailError(false);
        toast.success("Link to password recover sent successfully");
      }
    } catch (err) {
      if (err && (err as any).error === "UserDoesNotExits") {
        setEmailError(true);
      }
    }
  };

  return redirectToMain ? (
    <Navigate to="/" />
  ) : (
    <Modal showModal disableBgClick width="thin" onEnterPress={handleLogIn}>
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
        ) : (
          <>
            <StyledInputRow>
              <StyledTbMailFilled size={14} isError={emailError} />
              <Input
                placeholder="email"
                onChangeFn={(text: string) => setEmailLocal(text)}
                value={emailLocal}
                changeOnType
                autoFocus
                borderColor={emailError ? "danger" : undefined}
              />
            </StyledInputRow>
            {emailError && (
              <StyledErrorText>Invalid email entered.</StyledErrorText>
            )}
            <StyledButtonWrap>
              <div>
                <Button
                  fullWidth
                  icon={<IoReloadCircle />}
                  label="Recover password"
                  color="success"
                  onClick={() => {
                    if (validateEmail(emailLocal)) {
                      handlePasswordReset();
                    } else {
                      setEmailError(true);
                    }
                  }}
                  disabled={emailLocal.length === 0}
                />
              </div>
            </StyledButtonWrap>
          </>
        )}
      </StyledContentWrap>
    </Modal>
  );
};

export const MemoizedLoginModal = React.memo(LoginModal);
