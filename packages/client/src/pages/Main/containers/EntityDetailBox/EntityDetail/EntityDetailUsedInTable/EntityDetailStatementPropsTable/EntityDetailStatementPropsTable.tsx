import { EntityEnums } from "@shared/enums";
import { IEntity, IStatement } from "@shared/types";
import { IResponseUsedInStatementProps } from "@shared/types/response-detail";
import { Button } from "components";
import { EntityTag } from "components/advanced";
import { useSearchParams } from "hooks";
import React from "react";
import { FixedSizeList as List } from "react-window";
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
  };
}

const RowRenderer: React.FC<RowRendererProps> = ({ index, style, data }) => {
  const { useCases, entities, handleEditClick } = data;
  const useCase = useCases[index];

  if (!useCase) return null;

  const statementEntity = entities[useCase.statementId];
  const originEntity = entities[useCase.originId];
  const typeEntity = entities[useCase.typeId];
  const valueEntity = entities[useCase.valueId];
  const isLevel1 = useCase.lvl === 1;

  return (
    <div style={style}>
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
            itemSize={30}
            itemData={{
              useCases,
              entities,
              handleEditClick,
            }}
          >
            {RowRenderer}
          </List>
        </StyledTableWrapper>
      )}
    </>
  );
};
