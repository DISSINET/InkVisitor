import {
  ActivationHashInvalidError,
  IErrorSignature,
  getErrorByCode,
} from "@inkvisitor/shared/types/errors";
import api from "api";
import { Button, Modal } from "components";
import { AuthLogoBand } from "pages/AuthLogoBand";
import {
  StyledButtonWrap,
  StyledContentWrap,
  StyledErrorText,
} from "pages/AuthModalSharedStyles";
import React, { useEffect, useState } from "react";
import { TbArrowForwardUp } from "react-icons/tb";
import { useNavigate } from "react-router-dom";
import { PasswordScreen } from "./screens/PasswordScreen";
import { UsernameScreen } from "./screens/UsernameScreen";

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
      setHashOk(false);
      setError(getErrorByCode(e as IErrorSignature).message);
    }
  };

  useEffect(() => {
    testHash();
  }, []);

  return (
    <div>
      <Modal showModal disableBgClick width={320} noBorder>
        <AuthLogoBand />
        <StyledContentWrap>
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
              <StyledErrorText>{error}</StyledErrorText>
              <StyledButtonWrap>
                {!hashOk && (
                  <Button
                    color="success"
                    icon={
                      <TbArrowForwardUp
                        style={{ transform: "rotate(180deg)" }}
                      />
                    }
                    label="back to login"
                    onClick={() => navigate("/login")}
                  />
                )}
              </StyledButtonWrap>
            </>
          )}

          {/* <ContactOwnerFooting /> */}
        </StyledContentWrap>
      </Modal>
    </div>
  );
};

export default ActivatePage;
