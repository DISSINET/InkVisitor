import { IResponseEntity } from "@shared/types";
import { Table } from "components";
import React, { useMemo } from "react";
import { Cell, Column } from "react-table";
import { EntityTag } from "../../EntityTag/EntityTag";
import { StyledResultItem } from "../EntitySearchBoxStyles";

interface EntitySearchResults {
  results?: IResponseEntity[];
}
export const EntitySearchResults: React.FC<EntitySearchResults> = ({
  results,
}) => {
  const data = useMemo(() => (results ? results : []), [results]);

  const columns: Column<{}>[] = React.useMemo(
    () => [
      {
        Header: "entity",
        accesor: "data",
        Cell: ({ row }: Cell) => {
          const entity = row.original as IResponseEntity;
          return (
            <div style={{ display: "grid" }}>
              <StyledResultItem>
                <EntityTag
                  actant={entity}
                  tooltipPosition="left center"
                  fullWidth
                />
              </StyledResultItem>
            </div>
          );
        },
      },
    ],
    []
  );

  return (
    <>
      <Table
        entityTitle={{ singular: "Result", plural: "Results" }}
        columns={columns}
        data={data}
        perPage={5}
        disableHeading
        disableHeader
      />
    </>
  );
};
