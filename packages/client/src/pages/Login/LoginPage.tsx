import { MemoizedLoginModal } from "components/advanced";
import React from "react";
import { StyledText } from "./LoginPageStyles";

interface ILoginPage {}

const LoginPage: React.FC<ILoginPage> = ({}) => {
  return (
    <StyledText>
      <MemoizedLoginModal />
    </StyledText>
  );
};

export default LoginPage;
