import { Button } from "components";
import { useSearchParams } from "hooks";
import React, { useEffect } from "react";
import { setSelectedDetailId } from "redux/features/entityDetail/selectedDetailIdSlice";
import { useAppDispatch, useAppSelector } from "redux/hooks";
import { EntityDetail } from "./EntityDetail/EntityDetail";
import { StyledTabGroup } from "./EntityDetailBoxStyles";

interface EntityDetailBox {}
export const EntityDetailBox: React.FC<EntityDetailBox> = ({}) => {
  const { detailId } = useSearchParams();
  const selectedDetailId = useAppSelector(
    (state) => state.entityDetail.selectedDetailId
  );
  const dispatch = useAppDispatch();

  useEffect(() => {
    if (!selectedDetailId && detailId.length) {
      dispatch(setSelectedDetailId(detailId[0]));
    }
  }, []);

  // TODO: tabs
  return (
    <>
      <StyledTabGroup>
        {detailId &&
          detailId.map((entityId, key) => (
            // <EntityDetail key={key} detailId={entityId} />
            <Button
              key={key}
              label={entityId}
              onClick={() => dispatch(setSelectedDetailId(entityId))}
            />
          ))}
      </StyledTabGroup>
      {selectedDetailId && <EntityDetail detailId={selectedDetailId} />}
    </>
  );
};

export const MemoizedEntityDetailBox = React.memo(EntityDetailBox);
