import { IEntity } from "@inkvisitor/shared/types";
import api from "api";
import { useUserQuery } from "hooks/react-query";
import { useCallback } from "react";
import { toast } from "react-toastify";
import { EntityDragItem } from "types";
import { buildValueCopy } from "utils/valueDropCopy";

/**
 * Creates the new V a drop target links in place of a dragged one. The drag
 * item carries the source entity when it comes from an EntityTag; other drag
 * sources only carry the id, hence the fetch.
 */
export const useValueDropCopy = () => {
  const { data: user } = useUserQuery();

  return useCallback(
    async (item: EntityDragItem): Promise<IEntity | false> => {
      if (!user) {
        return false;
      }
      try {
        let source: IEntity | false = item.entity;
        if (!source) {
          const res = await api.entitiesGet([item.id]);
          source = res.data?.[0] ?? false;
        }
        if (!source) {
          return false;
        }
        const valueCopy = buildValueCopy(source, user.options);
        await api.entityCreate(valueCopy);
        return valueCopy;
      } catch {
        toast.error("new value could not be created");
        return false;
      }
    },
    [user],
  );
};
