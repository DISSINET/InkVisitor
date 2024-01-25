import { config, useSpring } from "@react-spring/web";
import { Button, Input } from "components";
import React, { useState } from "react";
import { IoReloadCircle } from "react-icons/io5";
import {
  StyledAnimatedIconWrap,
  StyledDescription,
  StyledEmailSent,
  StyledIoReloadCircle,
  StyledTbMailFilled,
} from "./LoginScreensStyles";
import {
  StyledButtonWrap,
  StyledErrorText,
  StyledInputRow,
} from "pages/PasswordReset/PasswordResetPageStyles";
import api from "api";
import { toast } from "react-toastify";

const USER_DONT_EXIST_ERROR = "User with this email does not exist";
const INVALID_EMAIL_ERROR = "Invalid email entered";

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

  const [iconHovered, setIconHovered] = useState(false);

  const rotateIcon = useSpring({
    transform: iconHovered ? "rotate(0deg)" : "rotate(-360deg)",
    config: config.stiff,
  });

  const handlePasswordReset = async () => {
    try {
      const res = await api.passwordChangeRequest(emailLocal, {
        ignoreErrorToast: true,
      });
      if (res.status === 200) {
        setError(false);
        toast.success("Link to password recover sent successfully");
        setRestartScreen(true);
      }
    } catch (err) {
      if (err && (err as any).error === "UserDoesNotExits") {
        setError(USER_DONT_EXIST_ERROR);
      }
    }
  };

  return (
    <>
      {!restartScreen ? (
        <>
          <StyledDescription>
            Please enter your email.
            <br /> A link to reset your password will be sent to you
            <br /> within couple of minutes.
          </StyledDescription>
          <StyledInputRow>
            <StyledTbMailFilled size={15} $isError={error !== false} />
            <Input
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
                    setError(INVALID_EMAIL_ERROR);
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
          <StyledAnimatedIconWrap style={rotateIcon}>
            <StyledIoReloadCircle
              onMouseOver={() => setIconHovered(true)}
              onMouseOut={() => setIconHovered(false)}
              size={30}
              onClick={() => {
                setRestartScreen(false);
                setEmailLocal("");
              }}
            />
          </StyledAnimatedIconWrap>
        </>
      )}
    </>
  );
};
