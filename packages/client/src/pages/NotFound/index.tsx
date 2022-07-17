import { Page } from "components/advanced";
import React from "react";
import {
  StyledContentWrapper,
  StyledError,
  StyledText,
} from "./NotFoundStyles";

const NotFoundPage: React.FC<any> = ({}) => {
  return (
    <Page disableRightHeader centeredContent>
      <StyledContentWrapper>
        <StyledError>404</StyledError>
        <StyledText>Page not found</StyledText>
      </StyledContentWrapper>
    </Page>
  );
};

export default NotFoundPage;
