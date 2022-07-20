import { IResponseEntity } from "@shared/types";
import api from "api";
import { useSearchParams } from "hooks";
import React, { useEffect, useState } from "react";
import { useQuery, useQueryClient } from "react-query";
import { EntityDetail } from "./EntityDetail/EntityDetail";
import { StyledTabGroup } from "./EntityDetailBoxStyles";
import { EntityDetailTab } from "./EntityDetailTab/EntityDetailTab";

interface EntityDetailBox {}
export const EntityDetailBox: React.FC<EntityDetailBox> = ({}) => {
  const queryClient = useQueryClient();

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

  // Refetch Conditions:
  // detailIdArray.length > 0 && entities.length < detailIdArray.length
  // (nebude fungovat kdyz bude mensi o dva a otevru novy tab)

  const refetchEnabled = (): boolean => {
    if (detailIdArray.length > 0 && detailIdArray.length < entities.length) {
      if (entities.filter((e) => !detailIdArray.includes(e.id)).length > 0) {
        // ONLY when entities is lower count and new entity appear in detailIdArray
        return true;
      } else {
        return false;
      }
    } else {
      return false;
    }
  };

  const { data } = useQuery(
    ["detail-tab-entities", detailIdArray],
    async () => {
      if (detailIdArray.length > entities.length) {
        const res = await api.entitiesSearch({ entityIds: detailIdArray });
        console.log("get Entities");
        return res.data;
      }
    },
    {
      enabled: api.isLoggedIn() && detailIdArray.length > 0,
    }
  );

  useEffect(() => {
    if (data) {
      console.log("setEntities");
      setEntities(data);
    }
  }, [data]);

  useEffect(() => {
    if (detailIdArray.length > 0 && detailIdArray.length < entities.length) {
      console.log("reset enabled");
      // TODO: discover what happened
      // const newEntities = entities.filter((e) => e.id !== entityId);
      // setEntities(newEntities);
      queryClient.invalidateQueries(["detail-tab-entities", detailIdArray]);
    }
  }, [detailIdArray]);

  const handleClose = (entityId: string) => {
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
