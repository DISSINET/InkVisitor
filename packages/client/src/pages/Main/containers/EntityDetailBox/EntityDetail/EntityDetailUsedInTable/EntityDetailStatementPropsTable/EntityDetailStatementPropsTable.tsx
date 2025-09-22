import { EntityEnums } from "@shared/enums";
import { IEntity, IStatement } from "@shared/types";
import { IResponseUsedInStatementProps } from "@shared/types/response-detail";
import { Button } from "components";
import { EntityTag } from "components/advanced";
import { useSearchParams } from "hooks";
import React from "react";
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

  const renderStatementRow = (useCase: IResponseUsedInStatementProps) => {
    const statementEntity = entities[useCase.statementId];
    const originEntity = entities[useCase.originId];
    const typeEntity = entities[useCase.typeId];
    const valueEntity = entities[useCase.valueId];
    const isLevel1 = useCase.lvl === 1;

    return (
      <TreeLineContainer
        key={`${useCase.statementId}-${useCase.lvl}`}
        $isLevel1={isLevel1}
        $marginLeft={isLevel1 ? 0 : (useCase.lvl - 1) * 1.5}
      >
        <StyledTableRow $isLevel1={isLevel1} marginLeft={0}>
          <StyledTagWrapper>
            {statementEntity && (
              <EntityTag key={statementEntity.id} entity={statementEntity} />
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
    );
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

          <div style={{ maxHeight: `${perPage * 4}rem`, overflowY: "auto" }}>
            {useCases.map((useCase) => renderStatementRow(useCase))}
          </div>
        </StyledTableWrapper>
      )}
    </>
  );
};
