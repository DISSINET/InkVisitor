import { IResponseEntity } from "@shared/types";
import api from "api";
import { useSearchParams } from "hooks";
import React, { useEffect, useState } from "react";
import { useQuery } from "react-query";
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
    appendDetailId,
  } = useSearchParams();

  // TODO: create error lifecycle of removing non existing from URL and selecting next one to open in tab

  useEffect(() => {
    if (!selectedDetailId && detailIdArray.length) {
      setSelectedDetailId(detailIdArray[0]);
    } else if (selectedDetailId && !detailIdArray.length) {
      appendDetailId(selectedDetailId);
    }
  }, []);

  const [entities, setEntities] = useState<IResponseEntity[]>([]);

  const { data } = useQuery(
    ["detail-tab-entities", detailIdArray],
    async () => {
      const res = await api.entitiesSearch({ entityIds: detailIdArray });
      return res.data;
    },
    {
      enabled: api.isLoggedIn() && detailIdArray.length > 0,
    }
  );

  useEffect(() => {
    if (data) {
      if (JSON.stringify(data) !== JSON.stringify(entities)) {
        setEntities(data);
      }
      if (data.length < detailIdArray.length) {
        // TODO: remove non existing IDs from array
      }
    }
  }, [data]);

  const handleClose = (entityId: string) => {
    const newEntities: IResponseEntity[] = entities.filter(
      (e) => e.id !== entityId
    );
    setEntities(newEntities);
    removeDetailId(entityId);
  };

  return (
    <>
      <StyledTabGroup>
        {entities &&
          entities.length > 0 &&
          entities?.map((entity, key) => (
            <EntityDetailTab
              key={key}
              entity={entity}
              onClick={() => setSelectedDetailId(entity.id)}
              onClose={() => handleClose(entity.id)}
              isSelected={selectedDetailId === entity.id}
            />
          ))}
      </StyledTabGroup>
      {selectedDetailId && <EntityDetail detailId={selectedDetailId} />}
    </>
  );
};

export const MemoizedEntityDetailBox = React.memo(EntityDetailBox);
