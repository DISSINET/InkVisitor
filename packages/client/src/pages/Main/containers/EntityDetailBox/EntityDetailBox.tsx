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
  }, [data]);

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

  const { ref: tabGroupRef, width: tabGroupWidth } = useResizeObserver<HTMLDivElement>();

  // tabs share the strip evenly, so past a certain count every label is clipped
  // to a few characters; the ones that do not fit go behind the caret instead
  const visibleTabCount = useMemo(() => {
    if (!tabGroupWidth || entities.length * MIN_TAB_WIDTH <= tabGroupWidth) {
      return entities.length;
    }
    return Math.max(1, Math.floor((tabGroupWidth - OVERFLOW_TAB_WIDTH) / MIN_TAB_WIDTH));
  }, [tabGroupWidth, entities.length]);

  // A tab selected from elsewhere - a link, a query result, the caret list -
  // can sit past the last visible slot. It borrows that slot for display and
  // the tab that held it moves behind the caret; the order the tabs are kept
  // in is untouched, since that order is what the `detail` url param is
  // written from and a narrower strip must not rewrite it. Each visible tab
  // carries its index in `entities` so drag-and-drop still moves the right one.
  const { visibleTabs, overflowEntities } = useMemo(() => {
    const selectedIndex = entities.findIndex((e) => e.id === selectedDetailId);

    if (selectedIndex >= visibleTabCount) {
      const lastSlot = visibleTabCount - 1;
      return {
        visibleTabs: [
          ...entities.slice(0, lastSlot).map((entity, index) => ({ entity, index })),
          { entity: entities[selectedIndex], index: selectedIndex },
        ],
        overflowEntities: entities.filter((_, i) => i >= lastSlot && i !== selectedIndex),
      };
    }

    return {
      visibleTabs: entities.slice(0, visibleTabCount).map((entity, index) => ({ entity, index })),
      overflowEntities: entities.slice(visibleTabCount),
    };
  }, [entities, visibleTabCount, selectedDetailId]);

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
