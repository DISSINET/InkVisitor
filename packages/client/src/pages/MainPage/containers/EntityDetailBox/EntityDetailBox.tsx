import { useSearchParams } from "hooks";
import React, { useEffect } from "react";
import { EntityDetail } from "./EntityDetail/EntityDetail";
import { StyledTabGroup } from "./EntityDetailBoxStyles";
import { EntityDetailTab } from "./EntityDetailTab/EntityDetailTab";

interface EntityDetailBox {}
export const EntityDetailBox: React.FC<EntityDetailBox> = ({}) => {
  const {
    detailId,
    removeDetailId,
    selectedDetailId,
    setSelectedDetailId,
    clearAllDetailIds,
  } = useSearchParams();

  useEffect(() => {
    if (!selectedDetailId && detailId.length) {
      setSelectedDetailId(detailId[0]);
    }
  }, []);

  const handleTabClose = (entityId: string) => {
    // TODO: move into params context -> TAB CAN BE CLOSED ALSO BY DELETING TAG!!!
    const index = detailId.indexOf(entityId);

    if (selectedDetailId === entityId) {
      if (index + 1 === detailId.length) {
        if (detailId.length > 1) {
          setSelectedDetailId(detailId[detailId.length - 2]);
        } else {
          // TODO: remove detail id in params context
          clearAllDetailIds();
        }
      } else {
        setSelectedDetailId(detailId[index + 1]);
      }
    }
    removeDetailId(entityId);
  };

  return (
    <>
      <StyledTabGroup>
        {detailId &&
          detailId.map((entityId, key) => (
            <EntityDetailTab
              key={key}
              entityId={entityId}
              onClick={() => setSelectedDetailId(entityId)}
              onClose={() => handleTabClose(entityId)}
              isSelected={selectedDetailId === entityId}
            />
          ))}
      </StyledTabGroup>
      {selectedDetailId && <EntityDetail detailId={selectedDetailId} />}
    </>
  );
};

export const MemoizedEntityDetailBox = React.memo(EntityDetailBox);
