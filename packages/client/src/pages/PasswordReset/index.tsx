import { Input, Modal, ModalContent } from "components";
import React, { useState } from "react";

interface PasswordResetPage {}
export const PasswordResetPage: React.FC<PasswordResetPage> = ({}) => {
  const [password, setPassword] = useState("");
  const [passwordRepeat, setPasswordRepeat] = useState("");

  const handleReset = () => {
    console.log("reset password");
  };

  return (
    <div>
      <Modal showModal disableBgClick width="thin" onEnterPress={handleReset}>
        <ModalContent column>
          <Input
            type="password"
            placeholder="new password"
            onChangeFn={(text: string) => setPassword(text)}
            value={password}
            changeOnType
            autoFocus
          />
          <Input
            type="password"
            placeholder="repeat password"
            onChangeFn={(text: string) => setPasswordRepeat(text)}
            value={passwordRepeat}
            changeOnType
            autoFocus
          />
        </ModalContent>
      </Modal>
    </div>
  );
};
