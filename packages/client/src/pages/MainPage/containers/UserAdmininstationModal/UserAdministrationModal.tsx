import React, { useEffect, useState } from "react";
import api from "api";
import {
  Button,
  ButtonGroup,
  Input,
  Modal,
  ModalCard,
  ModalContent,
  ModalFooter,
  ModalHeader,
} from "components";
import { StyledLogInBox } from "./UserAdministrationModalStyles";
import { useAppDispatch } from "redux/hooks";

export const UserAdministrationModal: React.FC = () => {
  const dispatch = useAppDispatch();
  const token = localStorage.getItem("token");

  const [usernameLocal, setUsernameLocal] = useState("");
  const [password, setPassword] = useState("");
  const [showLogIn, setShowLogIn] = useState(true);

  useEffect(() => {
    const username = localStorage.getItem("username");
    if (username) {
      setUsernameLocal(username);
    }
  }, []);

  const handleLogIn = async () => {
    const res = await api.signIn(usernameLocal, password);

    //   dispatch(setAuthToken(Math.floor(Math.random() * 100).toString()));
    //   dispatch(setUsername(Math.floor(Math.random() * 100).toString()));
  };

  return (
    <Modal showModal={showLogIn} disableBgClick inverted width="thin">
      <ModalHeader title={"User log in"} />
      <ModalContent>
        <StyledLogInBox>
          {/* <h2>InkVisitor</h2> */}
          <Input
            placeholder="username"
            inverted
            onChangeFn={(text: string) => setUsernameLocal(text)}
            value={usernameLocal}
          />
          <Input
            placeholder="password"
            inverted
            onChangeFn={(text: string) => setPassword(text)}
            value={password}
          />
          {/* <h5>{token}</h5>
          <h5>{usernameLocal}</h5> */}
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
