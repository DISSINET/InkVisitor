import React, { useEffect, useState } from "react";
import api from "api";
import {
  Button,
  ButtonGroup,
  Input,
  Modal,
  ModalContent,
  ModalFooter,
  ModalHeader,
} from "components";
import { StyledLogInBox } from "./UserAdministrationModalStyles";
import { useAppDispatch } from "redux/hooks";
import { toast } from "react-toastify";
import { setAuthToken } from "redux/features/authTokenSlice";
import { setUsername } from "redux/features/usernameSlice";

export const UserAdministrationModal: React.FC = () => {
  const dispatch = useAppDispatch();
  const [usernameLocal, setUsernameLocal] = useState("");
  const [password, setPassword] = useState("");

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
      dispatch(setUsername(usernameLocal));
      dispatch(setAuthToken(res.token));
    } else {
      toast.error("Wrong attempt!");
    }
  };

  return (
    <Modal showModal disableBgClick inverted width="thin">
      <ModalHeader title={"User Log In"} />
      <ModalContent>
        <StyledLogInBox>
          <Input
            placeholder="username"
            inverted
            onChangeFn={(text: string) => setUsernameLocal(text)}
            value={usernameLocal}
          />
          <Input
            placeholder="password"
            password
            inverted
            onChangeFn={(text: string) => setPassword(text)}
            value={password}
          />
        </StyledLogInBox>
      </ModalContent>
      <ModalFooter>
        <ButtonGroup>
          <Button label="Log In" color="danger" onClick={() => handleLogIn()} />
        </ButtonGroup>
      </ModalFooter>
    </Modal>
  );
};
