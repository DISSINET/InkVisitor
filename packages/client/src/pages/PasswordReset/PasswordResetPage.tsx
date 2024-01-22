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
import { FaKey } from "react-icons/fa";
import { useNavigate } from "react-router";
import { toast } from "react-toastify";
import {
  StyledButtonWrap,
  StyledDescription,
  StyledErrorText,
  StyledInputRow,
  StyledMail,
} from "./PasswordResetPageStyles";
import { TbLockExclamation, TbLockPlus, TbMailFilled } from "react-icons/tb";
import { isSafePassword } from "utils";
import {
  UNSAFE_PASSWORD_ERROR,
  PASSWORDS_DONT_MATCH_ERROR,
} from "Theme/constants";

interface PasswordResetPage {}
export const PasswordResetPage: React.FC<PasswordResetPage> = ({}) => {
  const navigate = useNavigate();
  const urlParams = new URLSearchParams(window.location.search);
  const [hash] = useState(urlParams.get("hash") || "");
  const [email] = useState(urlParams.get("email") || "");
  const [password, setPassword] = useState("");
  const [passwordRepeat, setPasswordRepeat] = useState("");
  const [error, setError] = useState<false | string>(false);

  const handleReset = async () => {
    if (password !== passwordRepeat) {
      setError(PASSWORDS_DONT_MATCH_ERROR);
    } else {
      const res = await api.passwordSetRequest(hash, password, passwordRepeat);
      if (res.status === 200) {
        toast.success("password changed");
        navigate("/login");
      }
    }
  };

  useEffect(() => {
    if (password.length > 0 && !isSafePassword(password)) {
      setError(UNSAFE_PASSWORD_ERROR);
    } else {
      setError(false);
    }
  }, [password]);

  return (
    <div>
      <Modal showModal disableBgClick width={300} onEnterPress={handleReset}>
        <ModalContent column centered>
          <p>Enter a new safe password for the user</p>
          <StyledMail>
            <TbMailFilled size={14} style={{ marginRight: "0.5rem" }} />
            {email}
          </StyledMail>
          <StyledDescription>
            A safe password: at least 12 characters, a combination of uppercase
            letters, lowercase letters, numbers, and symbols.
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
                />
              </StyledInputRow>
            </ModalInputWrap>
          </form>
          {error !== false && <StyledErrorText>{error}</StyledErrorText>}
          <StyledButtonWrap>
            <Button
              disabled={
                error === UNSAFE_PASSWORD_ERROR ||
                password.length === 0 ||
                passwordRepeat.length === 0
              }
              icon={<FaKey />}
              label="Reset Password"
              color="success"
              onClick={handleReset}
            />
          </StyledButtonWrap>
          <ContactAdminFooting />
        </ModalContent>
      </Modal>
    </div>
  );
};
