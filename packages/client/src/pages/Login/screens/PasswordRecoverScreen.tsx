import api from "api";
import { Button, Input } from "components";
import {
  StyledButtonWrap,
  StyledErrorText,
  StyledInputRow,
} from "pages/PasswordReset/PasswordResetPageStyles";
import React, { useEffect, useState } from "react";
import { BsEnvelopeArrowUpFill } from "react-icons/bs";
import { IoReloadCircle } from "react-icons/io5";
import { TbArrowForwardUp } from "react-icons/tb";
import {
  StyledDescription,
  StyledEmailSent,
  StyledTbMailFilled,
} from "./LoginScreensStyles";
import {
  IErrorSignature,
  InvalidEmailError,
  getErrorByCode,
} from "@shared/types/errors";

interface PasswordRecoverScreen {
  emailLocal: string;
  setEmailLocal: React.Dispatch<React.SetStateAction<string>>;
  restartScreen: boolean;
  setRestartScreen: React.Dispatch<React.SetStateAction<boolean>>;
}
export const PasswordRecoverScreen: React.FC<PasswordRecoverScreen> = ({
  emailLocal,
  setEmailLocal,
  restartScreen,
  setRestartScreen,
}) => {
  const [error, setError] = useState<string | false>(false);

  const validateEmail = (email: string): boolean => {
    const emailRegex: RegExp = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email);
  };

  const handlePasswordReset = async () => {
    try {
      const res = await api.passwordChangeRequest(emailLocal, {
        ignoreErrorToast: true,
      });
      if (res.status === 200) {
        setError(false);
        setRestartScreen(true);
      }
    } catch (err) {
      setError(getErrorByCode(err as IErrorSignature).message);
    }
  };

  useEffect(() => {
    if (error !== false) {
      setError(false);
    }
  }, [emailLocal]);

  return (
    <>
      {!restartScreen ? (
        <>
          <StyledDescription>
            Please enter your email.
            <br /> A link to reset your password will be sent
            <br /> to you within couple of minutes.
          </StyledDescription>
          <StyledInputRow>
            <StyledTbMailFilled size={15} $isError={error !== false} />
            <Input
              width={200}
              placeholder="email"
              onChangeFn={(text: string) => setEmailLocal(text)}
              value={emailLocal}
              changeOnType
              autoFocus
              borderColor={error !== false ? "danger" : undefined}
            />
          </StyledInputRow>
          {error !== false && <StyledErrorText>{error}</StyledErrorText>}
          <StyledButtonWrap>
            <div>
              <Button
                fullWidth
                icon={<IoReloadCircle />}
                label="Recover password"
                color="success"
                onClick={() => {
                  if (validateEmail(emailLocal)) {
                    handlePasswordReset();
                  } else {
                    setError(InvalidEmailError.message);
                  }
                }}
                disabled={emailLocal.length === 0}
              />
            </div>
          </StyledButtonWrap>
        </>
      ) : (
        <>
          <StyledEmailSent>{`A reset link was sent to email`}</StyledEmailSent>
          <StyledEmailSent>{`${emailLocal}`}</StyledEmailSent>

          <BsEnvelopeArrowUpFill
            size={24}
            style={{ margin: "0.5rem 0 1.5rem 0" }}
          />
          <Button
            label="return"
            icon={<TbArrowForwardUp style={{ transform: "rotate(180deg)" }} />}
            onClick={() => {
              setRestartScreen(false);
              setEmailLocal("");
            }}
          />
        </>
      )}
    </>
  );
};
