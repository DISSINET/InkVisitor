import { EntityClass } from "@shared/enums";
import { IEntity } from "@shared/types";
import { Button, Tooltip } from "components";
import { useSearchParams } from "hooks";
import React, { useMemo, useState } from "react";
import { FaEdit, FaStepBackward, FaStepForward } from "react-icons/fa";
import { EntityTag } from "..";
import {
  StyledDetailSectionContentUsedIn,
  StyledDetailSectionContentUsedInTitle,
  StyledDetailSectionMetaTableButtonGroup,
  StyledDetailSectionMetaTableCell,
  StyledDetailSectionUsedPageManager,
  StyledDetailSectionUsedTable,
  StyledDetailSectionUsedTableCell,
  StyledDetailSectionUsedTableRow,
  StyledDetailSectionUsedText,
} from "./EntityDetailBoxStyles";

interface EntityDetailBoxTable {
  title: { singular: string; plural: string };
  entities: { [key: string]: IEntity };
  useCases: any[];
  mode: "MetaProp" | "Statement" | "StatementProp";
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
    <>
      <StyledDetailSectionContentUsedIn>
        <StyledDetailSectionContentUsedInTitle>
          <b>{`${useCases.length} `}</b>{" "}
          {`${useCases.length === 1 ? title.singular : title.plural}`}
        </StyledDetailSectionContentUsedInTitle>
      </StyledDetailSectionContentUsedIn>
      <StyledDetailSectionContentUsedIn>
        <StyledDetailSectionUsedTable>
          {useCases.map((useCase, ui) => {
            const position = useCase.position;
            const entityId =
              mode === "MetaProp" ? useCase.entityId : useCase.statement?.id;
            const entity = entityId ? entities[entityId] : false;

            return entity ? (
              <React.Fragment key={ui}>
                <StyledDetailSectionUsedTableRow>
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
                    <Tooltip label="position">
                      <StyledDetailSectionUsedText
                        style={{ cursor: "pointer" }}
                      >
                        {position}
                      </StyledDetailSectionUsedText>
                    </Tooltip>
                  </StyledDetailSectionUsedTableCell>
                  <StyledDetailSectionMetaTableCell borderless>
                    <StyledDetailSectionMetaTableButtonGroup>
                      {entity.data.territory?.id && (
                        <React.Fragment>
                          <Button
                            key="e"
                            icon={<FaEdit size={14} />}
                            color="primary"
                            inverted
                            noBorder
                            tooltip="edit statement"
                            onClick={async () => {
                              if (entity.data.territory) {
                                setStatementId(entity.id);
                                setTerritoryId(entity.data.territory.id);
                              }
                            }}
                          />
                        </React.Fragment>
                      )}
                    </StyledDetailSectionMetaTableButtonGroup>
                  </StyledDetailSectionMetaTableCell>
                </StyledDetailSectionUsedTableRow>
              </React.Fragment>
            ) : (
              <div key={ui} />
            );
          })}
        </StyledDetailSectionUsedTable>
        {useCases.length > perPage && (
          <StyledDetailSectionUsedPageManager>
            {`Page ${usedInPage + 1} / ${noPages}`}
            <Button
              key="previous"
              disabled={usedInPage === 0}
              icon={<FaStepBackward size={12} />}
              color="plain"
              inverted
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
              icon={<FaStepForward size={12} />}
              color="plain"
              inverted
              tooltip="next page"
              onClick={() => {
                if (usedInPage !== noPages - 1) {
                  setUsedInPage(usedInPage + 1);
                }
              }}
            />
          </StyledDetailSectionUsedPageManager>
        )}
      </StyledDetailSectionContentUsedIn>
    </>
  );
};
