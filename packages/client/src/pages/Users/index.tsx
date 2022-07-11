import { Page } from "components/advanced";
import React from "react";
import { UserList } from "./containers";
import { StyledContent } from "./UsersPageStyles";

interface UsersPageProps {}

const UsersPage: React.FC<UsersPageProps> = ({}) => {
  return (
    <Page>
      <StyledContent>
        <UserList />
      </StyledContent>
    </Page>
  );
};

export default UsersPage;
