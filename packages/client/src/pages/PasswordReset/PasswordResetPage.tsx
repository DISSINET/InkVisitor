import {
  IErrorSignature,
  PasswordDoesNotMatchError,
  PasswordResetHashError,
  UnsafePasswordError,
  getErrorByCode,
} from "@inkvisitor/shared/types/errors";
import { SAFE_PASSWORD_DESCRIPTION } from "Theme/constants";
import api from "api";
import { Button, Input, Modal } from "components";
import { AuthLogoBand } from "pages/AuthLogoBand";
import {
  StyledButtonWrap,
  StyledCenterColumn,
  StyledContentWrap,
  StyledDescription,
  StyledErrorText,
  StyledErrorWrap,
  StyledForm,
  StyledInputRow,
  StyledMail,
  StyledMailIcon,
  StyledSubmitWrap,
  StyledText,
} from "pages/AuthModalSharedStyles";
import React, { useEffect, useState } from "react";
import { RiRotateLockLine } from "react-icons/ri";
import { TbArrowForwardUp, TbLockExclamation, TbLockPlus } from "react-icons/tb";
import { useNavigate } from "react-router-dom";
import styled from "styled-components";
import { isSafePassword } from "utils/utils";
import { ButtonSize } from "types";

const StyledResetDoneIconWrap = styled.div`
  margin: 1.5rem;
`;

interface PasswordResetPage {}
export const PasswordResetPage: React.FC<PasswordResetPage> = ({}) => {
  const navigate = useNavigate();
  const urlParams = new URLSearchParams(window.location.search);
  const [hash] = useState(urlParams.get("hash") || "");
  const [email] = useState(urlParams.get("email") || "");
  const [password, setPassword] = useState("");
  const [passwordRepeat, setPasswordRepeat] = useState("");
  const [error, setError] = useState<false | string>(false);
  const [passwordSent, setPasswordSent] = useState(false);
  const [hashOk, setHashOk] = useState(false);

  const testHash = async () => {
    try {
      const res = await api.passwordResetExists(hash, {
        ignoreErrorToast: true,
      });
      if (res.data.result) {
        setHashOk(true);
      } else {
        setError(PasswordResetHashError.message);
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

  const handleReset = async () => {
    if (password !== passwordRepeat) {
      setError(PasswordDoesNotMatchError.message);
    } else {
      try {
        const res = await api.passwordSetRequest(hash, password, passwordRepeat);
        if (res.status === 200) {
          setPasswordSent(true);
        }
      } catch (err) {
        setError(getErrorByCode(err as IErrorSignature).message);
      }
    }
  };

  useEffect(() => {
    if (password.length > 0 && !isSafePassword(password)) {
      setError(UnsafePasswordError.message);
    } else if (passwordRepeat.length > 0 && password !== passwordRepeat) {
      setError(PasswordDoesNotMatchError.message);
    } else {
      setError(false);
    }
  }, [password, passwordRepeat]);

  return (
    <div>
      <Modal showModal disableBgClick width={320} noBorder>
        <AuthLogoBand />
        <StyledContentWrap>
          {!passwordSent ? (
            <>
              {hashOk ? (
                <>
                  <StyledText>Enter a new safe password for the user</StyledText>
                  <StyledMail>
                    <StyledMailIcon size={14} />
                    {email}
                  </StyledMail>
                  <StyledDescription>{SAFE_PASSWORD_DESCRIPTION}</StyledDescription>
                  <StyledForm
                    onSubmit={(e) => {
                      e.preventDefault();
                      handleReset();
                    }}
                  >
                    <StyledInputRow>
                      <Input
                        icon={<TbLockPlus size={15} />}
                        width="full"
                        fullHeight
                        type="password"
                        placeholder="new password"
                        onChangeFn={(text: string) => setPassword(text)}
                        value={password}
                        changeOnType
                        autoFocus
                        autocomplete="new-password"
                        required
                        borderColor={error !== false ? "danger" : undefined}
                      />
                    </StyledInputRow>
                    <StyledInputRow>
                      <Input
                        icon={<TbLockExclamation size={15} />}
                        width="full"
                        fullHeight
                        type="password"
                        placeholder="repeat password"
                        onChangeFn={(text: string) => setPasswordRepeat(text)}
                        value={passwordRepeat}
                        changeOnType
                        autocomplete="new-password"
                        required
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
                        disabled={
                          error === UnsafePasswordError.message ||
                          error === PasswordDoesNotMatchError.message ||
                          password.length === 0 ||
                          passwordRepeat.length === 0
                        }
                        fullWidth
                        fullHeight
                        label="Reset Password"
                        color="info"
                        shape="rounded-md"
                        size={ButtonSize.Large}
                      />
                    </StyledSubmitWrap>
                  </StyledForm>
                </>
              ) : (
                <>
                  {error !== false && <StyledErrorText>{error}</StyledErrorText>}
                  <StyledButtonWrap>
                    <Button
                      color="info"
                      icon={<TbArrowForwardUp style={{ transform: "rotate(180deg)" }} />}
                      label="back to login"
                      onClick={() => navigate("/login")}
                    />
                  </StyledButtonWrap>
                </>
              )}
            </>
          ) : (
            <StyledCenterColumn>
              <StyledText>{`The password for the user`}</StyledText>
              <StyledMail>
                <StyledMailIcon size={14} />
                {`${email}`}
              </StyledMail>
              <StyledText>{"was changed."}</StyledText>
              <StyledResetDoneIconWrap>
                <RiRotateLockLine size={30} />
              </StyledResetDoneIconWrap>
              <Button
                icon={<TbArrowForwardUp style={{ transform: "rotate(180deg)" }} />}
                label="Back to login"
                color="info"
                onClick={() => navigate("/login")}
              />
            </StyledCenterColumn>
          )}

          {/* <ContactOwnerFooting /> */}
        </StyledContentWrap>
      </Modal>
    </div>
  );
};
