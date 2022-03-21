import { EntityClass } from "@shared/enums";
import { IEntity } from "@shared/types";
import { Button } from "components";
import { useSearchParams } from "hooks";
import React, { useMemo, useState } from "react";
import { FaEdit, FaStepBackward, FaStepForward } from "react-icons/fa";
import { EntityTag } from "..";
import {
  StyledDetailHeaderColumn,
  StyledDetailSection,
  StyledDetailSectionContentUsedIn,
  StyledDetailSectionHeader,
  StyledDetailSectionMetaTableButtonGroup,
  StyledDetailSectionMetaTableCell,
  StyledDetailSectionUsedPageManager,
  StyledDetailSectionUsedTable,
  StyledDetailSectionUsedTableCell,
  StyledDetailSectionUsedText,
} from "./EntityDetailBoxStyles";

interface EntityDetailBoxTable {
  title: string;
  entities: { [key: string]: IEntity };
  useCases: any[];
  mode: "Prop" | "Statement" | "StatementProp";
  perPage?: number;
}
export const EntityDetailBoxTable: React.FC<EntityDetailBoxTable> = ({
  title,
  entities,
  useCases,
  mode,
  perPage = 20,
}) => {
  const [usedInPage, setUsedInPage] = useState<number>(0);

  const noPages = useMemo(() => {
    return Math.ceil(useCases.length / perPage);
  }, [useCases, perPage]);

  const { detailId, setDetailId, setStatementId, territoryId, setTerritoryId } =
    useSearchParams();

  return (
    <StyledDetailSection key={title}>
      <StyledDetailSectionHeader>{title}:</StyledDetailSectionHeader>
      <StyledDetailSectionContentUsedIn>
        {`number of occurences ${useCases.length}`}
      </StyledDetailSectionContentUsedIn>
      <StyledDetailSectionContentUsedIn>
        <StyledDetailSectionUsedPageManager>
          <StyledDetailSectionUsedTable>
            {`Page ${usedInPage + 1} / ${noPages}`}
            <Button
              key="previous"
              disabled={usedInPage === 0}
              icon={<FaStepBackward size={14} />}
              color="primary"
              tooltip="previous page"
              onClick={() => {
                if (usedInPage !== 0) {
                  setUsedInPage(usedInPage - 1);
                }
              }}
            />
            <Button
              key="next"
              disabled={usedInPage === noPages - 1}
              icon={<FaStepForward size={14} />}
              color="primary"
              tooltip="next page"
              onClick={() => {
                if (usedInPage !== noPages - 1) {
                  setUsedInPage(usedInPage + 1);
                }
              }}
            />
          </StyledDetailSectionUsedTable>
        </StyledDetailSectionUsedPageManager>
        <StyledDetailSectionUsedTable>
          <StyledDetailHeaderColumn></StyledDetailHeaderColumn>
          <StyledDetailHeaderColumn>
            {mode !== "Prop" ? "Text" : ""}
          </StyledDetailHeaderColumn>
          <StyledDetailHeaderColumn>Position</StyledDetailHeaderColumn>
          <StyledDetailHeaderColumn></StyledDetailHeaderColumn>
          {useCases.map((useCase, ui) => {
            const position = useCase.position;
            const entityId =
              mode === "Prop" ? useCase.entityId : useCase.statement?.id;
            const entity = entityId ? entities[entityId] : false;

            return entity ? (
              <React.Fragment key={ui}>
                <StyledDetailSectionUsedTableCell>
                  <EntityTag
                    key={entity.id}
                    actant={entity}
                    showOnly="entity"
                    tooltipText={entity.label}
                  />
                </StyledDetailSectionUsedTableCell>
                <StyledDetailSectionUsedTableCell>
                  <StyledDetailSectionUsedText>
                    {entity.class === EntityClass.Statement
                      ? entity.data.text
                      : ""}
                  </StyledDetailSectionUsedText>
                </StyledDetailSectionUsedTableCell>
                <StyledDetailSectionUsedTableCell>
                  <StyledDetailSectionUsedText>
                    {position}
                  </StyledDetailSectionUsedText>
                </StyledDetailSectionUsedTableCell>
                <StyledDetailSectionMetaTableCell borderless>
                  <StyledDetailSectionMetaTableButtonGroup>
                    {entity.data.territory?.id && (
                      <Button
                        key="e"
                        icon={<FaEdit size={14} />}
                        color="plain"
                        tooltip="edit statement"
                        onClick={async () => {
                          if (entity.data.territory) {
                            setStatementId(entity.id);
                            setTerritoryId(entity.data.territory.id);
                          }
                        }}
                      />
                    )}
                  </StyledDetailSectionMetaTableButtonGroup>
                </StyledDetailSectionMetaTableCell>
              </React.Fragment>
            ) : (
              <div key={ui} />
            );
          })}
        </StyledDetailSectionUsedTable>
      </StyledDetailSectionContentUsedIn>
    </StyledDetailSection>
  );
};
