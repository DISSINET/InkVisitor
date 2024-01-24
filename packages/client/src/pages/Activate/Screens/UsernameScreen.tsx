import api from "api";
import { Button, Input, ModalInputWrap } from "components";
import {
  StyledButtonWrap,
  StyledDescription,
  StyledErrorText,
  StyledInputRow,
  StyledMail,
} from "pages/PasswordReset/PasswordResetPageStyles";
import React, { useState } from "react";
import { FaTag, FaUserTag } from "react-icons/fa";
import { TbMailFilled } from "react-icons/tb";
import { useNavigate } from "react-router";
import { StyledUserActivatedDescription } from "./ActivateSreensStyles";

const USERNAME_ALREADY_USED_ERROR = `Username is already used. 
Please select a new one`;
const USERNAME_TOO_SHORT_ERROR = `Username is too short.
Please select a new one`;
const USERNAME_TOO_LONG_ERROR = `Username is too long.
Please select a new one`;

interface UsernameScreen {
  hash: string;
  email: string;
  password: string;
  passwordRepeat: string;
}
export const UsernameScreen: React.FC<UsernameScreen> = ({
  hash,
  email,
  password,
  passwordRepeat,
}) => {
  const navigate = useNavigate();

  const [error, setError] = useState<false | string>(false);
  const [continueScreen, setContinueScreen] = useState(false);
  const [username, setUsername] = useState("");

  const handleActivation = () => {
    if (username.length < 2) {
      setError(USERNAME_TOO_SHORT_ERROR);
    } else if (username.length > 10) {
      setError(USERNAME_TOO_LONG_ERROR);
    } else {
      try {
        const res: any = api.activation(
          hash,
          password,
          passwordRepeat,
          username
        );
        if (res.status === 200) {
          setContinueScreen(true);
        }
      } catch (err) {
        if (err && (err as any).error === "UserNotUnique") {
          setError(USERNAME_ALREADY_USED_ERROR);
        }
      }
    }
  };

  return (
    <>
      {!continueScreen ? (
        <>
          <p>Choose username for user</p>
          <StyledMail>
            <TbMailFilled size={14} style={{ marginRight: "0.5rem" }} />
            {email}
          </StyledMail>
          <StyledDescription>
            The username has to be unique and <br />
            between 2 and 10 characters long.
          </StyledDescription>
          <ModalInputWrap>
            <StyledInputRow>
              <FaTag size={14} style={{ marginRight: "0.7rem" }} />
              <Input
                placeholder="username"
                onChangeFn={(text: string) => setUsername(text)}
                value={username}
                changeOnType
                autoFocus
                required
              />
            </StyledInputRow>
          </ModalInputWrap>
          {error !== false && <StyledErrorText>{error}</StyledErrorText>}
          <StyledButtonWrap>
            <Button
              disabled={username.length < 2}
              icon={<FaUserTag />}
              label="Set username"
              color="success"
              onClick={handleActivation}
            />
          </StyledButtonWrap>
        </>
      ) : (
        <>
          <p>User</p>
          <StyledMail>
            <FaUserTag size={14} style={{ marginRight: "0.5rem" }} />
            {username}
          </StyledMail>
          <StyledUserActivatedDescription>
            has been activated.
            <br />
            We wish you happy coding.
          </StyledUserActivatedDescription>
          <StyledButtonWrap>
            <Button
              label="continue"
              color="success"
              onClick={() => navigate("/login")}
            />
          </StyledButtonWrap>
        </>
      )}
    </>
  );
};
