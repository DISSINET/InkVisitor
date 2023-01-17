import { IEntity, OrderType } from "@shared/types";
import React from "react";

interface StatementEditorOrderTable {
  elements: OrderType[];
  entities: { [key: string]: IEntity };
  removeFromOrdering: (elementId: string) => void;
}
export const StatementEditorOrderTable: React.FC<StatementEditorOrderTable> = ({
  elements,
  entities,
  removeFromOrdering,
}) => {
  return <div></div>;
};
