import React from "react";
import {
  StyledContentWrapper,
  StyledError,
  StyledText,
} from "./NotFoundStyles";

const NotFoundPage: React.FC<any> = ({}) => {
  return (
    <StyledContentWrapper>
      <StyledError>404</StyledError>
      <StyledText>Page not found</StyledText>
    </StyledContentWrapper>
  );
};

export default NotFoundPage;
