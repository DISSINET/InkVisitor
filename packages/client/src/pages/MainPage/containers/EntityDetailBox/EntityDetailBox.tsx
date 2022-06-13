import { useSearchParams } from "hooks";
import React from "react";
import { EntityDetail } from "./EntityDetail/EntityDetail";

// TODO: add to entity type dropdown options

interface EntityDetailBox {}
export const EntityDetailBox: React.FC<EntityDetailBox> = ({}) => {
  const { detailId } = useSearchParams();

  // TODO: map entities to detail instances
  return (
    <>
      {detailId &&
        detailId.map((entityId) => <EntityDetail detailId={entityId} />)}
    </>
  );
};

export const MemoizedEntityDetailBox = React.memo(EntityDetailBox);
