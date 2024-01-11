import React from "react";
import { StyledText } from "./LoginPageStyles";
import { MemoizedLoginModal } from "./LoginModal/LoginModal";

interface ILoginPage {}

const LoginPage: React.FC<ILoginPage> = ({}) => {
  return (
    <StyledText>
      <MemoizedLoginModal />
    </StyledText>
  );
};

export default LoginPage;
