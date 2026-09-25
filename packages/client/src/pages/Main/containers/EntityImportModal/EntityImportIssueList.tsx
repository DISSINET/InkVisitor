import React from "react";
import { formatIssue, ImportIssue } from "utils/entityImport";
import {
  StyledIssue,
  StyledIssueList,
  StyledIssueSection,
  StyledIssueTitle,
} from "./EntityImportModalStyles";

interface EntityImportIssueList {
  title: string;
  issues: ImportIssue[];
  isError?: boolean;
}

export const EntityImportIssueList: React.FC<EntityImportIssueList> = ({
  title,
  issues,
  isError = false,
}) => {
  if (!issues.length) {
    return null;
  }

  return (
    <StyledIssueSection>
      <StyledIssueTitle $error={isError}>{title}</StyledIssueTitle>
      <StyledIssueList>
        {issues.map((issue, issueIndex) => (
          <StyledIssue key={issueIndex} $error={isError}>
            {formatIssue(issue)}
          </StyledIssue>
        ))}
      </StyledIssueList>
    </StyledIssueSection>
  );
};
