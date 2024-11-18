import React, { useCallback, useContext, useState } from "react";
import { ThemeContext } from "styled-components";
import {
  StyledCheckboxWrapper,
  StyledColumn,
  StyledColumnContent,
  StyledFocusedCircle,
} from "./ExplorerTableStyles";
import { Explore } from "@shared/types/query";
import { EntitySuggester, EntityTag } from "components/advanced";
import { FaChevronCircleDown, FaChevronCircleUp } from "react-icons/fa";
import { MdOutlineCheckBox } from "react-icons/md";
import { IEntity, IProp, IResponseQueryEntity, IUser } from "@shared/types";
import { classesAll } from "@shared/dictionaries/entity";
import { CMetaProp } from "constructors";
import { BeatLoader } from "react-spinners";

const WIDTH_COLUMN_DEFAULT = 800;

interface ExplorerTableRowProps {
  rowId: string;
  responseData: IResponseQueryEntity | undefined;
  columns: Explore.IExploreColumn[];
  handleEditColumn: (
    entity: IEntity,
    columnId: string,
    newEntity: IEntity
  ) => void;
  updateEntityMutation: any;
}
const ExplorerTableRow: React.FC<ExplorerTableRowProps> = ({
  rowId,
  responseData,
  columns,
  handleEditColumn,
  updateEntityMutation,
}) => {
  const themeContext = useContext(ThemeContext);

  if (!responseData) {
    return (
      <>
        <div
          style={{
            display: "flex",
            gap: "0.5rem",
            justifyContent: "start",
            marginLeft: "2.5rem",
          }}
        >
          <BeatLoader
            size={7}
            margin={4}
            style={{ marginLeft: "0.3rem", marginTop: "0.1rem" }}
            color={themeContext?.color["primary"]}
          />
          <div>{`loading ${rowId}...`}</div>
        </div>
      </>
    );
  }

  const { entity: rowEntity, columnData } = responseData;

  const renderCell = (
    recordEntity: IEntity,
    cellData:
      | IEntity
      | IEntity[]
      | number
      | number[]
      | string
      | string[]
      | IUser
      | IUser[],
    column: Explore.IExploreColumn
  ) => {
    if (Array.isArray(cellData)) {
      if (
        cellData.length > 0 &&
        typeof (cellData[0] as IEntity).class !== "undefined"
      ) {
        // is type IEntity[]
        return cellData.map((entity, key) => {
          return (
            <React.Fragment key={key}>
              <span>
                <EntityTag
                  entity={entity as IEntity}
                  unlinkButton={
                    column.editable && {
                      onClick: () => {
                        const { id } = entity as IEntity;
                        const { id: recordEntityId, props } =
                          recordEntity as IEntity;

                        const foundEntity = props.find(
                          (prop) => prop.value?.entityId === id
                        );
                        if (foundEntity) {
                          updateEntityMutation.mutate({
                            entityId: recordEntityId,
                            changes: {
                              props: props.filter(
                                (prop) => prop.id !== foundEntity.id
                              ),
                            },
                          });
                        }
                      },
                    }
                  }
                  disableDoubleClick
                />
              </span>
            </React.Fragment>
          );
        });
      } else if (
        cellData.length > 0 &&
        typeof (cellData[0] as IUser).email !== "undefined"
      ) {
        // is type IUser[]
        return (
          <div>
            <span
              style={{
                backgroundColor: "lime",
                padding: "0.3rem",
                display: "flex",
              }}
            >
              {(cellData as IUser[]).map((user) => {
                return user.name;
              })}
            </span>
          </div>
        );
      }
    } else {
      // TODO: not an array - IEntity, IUser, number, string
    }

    // return <StyledEmpty>{"empty"}</StyledEmpty>;
  };

  // const handleSelection = (rowIndex: number): string[] => {
  //   let selectedQueryEntities: IResponseQueryEntity[] = [];
  //   if (lastClickedIndex < rowIndex) {
  //     selectedQueryEntities = entities.slice(lastClickedIndex, rowIndex + 1);
  //   } else {
  //     // is bigger than - oposite direction of selection
  //     selectedQueryEntities = entities.slice(rowIndex, lastClickedIndex + 1);
  //   }
  //   return selectedQueryEntities.map((queryEntity) => queryEntity.entity.id);
  // };

  // const renderCheckbox = useCallback(
  //   (id: string, index: number) => {
  //     const size = 18;
  //     const checked = selectedRows.includes(id);
  //     const isFocused = lastClickedIndex === index;

  //     return (
  //       <StyledCheckboxWrapper>
  //         {isFocused && <StyledFocusedCircle checked={checked} />}
  //         {checked ? (
  //           <MdOutlineCheckBox
  //             size={size}
  //             style={{ zIndex: 2 }}
  //             onClick={(e) => {
  //               e.stopPropagation();
  //               if (
  //                 e.shiftKey &&
  //                 lastClickedIndex !== -1 &&
  //                 lastClickedIndex !== index
  //               ) {
  //                 // unset all between
  //                 const mappedIds = handleSelection(index);
  //                 const filteredIds = selectedRows.filter(
  //                   (id) => !mappedIds.includes(id)
  //                 );
  //                 setSelectedRows(filteredIds);
  //               } else {
  //                 handleRowSelect(id);
  //               }
  //               // dispatch(
  //               setLastClickedIndex(index);
  //               // );
  //             }}
  //           />
  //         ) : (
  //           <MdOutlineCheckBoxOutlineBlank
  //             size={size}
  //             style={{ zIndex: 2 }}
  //             onClick={(e) => {
  //               e.stopPropagation();
  //               if (
  //                 e.shiftKey &&
  //                 lastClickedIndex !== -1 &&
  //                 lastClickedIndex !== index
  //               ) {
  //                 // set all between
  //                 const mappedIds = handleSelection(index);
  //                 setSelectedRows([...new Set(selectedRows.concat(mappedIds))]);
  //               } else {
  //                 handleRowSelect(id);
  //               }
  //               setLastClickedIndex(index);
  //             }}
  //           />
  //         )}
  //       </StyledCheckboxWrapper>
  //     );
  //   },
  //   [selectedRows, lastClickedIndex]
  // );

  return (
    <React.Fragment>
      <StyledColumn
        $width={250}
        style={
          {
            // display: "sticky",
          }
        }
      >
        {/* {renderCheckbox(rowEntity.id, rowI)} */}

        {/* <span
        style={{
          cursor: "pointer",
          display: "flex",
          alignItems: "center",
        }}
        onClick={(e) => {
          e.stopPropagation();
          if (!rowsExpanded.includes(rowId)) {
            setRowsExpanded(rowsExpanded.concat(rowId));
          } else {
            setRowsExpanded(
              rowsExpanded.filter((r) => r !== rowId)
            );
          }
        }}
      >
        {rowsExpanded.includes(rowEntity.id) ? (
          <FaChevronCircleUp
            color={themeContext?.color.warning}
          />
        ) : (
          <FaChevronCircleDown />
        )}
      </span> */}

        <span
          style={{
            display: "inline-flex",
            overflow: "hidden",
          }}
        >
          <EntityTag entity={rowEntity} fullWidth disableDoubleClick />
        </span>
      </StyledColumn>

      {columns.map((column, key) => {
        return (
          <StyledColumn key={key} $width={WIDTH_COLUMN_DEFAULT}>
            <StyledColumnContent>
              {renderCell(rowEntity, columnData[column.id], column)}

              {column.editable &&
                column.type === Explore.EExploreColumnType.EPV && (
                  <EntitySuggester
                    categoryTypes={classesAll}
                    onPicked={(newEntity) => {
                      handleEditColumn(rowEntity, column.id, newEntity);
                    }}
                  />
                )}
            </StyledColumnContent>
          </StyledColumn>
        );
      })}
    </React.Fragment>
  );
};

const MemoizedExplorerTableRow = React.memo(ExplorerTableRow);
export default MemoizedExplorerTableRow;
