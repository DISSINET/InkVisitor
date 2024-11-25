import { useMutation, useQueryClient } from "@tanstack/react-query";
import React, { useContext } from "react";
import {
  FaChevronCircleDown,
  FaChevronCircleUp,
  FaUserAlt,
} from "react-icons/fa";
import {
  MdOutlineCheckBox,
  MdOutlineCheckBoxOutlineBlank,
} from "react-icons/md";
import { BeatLoader } from "react-spinners";
import { ThemeContext } from "styled-components";

import { classesAll } from "@shared/dictionaries/entity";
import { IEntity, IResponseQueryEntity, IUser } from "@shared/types";
import { Explore } from "@shared/types/query";
import api from "api";
import { EntitySuggester, EntityTag } from "components/advanced";
import { deleteProp } from "constructors";

import {
  StyledCheckboxWrapper,
  StyledColumn,
  StyledColumnContent,
  StyledFocusedCircle,
  StyledUserTag,
} from "./ExplorerTableStyles";
import { WIDTH_COLUMN_DEFAULT, WIDTH_COLUMN_FIRST } from "./types";

interface ExplorerTableRowProps {
  rowId: number;
  responseData: IResponseQueryEntity | undefined;
  columns: Explore.IExploreColumn[];
  handleEditColumn: (
    entity: IEntity,
    columnId: string,
    newEntity: IEntity
  ) => void;

  onRowSelect: (rowId: number, isWithShift?: boolean) => void;
  onExpand: (rowId: number) => void;

  isSelected?: boolean;
  isLastClicked?: boolean;
  isExpanded?: boolean;
}
const ExplorerTableRow: React.FC<ExplorerTableRowProps> = ({
  rowId,
  responseData,
  columns,
  handleEditColumn,

  onRowSelect,
  onExpand,

  isSelected = false,
  isLastClicked = false,
  isExpanded = false,
}) => {
  const themeContext = useContext(ThemeContext);

  const queryClient = useQueryClient();

  const updateEntityMutation = useMutation({
    mutationFn: async (variables: {
      entityId: string;
      changes: Partial<IEntity>;
    }) => await api.entityUpdate(variables.entityId, variables.changes),

    onSuccess: (data, variables) => {
      queryClient.invalidateQueries({
        queryKey: ["query"],
      });
    },
  });

  if (!responseData) {
    return (
      <>
        <div
          style={{
            display: "flex",
            gap: "0.5rem",
            justifyContent: "start",
            marginLeft: "2.5rem",
            color: themeContext?.color["primary"],
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

  const handleUnlinkEntity = (
    sourceEntity: IEntity,
    entityToRemove: IEntity,
    columnId: string
  ) => {
    const column = columns.find((column) => column.id === columnId);

    if (column?.type === Explore.EExploreColumnType.EPT) {
      const newEntity = deleteProp(sourceEntity, {
        typeEntityId: entityToRemove.id,
      });

      updateEntityMutation.mutate({
        entityId: sourceEntity.id,
        changes: {
          props: newEntity.props,
        },
      });
    }

    if (column?.type === Explore.EExploreColumnType.EPV) {
      const newEntity = deleteProp(sourceEntity, {
        valueEntityId: entityToRemove.id,
      });

      updateEntityMutation.mutate({
        entityId: sourceEntity.id,
        changes: {
          props: newEntity.props,
        },
      });
    }
  };

  const renderCellValue = (
    cellValue: IEntity | number | string | IUser,
    recordEntity: IEntity,
    column: Explore.IExploreColumn
  ): React.ReactElement => {
    if (typeof (cellValue as IEntity)?.class !== "undefined") {
      return (
        <EntityTag
          entity={cellValue as IEntity}
          unlinkButton={
            column.editable && {
              onClick: () => {
                handleUnlinkEntity(
                  recordEntity,
                  cellValue as IEntity,
                  column.id
                );
              },
            }
          }
          disableDoubleClick
        />
      );
    } else if (typeof (cellValue as IUser)?.email !== "undefined") {
      // is type IUser[]
      return (
        <StyledUserTag>
          <FaUserAlt
            size={14}
            // onClick={() => setUserCustomizationOpen(true)}
          />
          <span>{(cellValue as IUser).name}</span>
        </StyledUserTag>
      );
    } else {
      return (
        <div>
          <span>{cellValue as string}</span>
        </div>
      );
    }
  };

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
      return cellData.map((cellEntity, key) => {
        return (
          <React.Fragment key={key}>
            {renderCellValue(cellEntity, recordEntity, column)}
          </React.Fragment>
        );
      });
    } else {
      return renderCellValue(cellData, recordEntity, column);
    }
  };

  return (
    <React.Fragment>
      <StyledColumn
        $width={WIDTH_COLUMN_FIRST}
        style={
          {
            // TODO make it stick the left side
            // display: "sticky",
          }
        }
      >
        <StyledCheckboxWrapper
          onClick={(e) => {
            e.stopPropagation();
            onRowSelect(rowId, e.shiftKey);
          }}
        >
          {isLastClicked && <StyledFocusedCircle />}
          {isSelected ? (
            <MdOutlineCheckBox />
          ) : (
            <MdOutlineCheckBoxOutlineBlank />
          )}
        </StyledCheckboxWrapper>

        <div
          style={{
            cursor: "pointer",
            display: "flex",
            alignItems: "center",
          }}
          onClick={() => {
            onExpand(rowId);
          }}
        >
          {isExpanded ? (
            <FaChevronCircleUp color={themeContext?.color.warning} />
          ) : (
            <FaChevronCircleDown color={themeContext?.color.primary} />
          )}
        </div>

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
