import { EntityEnums } from "@shared/enums";
import { IEntity, IStatement } from "@shared/types";
import { IResponseUsedInStatementProps } from "@shared/types/response-detail";
import { Button } from "components";
import { EntityTag } from "components/advanced";
import { useSearchParams } from "hooks";
import React, { useMemo } from "react";
import { FaEdit } from "react-icons/fa";
import { renderEntityTag } from "../EntityDetailUsedInTableUtils";
import {
  StyledHeading,
  StyledTableHeader,
  StyledTableRow,
  StyledTableWrapper,
  StyledTagWrapper,
  StyledUsedInTitle,
} from "./EntityDetailStatementPropsTableStyles";

interface EntityDetailStatementPropsTable {
  title: { singular: string; plural: string };
  entities: { [key: string]: IEntity };
  useCases: IResponseUsedInStatementProps[];
  perPage?: number;
}

interface StatementGroup {
  level1: IResponseUsedInStatementProps;
  children: IResponseUsedInStatementProps[];
}

export const EntityDetailStatementPropsTable: React.FC<
  EntityDetailStatementPropsTable
> = ({ title, entities, useCases, perPage = 5 }) => {
  const { setStatementId, setTerritoryId } = useSearchParams();

  // Group the data by level 1 statement props
  const groupedData = useMemo(() => {
    const data = useCases ? useCases : [];
    const groups: StatementGroup[] = [];

    data.forEach((useCase) => {
      if (useCase.lvl === 1) {
        // Start a new group
        groups.push({
          level1: useCase,
          children: [],
        });
      } else if (groups.length > 0) {
        // Add to the last group
        groups[groups.length - 1].children.push(useCase);
      }
    });

    return groups;
  }, [useCases]);

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

  const renderStatementRow = (
    useCase: IResponseUsedInStatementProps,
    isLevel1: boolean = false
  ) => {
    const statementEntity = entities[useCase.statementId];
    const originEntity = entities[useCase.originId];
    const typeEntity = entities[useCase.typeId];
    const valueEntity = entities[useCase.valueId];

    return (
      <StyledTableRow
        key={`${useCase.statementId}-${useCase.lvl}`}
        $isLevel1={isLevel1}
        marginLeft={isLevel1 ? 0 : (useCase.lvl - 1) * 1.5}
      >
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
              tooltipLabel="edit statement"
              onClick={() => handleEditClick(useCase.statementId)}
            />
          )}
        </div>
      </StyledTableRow>
    );
  };

  return (
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
        {groupedData.map((group, groupIndex) => (
          <div key={groupIndex} style={{ marginBottom: "1rem" }}>
            {renderStatementRow(group.level1, true)}
            {group.children.map((child) => renderStatementRow(child))}
          </div>
        ))}
      </div>
    </StyledTableWrapper>
  );
};
