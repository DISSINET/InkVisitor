import { languageDict } from "@shared/dictionaries";
import { EntityEnums } from "@shared/enums";
import { IEntity, IProp } from "@shared/types";
import { Explore } from "@shared/types/query";
import { ITerritoryValidation } from "@shared/types/territory";
import { useQuery } from "@tanstack/react-query";
import api from "api";
import { Button, Input, Loader } from "components";
import Dropdown, {
  AuditTable,
  EntityTag,
  JSONExplorer,
} from "components/advanced";
import { EntityDetailProtocol } from "pages/Main/containers/EntityDetailBox/EntityDetail/EntityDetailProtocol/EntityDetailProtocol";
import { EntityDetailRelations } from "pages/Main/containers/EntityDetailBox/EntityDetail/EntityDetailRelations/EntityDetailRelations";
import { EntityDetailClassificationTable } from "pages/Main/containers/EntityDetailBox/EntityDetail/EntityDetailUsedInTable/EntityDetailClassificationTable/EntityDetailClassificationTable";
import { EntityDetailIdentificationTable } from "pages/Main/containers/EntityDetailBox/EntityDetail/EntityDetailUsedInTable/EntityDetailIdentificationTable/EntityDetailIdentificationTable";
import { EntityDetailMetaPropsTable } from "pages/Main/containers/EntityDetailBox/EntityDetail/EntityDetailUsedInTable/EntityDetailMetaPropsTable/EntityDetailMetaPropsTable";
import { EntityDetailStatementPropsTable } from "pages/Main/containers/EntityDetailBox/EntityDetail/EntityDetailUsedInTable/EntityDetailStatementPropsTable/EntityDetailStatementPropsTable";
import { EntityDetailStatementsTable } from "pages/Main/containers/EntityDetailBox/EntityDetail/EntityDetailUsedInTable/EntityDetailStatementsTable/EntityDetailStatementsTable";
import { EntityDetailValidationSection } from "pages/Main/containers/EntityDetailBox/EntityDetail/EntityDetailValidationSection/EntityDetailValidationSection";
import React from "react";
import { FaRegCopy } from "react-icons/fa";
import { toast } from "react-toastify";
import {
  ColumnsContainer,
  StyledExpandedRow,
  StyledExpRowFormGrid,
  StyledExpRowFormGridColumnLabel,
  StyledExpRowFormGridColumnValueID,
  StyledExpRowSection,
  StyledExpRowSectionContent,
  StyledExpRowSectionHeader,
} from "../ExplorerTableStyles";
import { StatementListRowExpandedPropGroup } from "pages/Main/containers/StatementsListBox/StatementListTable/StatementListRowExpanded/StatementListRowExpandedPropGroup";

