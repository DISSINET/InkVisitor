import api from "api";
import { Button } from "components";
import {
  StyledButtonWrap,
  StyledDescription,
  StyledErrorText,
} from "pages/AuthModalSharedStyles";
import React, { useState } from "react";
import { IoEnter } from "react-icons/io5";
import { useAppDispatch } from "redux/hooks";

interface GuestScreen {
  setRedirectToMain: React.Dispatch<React.SetStateAction<boolean>>;
}
export const GuestScreen: React.FC<GuestScreen> = ({ setRedirectToMain }) => {
  const dispatch = useAppDispatch();
  const [error, setError] = useState<string | false>(false);

  const handleEnter = async () => {
    const autoUsername = process.env.GUEST_MODE_USER ?? "";
    const autoPassword = process.env.GUEST_MODE_PASS ?? "";

    try {
      const res = await api.signIn(autoUsername, autoPassword, {
        ignoreErrorToast: true,
      });
      if (res?.token) {
        setRedirectToMain(true);
      }
    } catch (err) {
      setError("Auto login failed");
    }
  };

  return (
    <>
      <StyledDescription>
        Enter the application as a guest user.
      </StyledDescription>
      <StyledButtonWrap>
        <div
          style={{
            fontSize: "5rem !important",
          }}
        >
          <Button
            icon={<IoEnter />}
            label="Enter"
            color="success"
            onClick={() => handleEnter()}
          />
        </div>
      </StyledButtonWrap>
      {error !== false && <StyledErrorText>{error}</StyledErrorText>}
    </>
  );
};
