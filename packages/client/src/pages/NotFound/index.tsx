import React from "react";
import { StyledBoxWrapper, StyledContent, StyledError, StyledText } from "./NotFoundStyles";

const NotFoundPage: React.FC<any> = ({}) => {
  return (
    <StyledContent>
      <StyledBoxWrapper>
        <StyledError>404</StyledError>
        <StyledText>Page not found</StyledText>
      </StyledBoxWrapper>
    </StyledContent>
  );
};

export default NotFoundPage;
