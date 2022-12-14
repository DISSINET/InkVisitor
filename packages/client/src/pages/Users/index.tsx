import React from "react";
import { UserList } from "./containers";
import { StyledBoxWrap, StyledContent } from "./UsersPageStyles";

interface UsersPageProps {}

const UsersPage: React.FC<UsersPageProps> = ({}) => {
  return (
    <StyledContent>
      <StyledBoxWrap>
        <UserList />
      </StyledBoxWrap>
    </StyledContent>
  );
};

export default UsersPage;
