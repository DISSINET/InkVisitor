import {
  IErrorSignature,
  UsernameTooLongError,
  UsernameTooShortError,
  getErrorByCode,
} from "@inkvisitor/shared/types/errors";
import api from "api";
import { Button, Input } from "components";
import useKeypress from "hooks/useKeyPress";
import {
  StyledCenterColumn,
  StyledDescription,
  StyledErrorText,
  StyledErrorWrap,
  StyledForm,
  StyledInputRow,
  StyledMail,
  StyledMailIcon,
  StyledSubmitWrap,
  StyledText,
} from "pages/AuthModalSharedStyles";
import React, { useState } from "react";
import { FiLogIn } from "react-icons/fi";
import { useNavigate } from "react-router-dom";
import { StyledFaUser, StyledUserActivatedDescription } from "./ActivateSreensStyles";
import { UserTag } from "components/advanced";
import { ButtonSize } from "types";

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

  const handleActivation = async () => {
    if (username.length < 4) {
      setError(UsernameTooShortError.message);
    } else if (username.length > 20) {
      setError(UsernameTooLongError.message);
    } else {
      try {
        const res = await api.activation(hash, password, passwordRepeat, username, {
          ignoreErrorToast: true,
        });
        if (res.status === 200) {
          setContinueScreen(true);
        }
      } catch (err) {
        setError(getErrorByCode(err as IErrorSignature).message);
      }
    }
  };

  const handleLogin = async () => {
    try {
      const res = await api.signIn(username, password);
      if (res?.id) {
        navigate("/");
      }
    } catch (err) {
      setError(getErrorByCode(err as IErrorSignature).message);
    }
  };

  // The activation form handles Enter natively; the continue screen has no
  // form, so Enter is wired up separately there.
  useKeypress(
    "Enter",
    () => {
      if (continueScreen) {
        handleLogin();
      }
    },
    [continueScreen],
  );

  return (
    <>
      {!continueScreen ? (
        <>
          <StyledText>Choose username for user</StyledText>
          <StyledMail>
            <StyledMailIcon size={14} />
            {email}
          </StyledMail>
          <StyledDescription>
            The username has to be unique and <br />
            between 4 and 20 characters long.
          </StyledDescription>
          <StyledForm
            onSubmit={(e) => {
              e.preventDefault();
              handleActivation();
            }}
          >
            <StyledInputRow>
              <Input
                icon={<StyledFaUser size={13} $isError={error !== false} />}
                width="full"
                fullHeight
                placeholder="username"
                onChangeFn={(text: string) => setUsername(text)}
                value={username}
                changeOnType
                autoFocus
                required
                borderColor={error !== false ? "danger" : undefined}
              />
            </StyledInputRow>

            {error !== false && (
              <StyledErrorWrap>
                <StyledErrorText>{error}</StyledErrorText>
              </StyledErrorWrap>
            )}

            <StyledSubmitWrap>
              <Button
                disabled={username.length < 2}
                fullWidth
                fullHeight
                label="Set username"
                color="info"
                shape="rounded-md"
                size={ButtonSize.Large}
              />
            </StyledSubmitWrap>
          </StyledForm>
        </>
      ) : (
        <StyledCenterColumn>
          <StyledText>User</StyledText>
          <StyledMail>
            {/* To use UserTag we need to have the userId in the database */}
            <UserTag userId={username} />
          </StyledMail>
          <StyledUserActivatedDescription>has been activated.</StyledUserActivatedDescription>
          <StyledUserActivatedDescription>We wish you happy coding.</StyledUserActivatedDescription>
          <Button
            icon={<FiLogIn />}
            label="login continue"
            color="info"
            onClick={handleLogin}
          />
        </StyledCenterColumn>
      )}
    </>
  );
};
