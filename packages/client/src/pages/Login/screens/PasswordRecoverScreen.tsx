import api from "api";
import { Button, Input } from "components";
import React, { useEffect, useState } from "react";
import { BsEnvelopeArrowUpFill } from "react-icons/bs";
import { TbArrowForwardUp } from "react-icons/tb";
import {
  StyledDescription,
  StyledEmailSent,
  StyledEmailSentIconWrap,
  StyledTbMailFilled,
} from "./LoginScreensStyles";
import {
  IErrorSignature,
  InvalidEmailError,
  getErrorByCode,
} from "@inkvisitor/shared/types/errors";
import {
  StyledCenterColumn,
  StyledErrorText,
  StyledErrorWrap,
  StyledForm,
  StyledInputRow,
  StyledLinkButton,
  StyledSubmitWrap,
} from "pages/AuthModalSharedStyles";
import { ButtonSize } from "types";

interface PasswordRecoverScreen {
  emailLocal: string;
  setEmailLocal: React.Dispatch<React.SetStateAction<string>>;
  restartScreen: boolean;
  setRestartScreen: React.Dispatch<React.SetStateAction<boolean>>;
  onReturnToLogin: () => void;
}
export const PasswordRecoverScreen: React.FC<PasswordRecoverScreen> = ({
  emailLocal,
  setEmailLocal,
  restartScreen,
  setRestartScreen,
  onReturnToLogin,
}) => {
  const [error, setError] = useState<string | false>(false);
  const [isRecovering, setIsRecovering] = useState(false);

  const validateEmail = (email: string): boolean => {
    const emailRegex: RegExp = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email);
  };

  const handlePasswordReset = async () => {
    setIsRecovering(true);
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
    } finally {
      setIsRecovering(false);
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
          <StyledForm
            onSubmit={(e) => {
              e.preventDefault();
              if (validateEmail(emailLocal)) {
                handlePasswordReset();
              } else {
                setError(InvalidEmailError.message);
              }
            }}
          >
            <StyledInputRow>
              <Input
                icon={<StyledTbMailFilled size={15} $isError={error !== false} />}
                width="full"
                fullHeight
                placeholder="email"
                onChangeFn={(text: string) => setEmailLocal(text)}
                value={emailLocal}
                changeOnType
                autoFocus
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
                fullWidth
                fullHeight
                label={isRecovering ? "Recovering…" : "Recover password"}
                color="info"
                shape="rounded-md"
                disabled={emailLocal.length === 0 || isRecovering}
                size={ButtonSize.Large}
              />
            </StyledSubmitWrap>
            <StyledLinkButton type="button" onClick={onReturnToLogin}>
              Back to Log In
            </StyledLinkButton>
          </StyledForm>
        </>
      ) : (
        <StyledCenterColumn>
          <StyledEmailSent>{`A reset link was sent to email`}</StyledEmailSent>
          <StyledEmailSent>{`${emailLocal}`}</StyledEmailSent>

          <StyledEmailSentIconWrap>
            <BsEnvelopeArrowUpFill size={24} />
          </StyledEmailSentIconWrap>
          <Button
            label="return"
            icon={<TbArrowForwardUp style={{ transform: "rotate(180deg)" }} />}
            onClick={onReturnToLogin}
          />
        </StyledCenterColumn>
      )}
    </>
  );
};
