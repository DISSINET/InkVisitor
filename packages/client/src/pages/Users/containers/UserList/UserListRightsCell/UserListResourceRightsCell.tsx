import { EntityEnums } from "@inkvisitor/shared/enums";
import { IEntity } from "@inkvisitor/shared/types";
import { Button, ButtonGroup, Submit } from "components";
import { useResourcesWithDocumentsQuery } from "hooks/react-query";
import React, { useState } from "react";
import { IcoPlayListAdd, IcoPlayListRemove } from "Theme/icons";
import { UserListRightsCell } from "./UserListRightsCell";

interface UserListResourceRightsCell {
  userName: string;
  assignedIds: string[];
  entities: IEntity[] | undefined;
  onAdd: (resourceId: string) => void;
  onAddAll: (resourceIds: string[]) => void;
  onRemove: (resourceId: string) => void;
  onRemoveAll: () => void;
}

/**
 * The suggested resources are fetched here rather than in UserList: a data
 * change there would rebuild the column definitions, and react-table remounts
 * the cells - and with them the suggester, which would fold back into its
 * compact button mid-use.
 */
export const UserListResourceRightsCell: React.FC<UserListResourceRightsCell> = ({
  userName,
  assignedIds,
  entities,
  onAdd,
  onAddAll,
  onRemove,
  onRemoveAll,
}) => {
  const { data: resourcesWithDocuments, refetch: refetchResourcesWithDocuments } =
    useResourcesWithDocumentsQuery();

  const [removingAll, setRemovingAll] = useState(false);

  const unassignedResourceIds = (resourcesWithDocuments ?? [])
    .map((resource) => resource.id)
    .filter((resourceId) => !assignedIds.includes(resourceId));

  return (
    <>
      <UserListRightsCell
        entityClass={EntityEnums.Class.Resource}
        assignedIds={assignedIds}
        entities={entities}
        placeholder="assign a resource"
        invalidLabel="invalid R"
        removeTooltip="unassign resource from this user"
        onAdd={onAdd}
        onRemove={onRemove}
        preSuggestions={resourcesWithDocuments}
        onSuggesterFocus={() => refetchResourcesWithDocuments()}
        suggesterAction={
          <ButtonGroup $gap="no">
            <Button
              icon={<IcoPlayListAdd />}
              color="primary"
              inverted
              shape="rounded-left-sm"
              disabled={unassignedResourceIds.length === 0}
              tooltipLabel={
                unassignedResourceIds.length === 0
                  ? "all resources with documents are assigned"
                  : `assign all resources with documents (${unassignedResourceIds.length})`
              }
              onClick={() => onAddAll(unassignedResourceIds)}
            />
            <Button
              icon={<IcoPlayListRemove />}
              color="danger"
              inverted
              shape="rounded-right-sm"
              disabled={assignedIds.length === 0}
              tooltipLabel={
                assignedIds.length === 0
                  ? "no resources assigned"
                  : `unassign all resources (${assignedIds.length})`
              }
              onClick={() => setRemovingAll(true)}
            />
          </ButtonGroup>
        }
      />

      <Submit
        title="Unassigning resources"
        text={`Do you really want to unassign all ${assignedIds.length} resources from user ${userName}? The resources and their documents are not deleted, the user only loses access to annotate them.`}
        submitLabel="Unassign"
        show={removingAll}
        onSubmit={() => {
          onRemoveAll();
          setRemovingAll(false);
        }}
        onCancel={() => setRemovingAll(false)}
        bgClickCancels
      />
    </>
  );
};
