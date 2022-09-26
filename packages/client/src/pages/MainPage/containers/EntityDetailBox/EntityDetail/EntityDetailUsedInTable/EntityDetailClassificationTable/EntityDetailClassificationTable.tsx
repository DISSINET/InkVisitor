import { IEntity } from "@shared/types";
import { IResponseUsedInStatementClassification } from "@shared/types/response-detail";
import { Table } from "components";
import { EntityTag } from "components/advanced";
import React, { useMemo } from "react";
import { Cell, Column } from "react-table";
import {
  StyledTableTextGridCell,
  StyledTagWrap,
} from "../EntityDetailUsedInTableStyles";

interface EntityDetailClassificationTable {
  title: { singular: string; plural: string };
  entities: { [key: string]: IEntity };
  useCases: IResponseUsedInStatementClassification[];
  perPage?: number;
}
export const EntityDetailClassificationTable: React.FC<
  EntityDetailClassificationTable
> = ({ title, entities, useCases, perPage = 5 }) => {
  // TODO: utilise
  const renderEntityTag = (entity: IEntity) => {
    return (
      <StyledTableTextGridCell>
        <StyledTagWrap>
          <EntityTag fullWidth entity={entity} />
        </StyledTagWrap>
      </StyledTableTextGridCell>
    );
  };

  const data = useMemo(() => (useCases ? useCases : []), [useCases]);

  const columns: Column<{}>[] = React.useMemo(
    () => [
      {
        Header: "Statement",
        accessor: "data",
        Cell: ({ row }: Cell) => {
          const useCase =
            row.original as IResponseUsedInStatementClassification;
          const entityId = useCase.statementId;
          const entity = entityId ? entities[entityId] : false;
          return (
            <>
              {entity && (
                <EntityTag
                  key={entity.id}
                  entity={entity}
                  tooltipText={entity.label}
                />
              )}
            </>
          );
        },
      },
      {
        Header: "Actant",
        accesor: "data",
        Cell: ({ row }: Cell) => {
          const useCase =
            row.original as IResponseUsedInStatementClassification;
          const entityId = useCase.actantEntityId;
          const entity = entityId ? entities[entityId] : false;
          return <>{entity && renderEntityTag(entity)}</>;
        },
      },
      {
        Header: "Identification",
        Cell: ({ row }: Cell) => {
          const useCase =
            row.original as IResponseUsedInStatementClassification;
          const entityId = useCase.relationEntityId;
          const entity = entityId ? entities[entityId] : false;
          return <>{entity && renderEntityTag(entity)}</>;
        },
      },
    ],
    [entities]
  );

  return (
    <>
      <Table
        columns={columns}
        data={data}
        entityTitle={title}
        perPage={perPage}
      />
    </>
  );
};
