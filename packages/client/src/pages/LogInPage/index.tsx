import React, { useState } from "react";
import { connect } from "react-redux";

import { Button, Input } from "components";
import { setAuthToken } from "redux/features/authTokenSlice";
import { useAppDispatch, useAppSelector } from "redux/hooks";
import { StyledLogInBox, StyledPage } from "./LogInPageStyles";
import { api } from "api";
import { setUsername } from "redux/features/usernameSlice";

interface LogInPage {
  size: number[];
}
const LogInPage: React.FC<LogInPage> = ({}) => {
  const dispatch = useAppDispatch();
  const token = useAppSelector((state) => state.token);
  const username = useAppSelector((state) => state.username);

  const [usernameLocal, setUsernameLocal] = useState("");
  const [password, setPassword] = useState("");

  const handleLogIn = async () => {
    // const res = await api.signIn(username, password);
    dispatch(setAuthToken(Math.floor(Math.random() * 100).toString()));
    dispatch(setUsername(Math.floor(Math.random() * 100).toString()));
  };

  return (
    <StyledPage>
      <StyledLogInBox>
        <h2>InkVisitor</h2>
        <Input
          placeholder="username"
          onChangeFn={(text: string) => setUsernameLocal(text)}
          value={usernameLocal}
        />
        <Input
          placeholder="password"
          onChangeFn={(text: string) => setPassword(text)}
          value={password}
        />
        <h5>{token}</h5>
        <h5>{username}</h5>
        <Button onClick={() => handleLogIn()} label={"Log In"} color="danger" />
      </StyledLogInBox>
    </StyledPage>
  );
};

export default LogInPage;
