import { ContactAdminFooting, Modal, ModalContent } from "components";
import React, { useState } from "react";
import { PasswordScreen } from "./Screens/PasswordScreen";
import { UsernameScreen } from "./Screens/UsernameScreen";

const ActivatePage: React.FC = ({}) => {
  const urlParams = new URLSearchParams(window.location.search);
  const [hash] = useState(urlParams.get("hash") || "");
  const [email] = useState(urlParams.get("email") || "");
  const [password, setPassword] = useState("");
  const [passwordRepeat, setPasswordRepeat] = useState("");
  const [usernameScreen, setUsernameScreen] = useState(false);

  return (
    <div>
      <Modal
        showModal
        disableBgClick
        width={350}
        // onEnterPress={handleContinue}
      >
        <ModalContent column centered>
          {!usernameScreen ? (
            <PasswordScreen
              email={email}
              password={password}
              setPassword={setPassword}
              passwordRepeat={passwordRepeat}
              setPasswordRepeat={setPasswordRepeat}
              setUsernameScreen={setUsernameScreen}
            />
          ) : (
            <UsernameScreen
              hash={hash}
              email={email}
              password={password}
              passwordRepeat={passwordRepeat}
            />
          )}
          <ContactAdminFooting />
        </ModalContent>
      </Modal>
    </div>
  );
};

export default ActivatePage;
