import { IResponseEntity } from "@inkvisitor/shared/types";
import { maxTabCount } from "Theme/constants";
import { useResizeObserver, useSearchParams } from "hooks";
import { DETAIL_TAB_ENTITIES_KEY, useDetailQuery, useEntitiesQuery } from "hooks/react-query";
import React, { useCallback, useEffect, useMemo, useState } from "react";
import { EntityDetail } from "./EntityDetail/EntityDetail";
import { StyledTabGroup } from "./EntityDetailBoxStyles";
import { EntityDetailTab } from "./EntityDetailTab/EntityDetailTab";
import { EntityDetailTabOverflow } from "./EntityDetailTabOverflow/EntityDetailTabOverflow";
import { OVERFLOW_TAB_WIDTH } from "./EntityDetailTabOverflow/EntityDetailTabOverflowStyles";
import update from "immutability-helper";
import { Loader } from "components";
import { useAppSelector } from "redux/hooks";

/**
 * Width (px) a tab may shrink to before the rest of the tabs move behind the
 * caret. At this size a tab carries its class bar and close button and little
 * else - the drag handle needs MIN_TAB_WIDTH_FOR_MOVE_ICON to appear.
 */
const MIN_TAB_WIDTH = 60;

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

  const { data, error } = useEntitiesQuery(DETAIL_TAB_ENTITIES_KEY, detailIdArray, {
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
      if (JSON.stringify(data) !== JSON.stringify(entities)) {
        setEntities(data);
      }
      if (data.length < detailIdArray.length) {
        const idsFromData = data.map((d) => d.id);
        const idsToClear = detailIdArray.filter((detailId) => !idsFromData.includes(detailId));
        if (idsToClear.length) {
          idsToClear.forEach((id) => removeDetailId(id));
        }
      }
    }
  }, [data]);

  const handleClose = (entityId: string) => {
    const newEntities: IResponseEntity[] = entities.filter((e) => e.id !== entityId);
    setEntities(newEntities);
    removeDetailId(entityId);
  };

  const { ref: tabGroupRef, width: tabGroupWidth } = useResizeObserver<HTMLDivElement>();

  // tabs share the strip evenly, so past a certain count every label is clipped
  // to a few characters; the ones that do not fit go behind the caret instead
  const visibleTabCount = useMemo(() => {
    if (!tabGroupWidth || entities.length * MIN_TAB_WIDTH <= tabGroupWidth) {
      return entities.length;
    }
    return Math.max(1, Math.floor((tabGroupWidth - OVERFLOW_TAB_WIDTH) / MIN_TAB_WIDTH));
  }, [tabGroupWidth, entities.length]);

  const visibleEntities = entities.slice(0, visibleTabCount);
  const overflowEntities = entities.slice(visibleTabCount);

  const moveToFront = useCallback(
    (entityId: string) => {
      const index = entities.findIndex((e) => e.id === entityId);
      if (index < 1) {
        return;
      }
      const reordered = update(entities, {
        $splice: [
          [index, 1],
          [0, 0, entities[index]],
        ],
      });
      setEntities(reordered);
      replaceDetailIds(reordered.map((e) => e.id));
    },
    [entities, replaceDetailIds],
  );

  // a tab selected from elsewhere (a link, a query result) can sit past the
  // visible slots, so it takes the first one and stays in sight
  const selectedIsHidden = overflowEntities.some((e) => e.id === selectedDetailId);
  useEffect(() => {
    if (selectedIsHidden) {
      moveToFront(selectedDetailId);
    }
  }, [selectedIsHidden, selectedDetailId, moveToFront]);

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
          {visibleEntities.map((entity, key) => (
            <EntityDetailTab
              key={key}
              index={key}
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
              selectedDetailId={selectedDetailId}
              onSelect={(entityId) => {
                if (isMinimized) {
                  onRestore?.();
                }
                onTabOpen?.();
                moveToFront(entityId);
                setSelectedDetailId(entityId);
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
