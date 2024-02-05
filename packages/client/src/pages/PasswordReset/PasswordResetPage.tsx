import {
  PASSWORDS_DONT_MATCH_ERROR,
  UNSAFE_PASSWORD_ERROR,
} from "Theme/constants";
import api from "api";
import {
  Button,
  ContactAdminFooting,
  Input,
  Modal,
  ModalContent,
  ModalInputWrap,
} from "components";
import React, { useEffect, useState } from "react";
import { BsEnvelopeArrowUpFill } from "react-icons/bs";
import { RiRotateLockLine } from "react-icons/ri";
import {
  TbArrowForwardUp,
  TbLockExclamation,
  TbLockPlus,
  TbMailFilled,
} from "react-icons/tb";
import { useNavigate } from "react-router";
import { isSafePassword } from "utils";
import {
  StyledButtonWrap,
  StyledDescription,
  StyledErrorText,
  StyledInputRow,
  StyledMail,
  StyledText,
} from "./PasswordResetPageStyles";

const INVALID_LINK_ERROR =
  "Password reset unsuccessful. Please verify the validity of the recovery link and try again. If the problem persists, contact our support team for assistance.";

interface PasswordResetPage {}
export const PasswordResetPage: React.FC<PasswordResetPage> = ({}) => {
  const navigate = useNavigate();
  const urlParams = new URLSearchParams(window.location.search);
  const [hash] = useState(urlParams.get("hash") || "");
  const [email] = useState(urlParams.get("email") || "");
  const [password, setPassword] = useState("");
  const [passwordRepeat, setPasswordRepeat] = useState("");
  const [error, setError] = useState<false | string>(false);
  const [passwordSent, setPasswordSent] = useState(false);

  const handleReset = async () => {
    if (password !== passwordRepeat) {
      setError(PASSWORDS_DONT_MATCH_ERROR);
    } else {
      try {
        const res = await api.passwordSetRequest(
          hash,
          password,
          passwordRepeat
        );
        if (res.status === 200) {
          setPasswordSent(true);
        }
      } catch (err) {
        setError(INVALID_LINK_ERROR);
      }
    }
  };

  useEffect(() => {
    if (password.length > 0 && !isSafePassword(password)) {
      setError(UNSAFE_PASSWORD_ERROR);
    } else if (passwordRepeat.length > 0 && password !== passwordRepeat) {
      setError(PASSWORDS_DONT_MATCH_ERROR);
    } else {
      setError(false);
    }
  }, [password, passwordRepeat]);

  return (
    <div>
      <Modal showModal disableBgClick width={320} onEnterPress={handleReset}>
        <ModalContent column centered>
          {!passwordSent ? (
            <>
              <p>Enter a new safe password for the user</p>
              <StyledMail>
                <TbMailFilled size={14} style={{ marginRight: "0.5rem" }} />
                {email}
              </StyledMail>
              <StyledDescription>
                A safe password: at least 12 characters, a combination of
                uppercase letters, lowercase letters, numbers, and symbols.
              </StyledDescription>
              <form>
                <ModalInputWrap>
                  <StyledInputRow>
                    <TbLockPlus size={16} style={{ marginRight: "0.3rem" }} />
                    <Input
                      type="password"
                      placeholder="new password"
                      onChangeFn={(text: string) => setPassword(text)}
                      value={password}
                      changeOnType
                      autoFocus
                      autocomplete="new-password"
                      required
                      borderColor={error !== false ? "danger" : undefined}
                    />
                  </StyledInputRow>
                </ModalInputWrap>
                <ModalInputWrap>
                  <StyledInputRow>
                    <TbLockExclamation
                      size={16}
                      style={{ marginRight: "0.3rem" }}
                    />
                    <Input
                      type="password"
                      placeholder="repeat password"
                      onChangeFn={(text: string) => setPasswordRepeat(text)}
                      value={passwordRepeat}
                      changeOnType
                      autocomplete="new-password"
                      required
                      borderColor={error !== false ? "danger" : undefined}
                    />
                  </StyledInputRow>
                </ModalInputWrap>
              </form>
              {error !== false && <StyledErrorText>{error}</StyledErrorText>}
              <StyledButtonWrap>
                <Button
                  disabled={
                    error === UNSAFE_PASSWORD_ERROR ||
                    error === PASSWORDS_DONT_MATCH_ERROR ||
                    password.length === 0 ||
                    passwordRepeat.length === 0
                  }
                  icon={<BsEnvelopeArrowUpFill />}
                  label="Reset Password"
                  color="success"
                  onClick={handleReset}
                />
              </StyledButtonWrap>
            </>
          ) : (
            <>
              <StyledText>{`The password for the user`}</StyledText>
              <StyledMail>
                <TbMailFilled size={14} style={{ marginRight: "0.5rem" }} />
                {`${email}`}
              </StyledMail>
              <StyledText>{"was changed."}</StyledText>
              <RiRotateLockLine size={30} style={{ margin: "1.5rem" }} />
              <Button
                icon={
                  <TbArrowForwardUp style={{ transform: "rotate(180deg)" }} />
                }
                label="Back to login"
                color="success"
                onClick={() => navigate("/login")}
              />
            </>
          )}

          <ContactAdminFooting />
        </ModalContent>
      </Modal>
    </div>
  );
};
