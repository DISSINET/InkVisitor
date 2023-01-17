import { StatementEnums } from "@shared/enums";
import {
  ClassificationOrder,
  IdentificationOrder,
  IEntity,
  OrderType,
  PropOrder,
} from "@shared/types";
import { Table } from "components";
import { EmptyTag, EntityTag } from "components/advanced";
import React, { useMemo } from "react";
import { CgPlayListAdd } from "react-icons/cg";
import { Cell, Column } from "react-table";

interface StatementEditorNoOrderTable {
  elements: OrderType[];
  entities: { [key: string]: IEntity };
  addToOrdering: (elementId: string) => void;
}
export const StatementEditorNoOrderTable: React.FC<
  StatementEditorNoOrderTable
> = ({ elements, entities, addToOrdering }) => {
  const data = useMemo(() => elements, [elements]);

  const renderEntityTag = (
    entity?: IEntity,
    fallback?: "actant" | "action" | "type" | "value" | "empty"
  ) => {
    return (
      <>
        {entity ? (
          <EntityTag
            key={entity.id}
            entity={entity}
            tooltipText={entity.label}
          />
        ) : (
          fallback && <EmptyTag label={fallback} />
        )}
      </>
    );
  };
  const columns: Column<{}>[] = React.useMemo(
    () => [
      {
        id: "button",
        accesor: "data",
        Cell: ({ row }: Cell) => {
          const orderObject = row.original as OrderType;
          console.log(orderObject.type);
          const { elementId } = row.original as any;

          return (
            <CgPlayListAdd
              size={20}
              style={{ cursor: "pointer" }}
              onClick={() => addToOrdering(elementId)}
            />
          );
        },
      },
      {
        id: "tags",
        accessor: "data",
        Cell: ({ row }: Cell) => {
          const orderObject = row.original as OrderType;

          if (orderObject.type === StatementEnums.ElementType.Prop) {
            const { propValueId, propTypeId, originId } =
              orderObject as PropOrder;
            const propTypeEntity = entities[propTypeId];
            const propValueEntity = entities[propValueId];
            const originEntity = entities[originId];

            return (
              <div style={{ whiteSpace: "nowrap" }}>
                {renderEntityTag(propTypeEntity, "type")}{" "}
                {renderEntityTag(propValueEntity, "value")}
              </div>
            );
          } else {
            const { entityId } = row.original as any;
            const entity = entities[entityId];
            return <>{entity && renderEntityTag(entity)}</>;
          }
        },
      },
      {
        id: "info",
        Cell: ({ row }: Cell) => {
          const orderObject = row.original as OrderType;

          return (
            <div
              style={{
                textAlign: "right",
                whiteSpace: "nowrap",
              }}
            >
              {renderInfoColumn(orderObject)}
            </div>
          );
        },
      },
    ],
    [elements, entities]
  );

  const renderInfoColumn = (orderObject: OrderType) => {
    switch (orderObject.type) {
      case StatementEnums.ElementType.Actant:
        // TODO: Subject?
        return "Actant";
      case StatementEnums.ElementType.Action:
        return "Action";
      case StatementEnums.ElementType.Classification:
        return (
          <>
            {"Classification of "}
            {renderEntityTag(
              entities[(orderObject as ClassificationOrder).originId],
              "empty"
            )}
          </>
        );
      case StatementEnums.ElementType.Identification:
        return (
          <>
            {"Identification of "}
            {renderEntityTag(
              entities[(orderObject as IdentificationOrder).originId],
              "empty"
            )}
          </>
        );
      case StatementEnums.ElementType.Prop:
        return (
          <>
            {"Prop of "}
            {renderEntityTag(
              entities[(orderObject as PropOrder).originId],
              "empty"
            )}
          </>
        );
    }
  };

  return (
    <Table
      data={data}
      columns={columns}
      perPage={1000}
      disableHeading
      disableHeader
      firstColumnMinWidth
    />
  );
};
