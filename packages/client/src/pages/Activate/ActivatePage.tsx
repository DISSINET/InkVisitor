import {
  PASSWORDS_DONT_MATCH_ERROR,
  UNSAFE_PASSWORD_ERROR,
} from "Theme/constants";
import {
  Button,
  ContactAdminFooting,
  Input,
  Modal,
  ModalContent,
  ModalInputWrap,
} from "components";
import {
  StyledButtonWrap,
  StyledDescription,
  StyledErrorText,
  StyledInputRow,
  StyledMail,
} from "pages/PasswordReset/PasswordResetPageStyles";
import React, { useEffect, useState } from "react";
import { FaUserPlus } from "react-icons/fa";
import { TbLockExclamation, TbLockPlus, TbMailFilled } from "react-icons/tb";
import { useNavigate } from "react-router";
import { isSafePassword } from "utils";

interface ActivationPage {}

const ActivatePage: React.FC<ActivationPage> = ({}) => {
  const navigate = useNavigate();
  const urlParams = new URLSearchParams(window.location.search);
  const [hash] = useState(urlParams.get("hash") || "");
  const [email] = useState(urlParams.get("email") || "");
  const [password, setPassword] = useState("");
  const [passwordRepeat, setPasswordRepeat] = useState("");
  const [error, setError] = useState<false | string>(false);

  useEffect(() => {
    if (password.length > 0 && !isSafePassword(password)) {
      setError(UNSAFE_PASSWORD_ERROR);
    } else {
      setError(false);
    }
  }, [password]);

  const handleActivation = async () => {
    if (password !== passwordRepeat) {
      setError(PASSWORDS_DONT_MATCH_ERROR);
    } else {
      // TODO: connect api
      // const res = await api.activate(hash, password, passwordRepeat);
      // if (res.status === 200) {
      //   toast.success("user activated");
      //   navigate("/username");
      // }
    }
  };

  return (
    <div>
      <Modal
        showModal
        disableBgClick
        width={350}
        onEnterPress={handleActivation}
      >
        <ModalContent column centered>
          <p>Enter a safe password to activate the user</p>
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
              icon={<FaUserPlus />}
              label="Activate user"
              color="success"
              onClick={handleActivation}
            />
          </StyledButtonWrap>
          <ContactAdminFooting />
        </ModalContent>
      </Modal>
    </div>
  );
};

export default ActivatePage;
