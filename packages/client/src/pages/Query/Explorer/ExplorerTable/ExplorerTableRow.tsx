import { classesAll } from "@shared/dictionaries/entity";
import { IEntity, IResponseQueryEntity, IUser } from "@shared/types";
import { Explore } from "@shared/types/query";
import { EntitySuggester, EntityTag } from "components/advanced";
import React, { useContext } from "react";
import { FaChevronCircleDown, FaChevronCircleUp } from "react-icons/fa";
import {
  MdOutlineCheckBox,
  MdOutlineCheckBoxOutlineBlank,
} from "react-icons/md";
import { BeatLoader } from "react-spinners";
import { ThemeContext } from "styled-components";
import {
  StyledCheckboxWrapper,
  StyledColumn,
  StyledColumnContent,
  StyledFocusedCircle,
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
  updateEntityMutation: any;

  onCheckboxClick: (
    e: React.MouseEvent<HTMLDivElement, MouseEvent>,
    rowId: number,
    entityId: string
  ) => void;

  isSelected?: boolean;
  isLastClicked?: boolean;
  isExpanded?: boolean;
}
const ExplorerTableRow: React.FC<ExplorerTableRowProps> = ({
  rowId,
  responseData,
  columns,
  handleEditColumn,
  updateEntityMutation,

  onCheckboxClick,

  isSelected = false,
  isLastClicked = false,
  isExpanded = false,
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
            onCheckboxClick(e, rowId, rowEntity.id);
          }}
        >
          {isLastClicked && <StyledFocusedCircle checked={isSelected} />}
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
