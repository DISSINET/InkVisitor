import React, { useState } from "react";
import { connect } from "react-redux";

import { Button, Input } from "components";
import { setAuthToken } from "redux/features/authTokenSlice";
import { useAppDispatch, useAppSelector } from "redux/hooks";
import { StyledLogInBox, StyledPage } from "./LogInPageStyles";
import { api } from "api";

interface LogInPage {
  size: number[];
}
const LogInPage: React.FC<LogInPage> = ({}) => {
  const dispatch = useAppDispatch();
  const token = useAppSelector((state) => state.token);

  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");

  const handleLogIn = () => {
    dispatch(setAuthToken(Math.floor(Math.random() * 100).toString()));
  };

  return (
    <StyledPage>
      <StyledLogInBox>
        <h2>InkVisitor</h2>
        <Input
          placeholder="username"
          onChangeFn={(text: string) => setUsername(text)}
          value={username}
        />
        <Input
          placeholder="password"
          onChangeFn={(text: string) => setPassword(text)}
          value={password}
        />
        <h5>{token}</h5>
        <Button onClick={() => handleLogIn()} label={"Log In"} color="danger" />
      </StyledLogInBox>
    </StyledPage>
  );
};

export default LogInPage;
