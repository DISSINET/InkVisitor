import { IResponseEntity } from "@inkvisitor/shared/types";
import { maxTabCount } from "Theme/constants";
import { useSearchParams } from "hooks";
import { DETAIL_TAB_ENTITIES_KEY, useDetailQuery, useEntitiesQuery } from "hooks/react-query";
import React, { useCallback, useEffect, useMemo, useState } from "react";
import { EntityDetail } from "./EntityDetail/EntityDetail";
import { StyledTabGroup } from "./EntityDetailBoxStyles";
import { EntityDetailTab } from "./EntityDetailTab/EntityDetailTab";
import { EntityDetailTabOverflow } from "./EntityDetailTabOverflow/EntityDetailTabOverflow";
import { useTabOverflow } from "./EntityDetailTabOverflow/useTabOverflow";
import update from "immutability-helper";
import { Loader } from "components";
import { useAppSelector } from "redux/hooks";

interface EntityDetailBox {
  onTabOpen?: () => void;
  maxTabs?: number;
  // the host page owns the minimized state; a minimized box renders neither
  // content nor loader, and only `onRestore` can bring it back
  isMinimized?: boolean;
  onRestore?: () => void;
}
export const EntityDetailBox: React.FC<EntityDetailBox> = ({
  onTabOpen,
  maxTabs = maxTabCount,
  isMinimized = false,
  onRestore,
}) => {
  const ping: number = useAppSelector((state) => state.ping);

  const {
    detailIdArray,
    removeDetailId,
    selectedDetailId,
    setSelectedDetailId,
    appendDetailId,
    promoteDetailId,
    clearAllDetailIds,
    replaceDetailIds,
  } = useSearchParams();

  useEffect(() => {
    if (!selectedDetailId && detailIdArray.length) {
      setSelectedDetailId(detailIdArray[0]);
    } else if (selectedDetailId && !detailIdArray.includes(selectedDetailId)) {
      appendDetailId(selectedDetailId, maxTabs);
    }
  }, [selectedDetailId, detailIdArray, maxTabs]);

  const [entities, setEntities] = useState<IResponseEntity[]>([]);

  // the provider builds detailIdArray anew on every render, so hooks follow
  // this string of the ids rather than the array itself
  const detailIdsKey = detailIdArray.join(",");
  // the query key is the set of open tabs, not their order, so a promoted or
  // dragged tab keeps the cached entities and no tab is fetched again
  const sortedDetailIds = useMemo(() => [...detailIdArray].sort(), [detailIdsKey]);
  const { data, error } = useEntitiesQuery(DETAIL_TAB_ENTITIES_KEY, sortedDetailIds, {
    staleTime: 1000 * 30, // 30 seconds
  });

  useEffect(() => {
    if (error && (error as any).message === "unknown class for entity") {
      clearAllDetailIds();

      // TODO: filter ids with valid entity classes and push to url
      // if (data) {
      //   const validIds = data.map((entity) => entity.id);
      //   clearAllDetailIds();
      //   validIds.forEach((id) => appendDetailId(id));
      // }
    }
  }, [error]);

  useEffect(() => {
    if (data) {
      // the api answers in its own order while the tab strip reads its order
      // from `detailIdArray`, which is also what a promoted or dragged tab
      // rewrites, so the response is laid back over that order
      const ordered = detailIdArray
        .map((id) => data.find((entity) => entity.id === id))
        .filter((entity): entity is IResponseEntity => entity !== undefined);
      if (JSON.stringify(ordered) !== JSON.stringify(entities)) {
        setEntities(ordered);
      }
      if (data.length < detailIdArray.length) {
        const idsFromData = data.map((d) => d.id);
        const idsToClear = detailIdArray.filter((detailId) => !idsFromData.includes(detailId));
        if (idsToClear.length) {
          idsToClear.forEach((id) => removeDetailId(id));
        }
      }
    }
  }, [data, detailIdsKey]);

  // A tab reached for in the caret list only borrows the last visible slot, so
  // the next pick would take that slot back; moving it to the front of the
  // strip is what lets two entities from the caret list sit side by side.
  const handleOverflowSelect = (entityId: string) => {
    setEntities((prevEntities) => {
      const index = prevEntities.findIndex((e) => e.id === entityId);
      if (index <= 0) {
        return prevEntities;
      }
      return update(prevEntities, {
        $splice: [
          [index, 1],
          [0, 0, prevEntities[index]],
        ],
      });
    });
    promoteDetailId(entityId);
  };

  const handleClose = (entityId: string) => {
    const newEntities: IResponseEntity[] = entities.filter((e) => e.id !== entityId);
    setEntities(newEntities);
    removeDetailId(entityId);
  };

  // the order of `entities` is what the `detail` url param is written from
  const { tabGroupRef, visibleTabs, overflowEntities } = useTabOverflow(
    entities,
    selectedDetailId
  );

  const moveRow = useCallback((dragIndex: number, hoverIndex: number) => {
    setEntities((prevEntities) =>
      update(prevEntities, {
        $splice: [
          [dragIndex, 1],
          [hoverIndex, 0, prevEntities[dragIndex]],
        ],
      }),
    );
  }, []);

  // delay of show content for fluent animation on open
  const [showContent, setShowContent] = useState(false);
  useEffect(() => {
    if (!isMinimized) {
      setTimeout(() => {
        setShowContent(true);
      }, 500);
    } else {
      setShowContent(false);
    }
  }, [isMinimized]);

  const { data: entity, error: entityError, isFetching } = useDetailQuery(selectedDetailId);

  return (
    <>
      {entities && entities.length > 0 && (
        <StyledTabGroup ref={tabGroupRef}>
          {visibleTabs.map(({ entity, index }) => (
            <EntityDetailTab
              key={entity.id}
              index={index}
              entity={entity}
              onClick={() => {
                if (isMinimized) {
                  onRestore?.();
                }
                onTabOpen?.();
                setSelectedDetailId(entity.id);
              }}
              onClose={() => handleClose(entity.id)}
              isSelected={selectedDetailId === entity.id}
              moveRow={moveRow}
              onDragEnd={() => {
                replaceDetailIds(entities.map((e) => e.id));
              }}
            />
          ))}

          {overflowEntities.length > 0 && (
            <EntityDetailTabOverflow
              entities={overflowEntities}
              onSelect={(entityId) => {
                if (isMinimized) {
                  onRestore?.();
                }
                onTabOpen?.();
                handleOverflowSelect(entityId);
              }}
              onClose={(entityId) => handleClose(entityId)}
            />
          )}
        </StyledTabGroup>
      )}

      <>
        {selectedDetailId && showContent && entity ? (
          <EntityDetail
            detailId={selectedDetailId}
            entity={entity}
            error={entityError}
            isFetching={isFetching}
          />
        ) : (
          <>{(ping === -10 || ping >= 0) && !isMinimized && <Loader show />}</>
        )}
      </>
    </>
  );
};

export const MemoizedEntityDetailBox = React.memo(EntityDetailBox);
