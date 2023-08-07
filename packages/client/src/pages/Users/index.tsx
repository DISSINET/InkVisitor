import React from "react";
import { UserList } from "./containers";
import { StyledBoxWrap, StyledContent, StyledWrapper } from "./UsersPageStyles";

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
