import { IEntity, OrderType } from "@shared/types";
import api from "api";
import React, { useEffect, useState } from "react";
import { useMutation, useQueryClient } from "react-query";

interface StatementEditorOrdering {
  statementId: string;
  elementsOrders: OrderType[];
  entities: { [key: string]: IEntity };
}
export const StatementEditorOrdering: React.FC<StatementEditorOrdering> = ({
  statementId,
  elementsOrders,
  entities,
}) => {
  const queryClient = useQueryClient();
  const [withOrder, setWithOrder] = useState<OrderType[]>([]);
  const [withoutOrder, setWithoutOrder] = useState<OrderType[]>([]);

  useEffect(() => {
    const elementsWithOrder = elementsOrders.filter((e) => e.order !== false);
    setWithOrder(elementsWithOrder);
    const elementsWithoutOrder = elementsOrders.filter(
      (e) => e.order === false
    );
    setWithoutOrder(elementsWithoutOrder);
  }, [elementsOrders]);

  const orderElementsMutation = useMutation(
    async (elementsWithOrdering: string[]) =>
      await api.statementReorderElements(statementId, elementsWithOrdering),
    {
      onSuccess: (data, variables) => {
        console.log(data);
        queryClient.invalidateQueries("statement");
      },
    }
  );

  // console.log("elementsWithOrder", withOrder);
  // console.log("elementsWithoutOrder", withoutOrder);

  return (
    <>
      <div>with order</div>
      <div>
        {withOrder.map((element, key) => (
          <p
            onClick={() =>
              orderElementsMutation.mutate(
                withOrder
                  .map((e) => e.elementId)
                  .filter((eId) => eId !== element.elementId)
              )
            }
          >
            {element.elementId}
          </p>
        ))}
      </div>
      <div>without order</div>
      <div>
        {withoutOrder.map((element, key) => (
          <p
            onClick={() =>
              orderElementsMutation.mutate([
                ...withOrder.map((e) => e.elementId),
                element.elementId,
              ])
            }
          >
            {element.elementId}
          </p>
        ))}
      </div>
    </>
  );
};
