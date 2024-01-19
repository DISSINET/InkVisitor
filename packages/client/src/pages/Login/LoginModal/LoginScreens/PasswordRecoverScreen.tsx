import { config, useSpring } from "@react-spring/web";
import { Button, Input } from "components";
import React, { useState } from "react";
import { IoReloadCircle } from "react-icons/io5";
import {
  StyledInputRow,
  StyledButtonWrap,
  StyledErrorText,
  StyledTbMailFilled,
} from "../LoginModalStyles";
import {
  StyledAnimatedIconWrap,
  StyledDescription,
  StyledEmailSent,
  StyledIoReloadCircle,
} from "./ScreensStyles";

interface PasswordRecoverScreen {
  emailLocal: string;
  setEmailLocal: React.Dispatch<React.SetStateAction<string>>;
  emailError: string | false;
  setEmailError: React.Dispatch<React.SetStateAction<string | false>>;
  handlePasswordReset: () => Promise<void>;
  restartScreen: boolean;
  setRestartScreen: React.Dispatch<React.SetStateAction<boolean>>;
}
export const PasswordRecoverScreen: React.FC<PasswordRecoverScreen> = ({
  emailLocal,
  setEmailLocal,
  emailError,
  setEmailError,
  handlePasswordReset,
  restartScreen,
  setRestartScreen,
}) => {
  const validateEmail = (email: string): boolean => {
    const emailRegex: RegExp = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email);
  };

  const [iconHovered, setIconHovered] = useState(false);

  const rotateIcon = useSpring({
    transform: iconHovered ? "rotate(0deg)" : "rotate(-360deg)",
    config: config.stiff,
  });

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
            <StyledTbMailFilled size={15} $isError={emailError !== false} />
            <Input
              placeholder="email"
              onChangeFn={(text: string) => setEmailLocal(text)}
              value={emailLocal}
              changeOnType
              autoFocus
              borderColor={emailError ? "danger" : undefined}
            />
          </StyledInputRow>
          {emailError !== false && (
            <StyledErrorText>{emailError}</StyledErrorText>
          )}
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
                    setEmailError("Invalid email entered");
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
