import React, { useState } from "react";
import { formatIssue, ImportIssue } from "utils/entityImport";
import { EntityDetailExpandIcon } from "../EntityDetailBox/EntityDetail/EntityDetailExpandIcon/EntityDetailExpandIcon";
import {
  StyledIssue,
  StyledIssueLink,
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
  // given, an issue about one draft opens that draft
  onSelectEntity?: (entityId: string) => void;
}

export const EntityImportIssueList: React.FC<EntityImportIssueList> = ({
  title,
  issues,
  isError = false,
  collapsible = false,
  onSelectEntity,
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
              {issue.entityId && onSelectEntity ? (
                <StyledIssueLink
                  type="button"
                  onClick={() => onSelectEntity(issue.entityId!)}
                >
                  {formatIssue(issue)}
                </StyledIssueLink>
              ) : (
                formatIssue(issue)
              )}
            </StyledIssue>
          ))}
        </StyledIssueList>
      )}
    </StyledIssueSection>
  );
};
