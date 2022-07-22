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
  } = useSearchParams();

  useEffect(() => {
    if (!selectedDetailId && detailIdArray.length) {
      setSelectedDetailId(detailIdArray[0]);
    }
  }, []);

  const [entities, setEntities] = useState<IResponseEntity[]>([]);

  const {} = useQuery(
    ["detail-tab-entities", detailIdArray],
    async () => {
      if (detailIdArray.length > entities.length) {
        const res = await api.entitiesSearch({ entityIds: detailIdArray });
        setEntities(res.data);
        return res.data;
      }
    },
    {
      enabled: api.isLoggedIn() && detailIdArray.length > 0,
    }
  );

  const handleClose = (entityId: string) => {
    const newEntities = entities.filter((e) => e.id !== entityId);
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
