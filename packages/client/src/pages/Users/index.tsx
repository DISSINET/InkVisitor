import { Page } from "components/advanced";
import React from "react";
import { UserList } from "./containers";
import { StyledContent } from "./UsersPageStyles";

interface UsersPageProps {}

const UsersPage: React.FC<UsersPageProps> = ({}) => {
  return (
    <div style={{ width: "100%", display: "flex", justifyContent: "center" }}>
      <StyledContent>
        <UserList />
      </StyledContent>
    </div>
  );
};

export default UsersPage;
