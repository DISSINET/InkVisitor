import { EntityEnums } from "@inkvisitor/shared/enums";
import { IEntity } from "@inkvisitor/shared/types";
import { IResponseUsedInReference } from "@inkvisitor/shared/types/response-detail";
import { Button, Table } from "components";
import { EntityTag } from "components/advanced";
import { useSearchParams } from "hooks";
import React, { useMemo } from "react";
import { FaEdit } from "react-icons/fa";
import { CellProps, Column } from "react-table";
import { StyledTableTextGridCell } from "../EntityDetailUsedInTableStyles";
import { renderEntityTag } from "../EntityDetailUsedInTableUtils";

type CellType = CellProps<IResponseUsedInReference>;

interface EntityDetailReferencesTable {
  title: { singular: string; plural: string };
  entities: { [key: string]: IEntity };
  useCases: IResponseUsedInReference[];
  perPage?: number;
}
export const EntityDetailReferencesTable: React.FC<EntityDetailReferencesTable> = ({
  title,
  entities,
  useCases,
  perPage = 5,
}) => {
  const { setStatementId, setTerritoryId } = useSearchParams();

  const data = useMemo(() => (useCases ? useCases : []), [useCases]);

  const columns = useMemo<Column<IResponseUsedInReference>[]>(
    () => [
      {
        Header: "Origin",
        Cell: ({ row }: CellType) => {
          const useCase = row.original;
          const entityId = useCase.originId;
          const entity = entityId ? entities[entityId] : false;
          return (
            <>
              {entity && (
                <StyledTableTextGridCell>
                  <EntityTag
                    fullWidth
                    entity={entity}
                    button={
                      entity.class === EntityEnums.Class.Statement && (
                        <Button
                          tooltipLabel="open Statement in editor"
                          color="plain"
                          inverted
                          shape="sharp"
                          icon={<FaEdit />}
                          onClick={() => {
                            setStatementId(entity.id);
                            const territoryId = entity.data.territory?.territoryId;
                            if (!entity.isTemplate && territoryId) {
                              setTerritoryId(territoryId);
                            }
                          }}
                        />
                      )
                    }
                  />
                </StyledTableTextGridCell>
              )}
            </>
          );
        },
      },
      {
        Header: "Reference",
        Cell: ({ row }: CellType) => {
          const useCase = row.original;
          const entityId = useCase.resourceId;
          const entity = entityId ? entities[entityId] : false;
          return <>{entity && renderEntityTag(entity)}</>;
        },
      },
      {
        Header: "Reference part",
        Cell: ({ row }: CellType) => {
          const useCase = row.original;
          const entityId = useCase.valueId;
          const entity = entityId ? entities[entityId] : false;
          return <>{entity && renderEntityTag(entity)}</>;
        },
      },
    ],
    [entities],
  );

  return (
    <>
      <Table columns={columns} data={data} entityTitle={title} perPage={perPage} equalColumns />
    </>
  );
};
