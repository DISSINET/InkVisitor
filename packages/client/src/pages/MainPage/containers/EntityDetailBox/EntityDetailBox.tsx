import { useSearchParams } from "hooks";
import React, { useEffect } from "react";
import { EntityDetail } from "./EntityDetail/EntityDetail";
import { StyledTabGroup } from "./EntityDetailBoxStyles";
import { EntityDetailTab } from "./EntityDetailTab/EntityDetailTab";

interface EntityDetailBox {}
export const EntityDetailBox: React.FC<EntityDetailBox> = ({}) => {
  const { detailId, removeDetailId, selectedDetailId, setSelectedDetailId } =
    useSearchParams();

  useEffect(() => {
    if (!selectedDetailId && detailId.length) {
      setSelectedDetailId(detailId[0]);
    }
  }, []);

  return (
    <>
      <StyledTabGroup>
        {detailId &&
          detailId.map((entityId, key) => (
            <EntityDetailTab
              key={key}
              entityId={entityId}
              onClick={() => setSelectedDetailId(entityId)}
              onClose={() => removeDetailId(entityId)}
              isSelected={selectedDetailId === entityId}
            />
          ))}
      </StyledTabGroup>
      {selectedDetailId && <EntityDetail detailId={selectedDetailId} />}
    </>
  );
};

export const MemoizedEntityDetailBox = React.memo(EntityDetailBox);
