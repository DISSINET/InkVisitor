import React, { useRef } from "react";
import { FaGripVertical, FaTrashAlt, FaUnlink } from "react-icons/fa";
import { useMutation, UseMutationResult, useQueryClient } from "react-query";
import { AxiosResponse } from "axios";

import { Button } from "components";
import {
  IEntity,
  IResponseDetail,
  IResponseGeneric,
  IResponseStatement,
  IStatementActant,
} from "@shared/types";
import api from "api";
import { Cell, ColumnInstance } from "react-table";
import { StyledTd, StyledTr } from "./EntityDetailMetaTableStyles";

import { DragItem, ItemTypes } from "types";

interface EntityDetailMetaTableRow {
  row: any;
  index: number;
  visibleColumns: ColumnInstance<{}>[];
}
export const EntityDetailMetaTableRow: React.FC<EntityDetailMetaTableRow> = ({
  row,
  index,
  visibleColumns,
}) => {
  const updateStatementActant = async (
    statementId: string,
    actantId: string,
    changes: any
  ) => {
    // const metaStatement =
    //   actant && actant.metaStatements.find((ms) => ms.id === statementId);
    // if (metaStatement) {
    //   const metaStatementData = { ...metaStatement.data };
    //   const updatedStatementActants = metaStatementData.actants.map((actant) =>
    //     actant.id === actantId ? { ...actant, ...changes } : actant
    //   );
    //   actantsUpdateMutation.mutate({
    //     metaStatementId: metaStatement.id,
    //     changes: {
    //       ...metaStatementData,
    //       ...{ actants: updatedStatementActants },
    //     },
    //   });
    // }
  };

  const updateStatementAttribute = async (
    statementId: string,
    changes: any
  ) => {
    // const metaStatement =
    //   actant && actant.metaStatements.find((ms) => ms.id === statementId);
    // if (metaStatement) {
    //   actantsUpdateMutation.mutate({
    //     metaStatementId: metaStatement.id,
    //     changes: { ...metaStatement.data, ...changes },
    //   });
    // }
  };

  return (
    <React.Fragment key={index}>
      <StyledTr isOdd={Boolean(index % 2)}>
        {row.cells.map((cell: Cell) => {
          return (
            <StyledTd {...cell.getCellProps()}>{cell.render("Cell")}</StyledTd>
          );
        })}
      </StyledTr>
    </React.Fragment>
    // <>
    //   <StyledSectionMetaTableCell></StyledSectionMetaTableCell>

    //   {/* type */}
    //   <StyledSectionMetaTableCell>
    //     {typeSActant && typeActant ? (
    //       <React.Fragment>
    //         <EntityTag
    //           actant={typeActant}
    //           short={false}
    //           button={
    //             <Button
    //               key="d"
    //               icon={<FaUnlink />}
    //               tooltip="unlink actant"
    //               color="danger"
    //               onClick={() => {
    //                 updateStatementActant(metaStatement.id, typeSActant.id, {
    //                   actant: "",
    //                 });
    //               }}
    //             />
    //           }
    //         />
    //         <StyledSectionMetaTableButtonGroup>
    //           <ElvlToggle
    //             value={typeSActant.elvl}
    //             onChangeFn={(newValue: string) => {
    //               updateStatementActant(metaStatement.id, typeSActant.id, {
    //                 elvl: newValue,
    //               });
    //             }}
    //           />
    //         </StyledSectionMetaTableButtonGroup>
    //       </React.Fragment>
    //     ) : (
    //       <EntitySuggester
    //         onSelected={async (newActantId: string) => {
    //           updateStatementActant(metaStatement.id, typeSActant.id, {
    //             actant: newActantId,
    //           });
    //         }}
    //         categories={["C"]}
    //         placeholder={"add new reference"}
    //       />
    //     )}
    //   </StyledSectionMetaTableCell>

    //   {/* value */}
    //   <StyledSectionMetaTableCell>
    //     {valueSActant && valueActant ? (
    //       <React.Fragment>
    //         <EntityTag
    //           actant={valueActant}
    //           short={false}
    //           button={
    //             <Button
    //               key="d"
    //               icon={<FaUnlink />}
    //               tooltip="unlink actant"
    //               color="danger"
    //               onClick={() => {
    //                 updateStatementActant(metaStatement.id, valueSActant.id, {
    //                   actant: "",
    //                 });
    //               }}
    //             />
    //           }
    //         />
    //         <StyledSectionMetaTableButtonGroup>
    //           <ElvlToggle
    //             value={valueSActant.elvl}
    //             onChangeFn={(newValue: string) => {
    //               updateStatementActant(metaStatement.id, valueSActant.id, {
    //                 elvl: newValue,
    //               });
    //             }}
    //           />
    //         </StyledSectionMetaTableButtonGroup>
    //       </React.Fragment>
    //     ) : (
    //       <EntitySuggester
    //         onSelected={async (newActantId: string) => {
    //           updateStatementActant(metaStatement.id, valueSActant.id, {
    //             actant: newActantId,
    //           });
    //         }}
    //         categories={["P", "G", "O", "C", "L", "V", "E", "S", "T", "R"]}
    //         placeholder={"add new reference"}
    //       />
    //     )}
    //   </StyledSectionMetaTableCell>

    //   {/* attributes of statement */}
    //   <StyledSectionMetaTableCell>
    //     <StyledSectionMetaTableButtonGroup></StyledSectionMetaTableButtonGroup>
    //   </StyledSectionMetaTableCell>
    //   {/* actions */}
    //   <StyledSectionMetaTableCell borderless>
    //     <StyledSectionMetaTableButtonGroup>
    //       <Button
    //         key="r"
    //         icon={<FaTrashAlt size={14} />}
    //         color="danger"
    //         tooltip="delete"
    //         onClick={() => actantsDeleteMutation.mutate(metaStatement.id)}
    //       />
    //     </StyledSectionMetaTableButtonGroup>
    //   </StyledSectionMetaTableCell>
    // </>
  );
};
