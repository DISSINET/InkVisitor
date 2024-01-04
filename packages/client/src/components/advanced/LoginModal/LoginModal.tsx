import api from "api";
import { Button, Input, Modal } from "components";
import React, { useState } from "react";
import { FiLogIn } from "react-icons/fi";
import { IoReloadCircle } from "react-icons/io5";
import { Navigate } from "react-router";
import { toast } from "react-toastify";
import { setUsername } from "redux/features/usernameSlice";
import { useAppDispatch } from "redux/hooks";
import { AttributeButtonGroup } from "..";
import {
  StyledButtonWrap,
  StyledContentWrap,
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
      console.log(err);
    }
  };

  const handlePasswordReset = () => {
    console.log("password reset");
  };

  const [logInSelected, setLogInSelected] = useState(true);

  return redirectToMain ? (
    <Navigate to="/" />
  ) : (
    <Modal showModal disableBgClick width="thin" onEnterPress={handleLogIn}>
      <StyledContentWrap>
        <StyledHeading>{"Log In"}</StyledHeading>
        <div style={{ marginBottom: "1rem" }}>
          <AttributeButtonGroup
            options={[
              {
                shortIcon: <FiLogIn />,
                longValue: "Log In",
                shortValue: "Log In",
                onClick: () => {
                  setLogInSelected(true);
                },
                selected: logInSelected,
              },
              {
                shortIcon: <IoReloadCircle />,
                longValue: "Password recover",
                shortValue: "Password recover",
                onClick: () => {
                  setLogInSelected(false);
                },
                selected: !logInSelected,
              },
            ]}
          />
        </div>
        {logInSelected ? (
          <>
            <StyledInputRow>
              <StyledFaUserAlt size={14} />
              <Input
                placeholder="username"
                onChangeFn={(text: string) => setUsernameLocal(text)}
                value={usernameLocal}
                changeOnType
                autoFocus
                noBorder
              />
            </StyledInputRow>
            <StyledInputRow>
              <StyledFaLock size={14} />
              <Input
                placeholder="password"
                password
                onChangeFn={(text: string) => setPassword(text)}
                value={password}
                changeOnType
                noBorder
              />
            </StyledInputRow>
            <StyledButtonWrap>
              <Button
                fullWidth
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
              <StyledTbMailFilled size={14} />
              <Input
                placeholder="email"
                onChangeFn={(text: string) => setEmailLocal(text)}
                value={emailLocal}
                changeOnType
                autoFocus
                noBorder
              />
            </StyledInputRow>
            <StyledButtonWrap>
              <div>
                <Button
                  fullWidth
                  icon={<IoReloadCircle />}
                  label="Recover password"
                  color="success"
                  onClick={() => handlePasswordReset()}
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
