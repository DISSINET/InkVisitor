import { EntityEnums } from "@inkvisitor/shared/enums";
import { IEntity } from "@inkvisitor/shared/types";
import { useResourcesWithDocumentsQuery } from "hooks/react-query";
import React from "react";
import { UserListRightsCell } from "./UserListRightsCell";

interface UserListResourceRightsCell {
  assignedIds: string[];
  entities: IEntity[] | undefined;
  onAdd: (resourceId: string) => void;
  onRemove: (resourceId: string) => void;
}

/**
 * The suggested resources are fetched here rather than in UserList: a data
 * change there would rebuild the column definitions, and react-table remounts
 * the cells - and with them the suggester, which would fold back into its
 * compact button mid-use.
 */
export const UserListResourceRightsCell: React.FC<UserListResourceRightsCell> = ({
  assignedIds,
  entities,
  onAdd,
  onRemove,
}) => {
  const { data: resourcesWithDocuments, refetch: refetchResourcesWithDocuments } =
    useResourcesWithDocumentsQuery();

  return (
    <UserListRightsCell
      entityClass={EntityEnums.Class.Resource}
      assignedIds={assignedIds}
      entities={entities}
      placeholder="assign a resource"
      invalidLabel="invalid R"
      removeTooltip="remove resource from rights"
      onAdd={onAdd}
      onRemove={onRemove}
      preSuggestions={resourcesWithDocuments}
      onSuggesterFocus={() => refetchResourcesWithDocuments()}
    />
  );
};
