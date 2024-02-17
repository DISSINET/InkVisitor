import { Button, ContactAdminFooting, Modal, ModalContent } from "components";
import React, { useEffect, useState } from "react";
import { PasswordScreen } from "./screens/PasswordScreen";
import { UsernameScreen } from "./screens/UsernameScreen";
import api from "api";
import { toast } from "react-toastify";
import {
  ActivationHashInvalidError,
  IErrorSignature,
  UserBadActivationHash,
  getErrorByCode,
} from "@shared/types/errors";
import { StyledError } from "./ActivatePageStyles";
import { useNavigate } from "react-router";
import { TbArrowForwardUp } from "react-icons/tb";

const ActivatePage: React.FC = ({}) => {
  const navigate = useNavigate();
  const urlParams = new URLSearchParams(window.location.search);
  const [hash] = useState(urlParams.get("hash") || "");
  const [email] = useState(urlParams.get("email") || "");
  const [password, setPassword] = useState("");
  const [passwordRepeat, setPasswordRepeat] = useState("");
  const [usernameScreen, setUsernameScreen] = useState(false);
  const [hashOk, setHashOk] = useState<boolean | null>(null);
  const [error, setError] = useState<false | string>(false);

  const testHash = async () => {
    try {
      const res = await api.activationExists(hash, { ignoreErrorToast: true });
      if (res.data.result) {
        setHashOk(true);
      } else {
        setError(ActivationHashInvalidError.message);
        setHashOk(false);
      }
    } catch (e) {
      // TODO: could be also network error
      setHashOk(false);
      setError(getErrorByCode(e as IErrorSignature).message);
      // setError(ActivationHashInvalidError.message);
    }
  };

  useEffect(() => {
    testHash();
  }, []);

  return (
    <div>
      <Modal showModal disableBgClick width={350}>
        <ModalContent column centered>
          {hashOk && (
            <>
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
            </>
          )}

          {error && (
            <>
              <StyledError>{error}</StyledError>
              {!hashOk && (
                <Button
                  color="success"
                  icon={
                    <TbArrowForwardUp style={{ transform: "rotate(180deg)" }} />
                  }
                  label="back to login"
                  onClick={() => navigate("/login")}
                />
              )}
            </>
          )}

          <ContactAdminFooting />
        </ModalContent>
      </Modal>
    </div>
  );
};

export default ActivatePage;
