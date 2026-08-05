import { EntityEnums } from "@inkvisitor/shared/enums";
import { IEntity } from "@inkvisitor/shared/types";
import { Button } from "components";
import { EntitySuggester, EntityTag } from "components/advanced";
import React from "react";
import { IcoTrash } from "Theme/icons";
import {
  StyledRightsCellSuggester,
  StyledTerritoryColumn,
  StyledTerritoryList,
  StyledTerritoryListItem,
  StyledTerritoryListItemMissing,
} from "../UserListStyles";

interface UserListRightsCell {
  entityClass: EntityEnums.Class;
  /** ids taken from the user's rights for this mode */
  assignedIds: string[];
  /**
   * entities resolved for the assigned ids, absent until the response carries
   * them; an id missing from a present array is stale
   */
  entities: IEntity[] | undefined;
  placeholder: string;
  /** shown on a stale id, e.g. "invalid T" */
  invalidLabel: string;
  removeTooltip: string;
  onAdd: (entityId: string) => void;
  onRemove: (entityId: string) => void;
  preSuggestions?: IEntity[];
}

export const UserListRightsCell: React.FC<UserListRightsCell> = ({
  entityClass,
  assignedIds,
  entities,
  placeholder,
  invalidLabel,
  removeTooltip,
  onAdd,
  onRemove,
  preSuggestions,
}) => {
  return (
    <StyledTerritoryColumn>
      {entities !== undefined && (
        <StyledTerritoryList>
          {assignedIds.map((assignedId) => {
            const entity = entities.find((candidate) => candidate.id === assignedId);

            return entity ? (
              <StyledTerritoryListItem key={assignedId}>
                <EntityTag
                  entity={entity}
                  unlinkButton={{
                    onClick: () => onRemove(assignedId),
                    tooltipLabel: removeTooltip,
                  }}
                  disableDoubleClick
                />
              </StyledTerritoryListItem>
            ) : (
              <StyledTerritoryListItemMissing key={assignedId}>
                <div>
                  {invalidLabel} {assignedId}
                </div>
                <Button
                  tooltipLabel={removeTooltip}
                  icon={<IcoTrash />}
                  color="danger"
                  noBorder
                  onClick={() => onRemove(assignedId)}
                />
              </StyledTerritoryListItemMissing>
            );
          })}
        </StyledTerritoryList>
      )}

      <StyledRightsCellSuggester>
        <EntitySuggester
          compactUntilHover
          disableTemplatesAccept
          disableCreate
          inputWidth={86}
          categoryTypes={[entityClass]}
          placeholder={placeholder}
          excludedActantIds={assignedIds}
          preSuggestions={preSuggestions}
          onSelected={onAdd}
        />
      </StyledRightsCellSuggester>
    </StyledTerritoryColumn>
  );
};
