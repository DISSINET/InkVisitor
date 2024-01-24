import React from "react";
import { MemoizedLoginModal } from "./LoginModal/LoginModal";

interface ILoginPage {}

const LoginPage: React.FC<ILoginPage> = ({}) => {
  return (
    <>
      <MemoizedLoginModal />
    </>
  );
};

export default LoginPage;
