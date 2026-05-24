import React from "react";
import { IEntity } from "@shared/types";
import { useQuery } from "@tanstack/react-query";
import api from "api";
import { EntityTag } from "components/advanced";
import { Loader } from "components";

interface EntityTagByIdProps {
  entityId: string;
  entity?: IEntity;
  fullWidth?: boolean;
  disableTooltip?: boolean;
}

/**
 * Renders EntityTag for an entity. Fetches via API when entity is not provided.
 */
export const EntityTagById: React.FC<EntityTagByIdProps> = ({
  entityId,
  entity: entityProp,
  fullWidth = false,
  disableTooltip = true,
}) => {
  const { data, isFetching } = useQuery({
    queryKey: ["entity", entityId],
    queryFn: async () => {
      const res = await api.entityGet(entityId);
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
      disableDoubleClick
    />
  );
};
