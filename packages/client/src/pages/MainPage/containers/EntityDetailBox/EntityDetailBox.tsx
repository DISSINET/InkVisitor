import { useSearchParams } from "hooks";
import React, { useEffect } from "react";
import { EntityDetail } from "./EntityDetail/EntityDetail";
import { StyledTabGroup } from "./EntityDetailBoxStyles";
import { EntityDetailTab } from "./EntityDetailTab/EntityDetailTab";

interface EntityDetailBox {}
export const EntityDetailBox: React.FC<EntityDetailBox> = ({}) => {
  const {
    detailIdArray,
    removeDetailId,
    selectedDetailId,
    setSelectedDetailId,
  } = useSearchParams();

  useEffect(() => {
    if (!selectedDetailId && detailIdArray.length) {
      setSelectedDetailId(detailIdArray[0]);
    }
  }, []);

  return (
    <>
      <StyledTabGroup>
        {detailIdArray.length > 0 &&
          detailIdArray.map((entityId, key) => (
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
