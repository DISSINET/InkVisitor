import api from "api";
import { Button, Input, Modal, ModalContent, ModalInputWrap } from "components";
import React, { useState } from "react";
import { FaKey } from "react-icons/fa";
import { useNavigate } from "react-router";
import { toast } from "react-toastify";
import { StyledButtonWrap, StyledInputRow } from "./PasswordResetPageStyles";
import { TbLockExclamation, TbLockPlus } from "react-icons/tb";

interface PasswordResetPage {}
export const PasswordResetPage: React.FC<PasswordResetPage> = ({}) => {
  const navigate = useNavigate();
  const urlParams = new URLSearchParams(window.location.search);
  const [hash] = useState(urlParams.get("hash") || "");
  const [password, setPassword] = useState("");
  const [passwordRepeat, setPasswordRepeat] = useState("");

  const handleReset = async () => {
    const res = await api.passwordSetRequest(hash, password, passwordRepeat);
    if (res.status === 200) {
      toast.success("password changed");
      navigate("/login");
    }
  };

  return (
    <div>
      <Modal showModal disableBgClick width="thin" onEnterPress={handleReset}>
        <ModalContent column>
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
          <StyledButtonWrap>
            <Button
              icon={<FaKey />}
              label="Reset Password"
              color="success"
              onClick={() => {
                if (password.length > 0 || passwordRepeat.length > 0) {
                  handleReset();
                } else {
                  toast.info("Fill both fields");
                }
              }}
            />
          </StyledButtonWrap>
        </ModalContent>
      </Modal>
    </div>
  );
};