interface ExplorerTableRowExpanded {
  rowEntity: IEntity;
  columns: Explore.IExploreColumn[];
}
export const ExplorerTableRowExpanded: React.FC<ExplorerTableRowExpanded> = ({
  rowEntity,
  columns,
}) => {
  const {
    status,
    data: entity,
    error: entityError,
    isFetching,
  } = useQuery({
    queryKey: ["entity", rowEntity.id],
    queryFn: async () => {
      const res = await api.detailGet(rowEntity.id);
      return res.data;
    },
    enabled: !!rowEntity.id && api.isLoggedIn(),
  });

  // Audit query
  const {
    status: statusAudit,
    data: audit,
    error: auditError,
    isFetching: isFetchingAudit,
  } = useQuery({
    queryKey: ["audit", rowEntity.id],
    queryFn: async () => {
      const res = await api.auditGet(rowEntity.id);
      return res.data;
    },
    enabled: !!rowEntity.id && api.isLoggedIn(),
  });

  const {
    id,
    label,
    detail,
    language,
    notes,
    references,
    props,
    updatedAt,
    data,
  } = rowEntity;

  const renderFirstLevelProps = (
    props: IProp[],
    entities: Record<string, IEntity>
  ) => {
    return (
      <div style={{ display: "grid" }}>
        <StatementListRowExpandedPropGroup
          level={1}
          props={props}
          entities={entities}
          renderChildrenPropRow={(childProps) =>
            renderSecondLevelProps(childProps, entities)
          }
        />
      </div>
    );
  };

  const renderSecondLevelProps = (
    props: IProp[],
    entities: Record<string, IEntity>
  ) => {
    return (
      <div style={{ display: "grid" }}>
        <StatementListRowExpandedPropGroup
          level={2}
          props={props}
          entities={entities}
          renderChildrenPropRow={(childProps) =>
            renderThirdLevelProps(childProps, entities)
          }
        />
      </div>
    );
  };

  const renderThirdLevelProps = (
    props: IProp[],
    entities: Record<string, IEntity>
  ) => {
    return (
      <div style={{ display: "grid" }}>
        <StatementListRowExpandedPropGroup
          level={3}
          props={props}
          entities={entities}
        />
      </div>
    );
  };

  return (
    <StyledExpandedRow $columnsSpan={columns.length + 2}>
      <ColumnsContainer>
        <StyledExpRowSection>
          <StyledExpRowSectionHeader>Information</StyledExpRowSectionHeader>
          <StyledExpRowFormGrid>
            <StyledExpRowFormGridColumnLabel>
              ID:
            </StyledExpRowFormGridColumnLabel>
            <StyledExpRowFormGridColumnValueID>
              {id}
              <Button
                inverted
                tooltipLabel="copy ID"
                color="primary"
                label=""
                icon={<FaRegCopy />}
                onClick={async () => {
                  await navigator.clipboard.writeText(id);
                  toast.info("ID copied to clipboard");
                }}
              />
            </StyledExpRowFormGridColumnValueID>
            <StyledExpRowFormGridColumnLabel>
              Label:
            </StyledExpRowFormGridColumnLabel>
            <div>
              <Input
                width="full"
                value={label}
                disabled
                onChangeFn={() => {}}
              />
            </div>
            <StyledExpRowFormGridColumnLabel>
              Detail:
            </StyledExpRowFormGridColumnLabel>
            <div>
              <Input
                width="full"
                value={detail}
                disabled
                onChangeFn={() => {}}
              />
            </div>
            <StyledExpRowFormGridColumnLabel>
              Language:
            </StyledExpRowFormGridColumnLabel>
            <div>
              <Dropdown.Single.Basic
                disabled
                width="full"
                options={languageDict}
                value={language}
                onChange={(selectedOption) => {}}
              />
            </div>
            <StyledExpRowFormGridColumnLabel>
              Notes:
            </StyledExpRowFormGridColumnLabel>
            <div>
              {notes.map((note, key) => {
                return (
                  <span key={key}>
                    <Input
                      value={note}
                      width="full"
                      disabled
                      type="textarea"
                      onChangeFn={() => {}}
                    />
                  </span>
                );
              })}
            </div>
          </StyledExpRowFormGrid>
        </StyledExpRowSection>
        {rowEntity.class === EntityEnums.Class.Territory && (
          <>
            {/* Protocol */}
            <StyledExpRowSection>
              <StyledExpRowSectionHeader>Protocol</StyledExpRowSectionHeader>
              <StyledExpRowSectionContent>
                {entity && (
                  <EntityDetailProtocol
                    territory={entity}
                    // to make it editable, this needs to be implemented
                    // updateEntityMutation={updateEntityMutation}
                    // isInsideTemplate={isInsideTemplate}
                    userCanEdit={false}
                  />
                )}
                <Loader show={isFetching} size={40} />
              </StyledExpRowSectionContent>
            </StyledExpRowSection>

            {/* Validation rules */}
            <StyledExpRowSection>
              <StyledExpRowSectionHeader>
                Validation rules
              </StyledExpRowSectionHeader>
              <StyledExpRowSectionContent>
                {entity && (
                  <EntityDetailValidationSection
                    validations={
                      entity.data.validations as
                        | ITerritoryValidation[]
                        | undefined
                    }
                    entities={entity.entities}
                    userCanEdit={false}
                    // entity={entity}
                    // updateEntityMutation={updateEntityMutation}
                    // isInsideTemplate={isInsideTemplate}
                    // territoryParentId={getTerritoryId(entity)}
                    // setLoadingValidations={setLoadingValidations}
                  />
                )}
                <Loader show={isFetching} size={40} />
              </StyledExpRowSectionContent>
            </StyledExpRowSection>
          </>
        )}
        {/* Relations */}
        <StyledExpRowSection>
          <StyledExpRowSectionHeader>Relations</StyledExpRowSectionHeader>
          <StyledExpRowSectionContent>
            {entity && (
              <EntityDetailRelations
                entity={entity}
                // to switch userCanEdit={true}, mutations needs to be sent to props
                userCanEdit={false}
              />
            )}
            <Loader show={isFetching} size={40} />
          </StyledExpRowSectionContent>
        </StyledExpRowSection>

        {/* Metaproperties */}
        <StyledExpRowSection>
          <StyledExpRowSectionHeader>Metaproperties</StyledExpRowSectionHeader>
          <StyledExpRowSectionContent>
            {entity && renderFirstLevelProps(entity.props, entity.entities)}

            <Loader show={isFetching} size={40} />
          </StyledExpRowSectionContent>
        </StyledExpRowSection>

        <>
          {/* References */}
          <StyledExpRowSection>
            <StyledExpRowSectionHeader>References</StyledExpRowSectionHeader>
            <StyledExpRowSectionContent>
              {entity &&
                references.map((reference, key) => {
                  return (
                    <div
                      style={{
                        display: "inline-grid",
                        gridTemplateColumns: "auto auto",
                        gap: "0.5rem",
                      }}
                      key={key}
                    >
                      <span>
                        <EntityTag
                          entity={entity.entities[reference.resource]}
                        />
                      </span>
                      <span>
                        <EntityTag entity={entity.entities[reference.value]} />
                      </span>
                    </div>
                  );
                })}

              <Loader show={isFetching} size={40} />
            </StyledExpRowSectionContent>
          </StyledExpRowSection>

          {/* Used in */}
          <StyledExpRowSection>
            <StyledExpRowSectionHeader>Used In:</StyledExpRowSectionHeader>
            <StyledExpRowSectionContent>
              {entity && (
                <>
                  {/* usedIn props */}
                  {!entity.isTemplate && (
                    <EntityDetailMetaPropsTable
                      title={{
                        singular: "Metaproperty",
                        plural: "Metaproperties",
                      }}
                      entities={entity.entities}
                      useCases={entity.usedInMetaProps}
                      key="MetaProp"
                      perPage={10}
                    />
                  )}
                  {/* usedIn statements */}
                  {!entity.isTemplate && (
                    <EntityDetailStatementsTable
                      title={{ singular: "Statement", plural: "Statements" }}
                      entities={entity.entities}
                      useCases={entity.usedInStatements}
                      key="Statement"
                      perPage={10}
                    />
                  )}

                  {/* usedIn statement props */}
                  {!entity.isTemplate && (
                    <EntityDetailStatementPropsTable
                      title={{
                        singular: "In-statement Property",
                        plural: "In-statement Properties",
                      }}
                      entities={entity.entities}
                      useCases={entity.usedInStatementProps}
                      key="StatementProp"
                      perPage={10}
                    />
                  )}

                  {/* usedIn statement identification */}
                  {!entity.isTemplate && (
                    <EntityDetailIdentificationTable
                      title={{
                        singular: "In-statement Identification",
                        plural: "In-statement Identifications",
                      }}
                      entities={entity.entities}
                      useCases={entity.usedInStatementIdentifications}
                      key="StatementIdentification"
                      perPage={10}
                    />
                  )}

                  {/* usedIn statement classification */}
                  {!entity.isTemplate && (
                    <EntityDetailClassificationTable
                      title={{
                        singular: "In-statement Classification",
                        plural: "In-statement Classifications",
                      }}
                      entities={entity.entities}
                      useCases={entity.usedInStatementClassifications}
                      key="StatementClassification"
                      perPage={10}
                    />
                  )}
                </>
              )}

              <Loader show={isFetching} size={40} />
            </StyledExpRowSectionContent>
          </StyledExpRowSection>

          {/* Audits */}
          {/* <StyledExpRowSection>
            <StyledExpRowSectionHeader>Audits</StyledExpRowSectionHeader>
            <StyledExpRowSectionContent>
              {audit && <AuditTable {...audit} />}
              <Loader show={isFetchingAudit} size={40} />
            </StyledExpRowSectionContent>
          </StyledExpRowSection> */}

          {/* JSON */}
          {/* <StyledExpRowSection>
            <StyledExpRowSectionHeader>JSON</StyledExpRowSectionHeader>
            <StyledExpRowSectionContent>
              {entity && <JSONExplorer data={entity} />}
              <Loader show={isFetching} size={40} />
            </StyledExpRowSectionContent>
          </StyledExpRowSection> */}
        </>
      </ColumnsContainer>
    </StyledExpandedRow>
  );
};
