import React from "react";
import { IEntity } from "@inkvisitor/shared/types";
import { useQuery } from "@tanstack/react-query";
import api from "api";
import { EntityTag } from "components/advanced";
import { Loader } from "components";
import { UnlinkButton } from "./EntityTag";

interface EntityTagByIdProps {
  entityId: string;
  entity?: IEntity;
  fullWidth?: boolean;
  disableTooltip?: boolean;
  unlinkButton?: UnlinkButton | false;
  disableToast?: boolean;
  disableDoubleClick?: boolean;
}

/**
 * Renders EntityTag for an entity. Fetches via API when entity is not provided.
 */
export const EntityTagById: React.FC<EntityTagByIdProps> = ({
  entityId,
  entity: entityProp,
  fullWidth = false,
  disableTooltip = true,
  unlinkButton,
  disableToast = false,
  disableDoubleClick = true,
}) => {
  const { data, isFetching } = useQuery({
    queryKey: ["entity", "entity-tag-by-id", entityId],
    queryFn: async () => {
      const res = await api.entityGet(entityId, {
        ignoreErrorToast: disableToast,
      });
      return res.data;
    },
    enabled: !!entityId && !entityProp && api.isLoggedIn(),
  });

  const entity = entityProp ?? data;

  if (isFetching && !entity) {
    return <Loader size={12} show={true} noBackground />;
  }
  if (!entity) {
    return <span>{entityId}</span>;
  }
  return (
    <EntityTag
      entity={entity}
      disableTooltip={disableTooltip}
      fullWidth={fullWidth}
      unlinkButton={unlinkButton}
      disableDoubleClick={disableDoubleClick}
    />
  );
};
