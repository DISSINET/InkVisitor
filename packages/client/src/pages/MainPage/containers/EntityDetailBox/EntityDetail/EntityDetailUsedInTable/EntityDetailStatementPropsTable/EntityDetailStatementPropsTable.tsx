import { IEntity } from "@shared/types";
import { IResponseUsedInStatementProps } from "@shared/types/response-detail";
import { Button, Table } from "components";
import { EntityTag } from "components/advanced";
import { useSearchParams } from "hooks";
import React, { useMemo } from "react";
import { FaEdit } from "react-icons/fa";
import { Cell, Column } from "react-table";
import {
  StyledTableTextGridCell,
  StyledTagWrap,
} from "../EntityDetailUsedInTableStyles";

interface EntityDetailStatementPropsTable {
  title: { singular: string; plural: string };
  entities: { [key: string]: IEntity };
  useCases: IResponseUsedInStatementProps[];
  perPage?: number;
}
export const EntityDetailStatementPropsTable: React.FC<EntityDetailStatementPropsTable> =
  ({ title, entities, useCases, perPage = 5 }) => {
    const { setStatementId, setTerritoryId } = useSearchParams();

    const data = useMemo(() => (useCases ? useCases : []), [useCases]);

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
    const columns: Column<{}>[] = React.useMemo(
      () => [
        {
          Header: "Statement",
          accessor: "data",
          Cell: ({ row }: Cell) => {
            const useCase = row.original as IResponseUsedInStatementProps;
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
          Header: "Origin",
          accesor: "data",
          Cell: ({ row }: Cell) => {
            const useCase = row.original as IResponseUsedInStatementProps;
            const entityId = useCase.originId;
            const entity = entityId ? entities[entityId] : false;
            return <>{entity && renderEntityTag(entity)}</>;
          },
        },
        {
          Header: "Type",
          Cell: ({ row }: Cell) => {
            const useCase = row.original as IResponseUsedInStatementProps;
            const entityId = useCase.typeId;
            const entity = entityId ? entities[entityId] : false;
            return <>{entity && renderEntityTag(entity)}</>;
          },
        },
        {
          Header: "Value",
          Cell: ({ row }: Cell) => {
            const useCase = row.original as IResponseUsedInStatementProps;
            const entityId = useCase.valueId;
            const entity = entityId ? entities[entityId] : false;
            return <>{entity && renderEntityTag(entity)}</>;
          },
        },
        {
          id: "edit",
          Cell: ({ row }: Cell) => {
            const useCase = row.original as IResponseUsedInStatementProps;
            const entityId = useCase.statementId;
            const entity = entityId ? entities[entityId] : false;

            return (
              <>
                {entity && (
                  <Button
                    icon={<FaEdit size={14} />}
                    color="primary"
                    inverted
                    noBorder
                    tooltipLabel="edit statement"
                    onClick={async () => {
                      if (entity.data.territory) {
                        setStatementId(entity.id);
                        setTerritoryId(entity.data.territory.id);
                      }
                    }}
                  />
                )}
              </>
            );
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
          firstColumnMinWidth
          lastColumnMinWidth
        />
      </>
    );
  };
