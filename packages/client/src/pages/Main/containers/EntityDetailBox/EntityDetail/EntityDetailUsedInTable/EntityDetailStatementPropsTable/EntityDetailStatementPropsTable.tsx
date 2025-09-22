import { EntityEnums } from "@shared/enums";
import { IEntity, IStatement } from "@shared/types";
import { IResponseUsedInStatementProps } from "@shared/types/response-detail";
import { Button } from "components";
import { EntityTag } from "components/advanced";
import { useSearchParams, useTheme } from "hooks";
import React, { useMemo } from "react";
import { VariableSizeList as List } from "react-window";
import { FaEdit } from "react-icons/fa";
import { renderEntityTag } from "../EntityDetailUsedInTableUtils";
import {
  StyledHeading,
  StyledTableHeader,
  StyledTableRow,
  StyledTableWrapper,
  StyledTagWrapper,
  StyledUsedInTitle,
  TreeLineContainer,
} from "./EntityDetailStatementPropsTableStyles";

interface EntityDetailStatementPropsTable {
  title: { singular: string; plural: string };
  entities: { [key: string]: IEntity };
  useCases: IResponseUsedInStatementProps[];
  perPage?: number;
}

interface RowRendererProps {
  index: number;
  style: React.CSSProperties;
  data: {
    useCases: IResponseUsedInStatementProps[];
    entities: { [key: string]: IEntity };
    handleEditClick: (statementId: string) => void;
    separatorHeight: number;
  };
}

const RowRenderer: React.FC<RowRendererProps> = ({ index, style, data }) => {
  const { useCases, entities, handleEditClick, separatorHeight } = data;
  const useCase = useCases[index];

  if (!useCase) return null;

  const statementEntity = entities[useCase.statementId];
  const originEntity = entities[useCase.originId];
  const typeEntity = entities[useCase.typeId];
  const valueEntity = entities[useCase.valueId];
  const isLevel1 = useCase.lvl === 1;

  // Check if this is the first item
  const isFirstItem = index === 0;
  const shouldShowSeparator = isLevel1 && !isFirstItem;
  const theme = useTheme();

  return (
    <div style={style}>
      {shouldShowSeparator && (
        <div
          style={{
            height: `${separatorHeight}px`,
            backgroundColor: theme.color.gray[200],
          }}
        />
      )}
      <TreeLineContainer
        $isLevel1={isLevel1}
        $marginLeft={isLevel1 ? 0 : (useCase.lvl - 1) * 1.5}
      >
        <StyledTableRow $isLevel1={isLevel1} $marginLeft={0}>
          <StyledTagWrapper>
            {statementEntity && (
              <EntityTag key={index} entity={statementEntity} />
            )}
          </StyledTagWrapper>
          <div>{originEntity && renderEntityTag(originEntity)}</div>
          <div>{typeEntity && renderEntityTag(typeEntity)}</div>
          <div>{valueEntity && renderEntityTag(valueEntity)}</div>
          <div style={{ display: "flex", justifyContent: "center" }}>
            {statementEntity && (
              <Button
                icon={<FaEdit size={14} />}
                color="primary"
                inverted
                noBorder
                noBackground
                tooltipLabel="edit statement"
                onClick={() => handleEditClick(useCase.statementId)}
              />
            )}
          </div>
        </StyledTableRow>
      </TreeLineContainer>
    </div>
  );
};

export const EntityDetailStatementPropsTable: React.FC<
  EntityDetailStatementPropsTable
> = ({ title, entities, useCases, perPage = 5 }) => {
  const separatorHeight = 3;

  const { setStatementId, setTerritoryId } = useSearchParams();

  const handleEditClick = async (statementId: string) => {
    const entity = entities[statementId];
    if (entity && entity.class === EntityEnums.Class.Statement) {
      const statement = entity as IStatement;
      if (statement.data.territory) {
        setStatementId(statement.id);
        setTerritoryId(statement.data.territory.territoryId);
      }
    }
  };

  // Calculate item sizes with separators
  const itemSizes = useMemo(() => {
    const baseRowHeight = 30; // 3rem = 30px

    return useCases.map((useCase, index) => {
      const isLevel1 = useCase.lvl === 1;
      const isFirstItem = index === 0;
      const shouldShowSeparator = isLevel1 && !isFirstItem;

      return baseRowHeight + (shouldShowSeparator ? separatorHeight : 0);
    });
  }, [useCases]);

  // Calculate total height for the visible window
  // const totalHeight = useMemo(() => {
  //   const visibleItems = Math.min(perPage, useCases.length);
  //   let height = 0;
  //   for (let i = 0; i < visibleItems; i++) {
  //     height += itemSizes[i] || 30;
  //   }
  //   return height;
  // }, [perPage, useCases.length, itemSizes]);

  return (
    <>
      {useCases.length > 0 && (
        <StyledTableWrapper>
          <StyledHeading>
            {
              <StyledUsedInTitle>
                <b>{`${useCases.length} `}</b>{" "}
                {`${useCases.length === 1 ? title.singular : title.plural}`}
              </StyledUsedInTitle>
            }
          </StyledHeading>

          <StyledTableHeader>
            <div>Statement</div>
            <div>Origin</div>
            <div>Type</div>
            <div>Value</div>
            <div>{/* Actions */}</div>
          </StyledTableHeader>

          <List
            height={perPage * 30}
            width="100%"
            itemCount={useCases.length}
            itemSize={(index) => itemSizes[index] || 30}
            itemData={{
              useCases,
              entities,
              handleEditClick,
              separatorHeight,
            }}
          >
            {RowRenderer}
          </List>
        </StyledTableWrapper>
      )}
    </>
  );
};
