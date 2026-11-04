import React, { useState } from "react";
import { formatIssue, ImportIssue } from "utils/entityImport";
import { EntityDetailExpandIcon } from "../EntityDetailBox/EntityDetail/EntityDetailExpandIcon/EntityDetailExpandIcon";
import {
  StyledIssue,
  StyledIssueList,
  StyledIssueSection,
  StyledIssueTitle,
  StyledIssueToggle,
} from "./EntityImportModalStyles";

interface EntityImportIssueList {
  title: string;
  issues: ImportIssue[];
  isError?: boolean;
  // the title, with the count, opens and closes the list
  collapsible?: boolean;
}

export const EntityImportIssueList: React.FC<EntityImportIssueList> = ({
  title,
  issues,
  isError = false,
  collapsible = false,
}) => {
  const [isExpanded, setIsExpanded] = useState(true);

  if (!issues.length) {
    return null;
  }

  return (
    <StyledIssueSection>
      {collapsible ? (
        <StyledIssueToggle type="button" onClick={() => setIsExpanded((expanded) => !expanded)}>
          <EntityDetailExpandIcon isExpanded={isExpanded} />
          <StyledIssueTitle $error={isError}>{`${title} (${issues.length})`}</StyledIssueTitle>
        </StyledIssueToggle>
      ) : (
        <StyledIssueTitle $error={isError}>{title}</StyledIssueTitle>
      )}
      {isExpanded && (
        <StyledIssueList>
          {issues.map((issue, issueIndex) => (
            <StyledIssue key={issueIndex} $error={isError}>
              {formatIssue(issue)}
            </StyledIssue>
          ))}
        </StyledIssueList>
      )}
    </StyledIssueSection>
  );
};
