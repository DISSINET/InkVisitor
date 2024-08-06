import React from "react";
import { StyledBoxWrap, StyledContent } from "./UsersPageStyles";
import { UserList } from "./containers";

const UsersPage: React.FC = ({}) => {
  return (
    <StyledContent>
      <StyledBoxWrap>
        <UserList />
      </StyledBoxWrap>
    </StyledContent>
  );
};

export default UsersPage;
