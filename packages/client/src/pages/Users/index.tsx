import { Box } from "components";
import { Page } from "components/advanced";
import React from "react";
import { UserList } from "./containers";

interface UsersPageProps {}

const UsersPage: React.FC<UsersPageProps> = ({}) => {
  return (
    <Page>
      <Box>
        <UserList />
      </Box>
    </Page>
  );
};

export default UsersPage;
