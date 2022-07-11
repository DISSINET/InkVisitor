import { Box } from "components";
import { Page } from "components/advanced";
import React from "react";
import { useAppSelector } from "redux/hooks";
import { UserList } from "./containers";

interface UsersPageProps {}

const UsersPage: React.FC<UsersPageProps> = ({}) => {
  // const [mainPageRedirect, setMainPageRedirect] = useState(false);

  const contentHeight: number = useAppSelector(
    (state) => state.layout.contentHeight
  );

  return (
    <>
      <Page>
        <Box height={contentHeight}>
          <UserList />
        </Box>
      </Page>
    </>
  );
};

export default UsersPage;
