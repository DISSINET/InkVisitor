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
import { toast } from "react-toastify";

export const UserAdministrationModal: React.FC = () => {
  const dispatch = useAppDispatch();
  const token = localStorage.getItem("token");
  const username = localStorage.getItem("username");

  const [usernameLocal, setUsernameLocal] = useState("");
  const [password, setPassword] = useState("");
  const [showLogIn, setShowLogIn] = useState(true);

  useEffect(() => {
    if (token && username) {
      setShowLogIn(false);
    } else {
      setShowLogIn(true);
    }
  }, [username, token]);

  const handleLogIn = async () => {
    if (usernameLocal.length === 0) {
      toast.error("Fill username");
      return;
    }
    if (password.length === 0) {
      toast.error("Fill password");
      return;
    }
    const res = await api.signIn(usernameLocal, password);
    if (res.token) {
      setShowLogIn(false);
    }
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
            password
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
