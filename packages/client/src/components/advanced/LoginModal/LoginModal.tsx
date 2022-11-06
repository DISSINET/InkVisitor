import api from "api";
import { Button, Input, Modal } from "components";
import React, { useState } from "react";
import { Redirect } from "react-router";
import { toast } from "react-toastify";
import { setUsername } from "redux/features/usernameSlice";
import { useAppDispatch } from "redux/hooks";
import {
  StyledButtonWrap,
  StyledContentWrap,
  StyledFaLock,
  StyledFaUserAlt,
  StyledHeading,
  StyledInputRow,
} from "./LoginModalStyles";

export const LoginModal: React.FC = () => {
  const dispatch = useAppDispatch();
  const [usernameLocal, setUsernameLocal] = useState("");
  const [password, setPassword] = useState("");
  const [redirectToMain, setRedirectToMain] = useState(false);

  const handleLogIn = async () => {
    if (usernameLocal.length === 0) {
      toast.warn("Fill username");
      return;
    }
    if (password.length === 0) {
      toast.warn("Fill password");
      return;
    }
    const res = await api.signIn(usernameLocal, password);
    if (res.token) {
      await dispatch(setUsername(usernameLocal));
      setRedirectToMain(true);
    } else {
      toast.error("Wrong attempt!");
    }
  };

  return redirectToMain ? <Redirect to="/" /> : (
    <Modal showModal disableBgClick width="thin" onEnterPress={handleLogIn}>
      <StyledContentWrap>
        <StyledHeading>{"Log In"}</StyledHeading>
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
            label="Log In"
            color="success"
            onClick={() => handleLogIn()}
          />
        </StyledButtonWrap>
      </StyledContentWrap>
    </Modal>
  );
};

export const MemoizedLoginModal = React.memo(LoginModal);
