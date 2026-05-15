import { languageDict } from "@shared/dictionaries";
import { EntityEnums } from "@shared/enums";
import { IEntity, IProp, IResponseDetail } from "@shared/types";
import { Button, Input, Loader } from "components";
import Dropdown, { EntityTag } from "components/advanced";
import { EntityDetailProtocol } from "pages/Main/containers/EntityDetailBox/EntityDetail/EntityDetailProtocol/EntityDetailProtocol";
import { EntityDetailRelations } from "pages/Main/containers/EntityDetailBox/EntityDetail/EntityDetailRelations/EntityDetailRelations";
import { EntityDetailClassificationTable } from "pages/Main/containers/EntityDetailBox/EntityDetail/EntityDetailUsedInTable/EntityDetailClassificationTable/EntityDetailClassificationTable";
import { EntityDetailIdentificationTable } from "pages/Main/containers/EntityDetailBox/EntityDetail/EntityDetailUsedInTable/EntityDetailIdentificationTable/EntityDetailIdentificationTable";
import { EntityDetailMetaPropsTable } from "pages/Main/containers/EntityDetailBox/EntityDetail/EntityDetailUsedInTable/EntityDetailMetaPropsTable/EntityDetailMetaPropsTable";
import { EntityDetailStatementPropsTable } from "pages/Main/containers/EntityDetailBox/EntityDetail/EntityDetailUsedInTable/EntityDetailStatementPropsTable/EntityDetailStatementPropsTable";
import { EntityDetailStatementsTable } from "pages/Main/containers/EntityDetailBox/EntityDetail/EntityDetailUsedInTable/EntityDetailStatementsTable/EntityDetailStatementsTable";
import { StatementListRowExpandedPropGroup } from "pages/Main/containers/StatementsListBox/StatementListTable/StatementListRowExpanded/StatementListRowExpandedPropGroup";
import React from "react";
import { FaRegCopy } from "react-icons/fa";
import { toast } from "react-toastify";
import {
  ColumnsContainer,
  StyledDetailFormGrid,
  StyledDetailFormGridColumnLabel,
  StyledDetailFormGridColumnValueID,
  StyledDetailSection,
  StyledDetailSectionContent,
  StyledDetailSectionHeader,
  StyledQueryEntityDetail,
  StyledReferenceRow,
  StyledReferenceTable,
} from "./QueryEntityDetailStyles";

interface QueryEntityDetail {
  entity?: IResponseDetail;
  isFetching: boolean;
}
export const QueryEntityDetail: React.FC<QueryEntityDetail> = ({ entity, isFetching }) => {
  // Audit query
  // const {
  //   status: statusAudit,
  //   data: audit,
  //   error: auditError,
  //   isFetching: isFetchingAudit,
  // } = useQuery({
  //   queryKey: ["audit", entity.id],
  //   queryFn: async () => {
  //     const res = await api.auditGet(entity.id);
  //     return res.data;
  //   },
  //   enabled: !!entity.id && api.isLoggedIn(),
  // });

  const renderFirstLevelProps = (props: IProp[], entities: Record<string, IEntity>) => {
    return (
      <div style={{ display: "grid" }}>
        <StatementListRowExpandedPropGroup
          level={1}
          props={props}
          entities={entities}
          renderChildrenPropRow={(childProps) => renderSecondLevelProps(childProps, entities)}
        />
      </div>
    );
  };

  const renderSecondLevelProps = (props: IProp[], entities: Record<string, IEntity>) => {
    return (
      <div style={{ display: "grid" }}>
        <StatementListRowExpandedPropGroup
          level={2}
          props={props}
          entities={entities}
          renderChildrenPropRow={(childProps) => renderThirdLevelProps(childProps, entities)}
        />
      </div>
    );
  };

  const renderThirdLevelProps = (props: IProp[], entities: Record<string, IEntity>) => {
    return (
      <div style={{ display: "grid" }}>
        <StatementListRowExpandedPropGroup level={3} props={props} entities={entities} />
      </div>
    );
  };

  const isTerritoryWithParent = (entity: IResponseDetail): boolean => {
    return (
      entity.class === EntityEnums.Class.Territory &&
      entity.data.parent &&
      Object.keys(entity.entities).includes(entity.data.parent.territoryId)
    );
  };

  const isStatementWithTerritory = (entity: IResponseDetail): boolean => {
    return (
      entity.class === EntityEnums.Class.Statement &&
      entity.data.territory &&
      Object.keys(entity.entities).includes(entity.data.territory.territoryId)
    );
  };

  const getTerritoryId = (entity: IResponseDetail) => {
    if (isTerritoryWithParent(entity)) {
      return entity.entities[entity.data.parent.territoryId].id;
    } else if (isStatementWithTerritory(entity)) {
      return entity.entities[entity.data.territory.territoryId].id;
    } else {
      return undefined;
    }
  };

  const alternativeLabels = entity?.labels.slice(1);

  return (
    <StyledQueryEntityDetail>
      <ColumnsContainer>
        <StyledDetailSection>
          <StyledDetailSectionHeader>Information</StyledDetailSectionHeader>
          <StyledDetailFormGrid>
            <StyledDetailFormGridColumnLabel>ID:</StyledDetailFormGridColumnLabel>
            <StyledDetailFormGridColumnValueID>
              {entity?.id}
              {entity?.id && (
                <Button
                  inverted
                  tooltipLabel="copy ID"
                  color="primary"
                  label=""
                  icon={<FaRegCopy />}
                  onClick={async () => {
                    await navigator.clipboard.writeText(entity.id);
                    toast.info("ID copied to clipboard");
                  }}
                />
              )}
            </StyledDetailFormGridColumnValueID>
            <StyledDetailFormGridColumnLabel>Label:</StyledDetailFormGridColumnLabel>
            <div>
              <Input
                width="full"
                value={entity?.labels ? entity?.labels[0] : ""}
                disabled
                onChangeFn={() => {}}
              />
            </div>
            <StyledDetailFormGridColumnLabel>Detail:</StyledDetailFormGridColumnLabel>
            <div>
              <Input width="full" value={entity?.detail} disabled onChangeFn={() => {}} />
            </div>
            <StyledDetailFormGridColumnLabel>Language:</StyledDetailFormGridColumnLabel>
            <div>
              <Dropdown.Single.Basic
                disabled
                width="full"
                options={languageDict}
                value={entity?.language ?? null}
                onChange={(selectedOption) => {}}
              />
            </div>
            <StyledDetailFormGridColumnLabel>Notes:</StyledDetailFormGridColumnLabel>
            <div
              style={{
                display: "flex",
                flexDirection: "column",
                gap: "0.5rem",
              }}
            >
              {entity?.notes?.map((note, key) => {
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
            <StyledDetailFormGridColumnLabel>Alternative labels:</StyledDetailFormGridColumnLabel>
            {alternativeLabels?.map((label: string, key: number) => {
              return <>{label}</>;
            })}
          </StyledDetailFormGrid>
        </StyledDetailSection>
        {entity?.class && entity.class === EntityEnums.Class.Territory && (
          <>
            {/* Protocol */}
            <StyledDetailSection>
              <StyledDetailSectionHeader>Protocol</StyledDetailSectionHeader>
              <StyledDetailSectionContent>
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
              </StyledDetailSectionContent>
            </StyledDetailSection>

            {/* Validation rules */}
            <StyledDetailSection>
              <StyledDetailSectionHeader>Validation rules</StyledDetailSectionHeader>
              <StyledDetailSectionContent>
                {/* {entity && (
                  <EntityDetailValidationSection
                    validations={
                      entity.data.validations as
                        | ITerritoryValidation[]
                        | undefined
                    }
                    entities={entity.entities}
                    entity={entity}
                    updateEntityMutation={updateEntityMutation}
                    userCanEdit={false}
                    isInsideTemplate={false}
                    territoryParentId={getTerritoryId(entity)}
                    setLoadingValidations={setLoadingValidations}
                    widthTooNarrow={false}
                  />
                )} */}
                <Loader show={isFetching} size={40} />
              </StyledDetailSectionContent>
            </StyledDetailSection>
          </>
        )}
        {/* Relations */}
        <StyledDetailSection>
          <StyledDetailSectionHeader>Relations</StyledDetailSectionHeader>
          <StyledDetailSectionContent>
            {entity && entity.relations && (
              <EntityDetailRelations
                entity={entity}
                // to switch userCanEdit={true}, mutations needs to be sent to props
                userCanEdit={false}
              />
            )}
            <Loader show={isFetching} size={40} />
          </StyledDetailSectionContent>
        </StyledDetailSection>

        {/* Metaproperties */}
        <StyledDetailSection>
          <StyledDetailSectionHeader>Metaproperties</StyledDetailSectionHeader>
          <StyledDetailSectionContent>
            {entity && renderFirstLevelProps(entity.props, entity.entities)}

            <Loader show={isFetching} size={40} />
          </StyledDetailSectionContent>
        </StyledDetailSection>

        <>
          {/* References */}
          <StyledDetailSection>
            <StyledDetailSectionHeader>References</StyledDetailSectionHeader>
            <StyledDetailSectionContent>
              <StyledReferenceTable>
                {entity &&
                  entity.references?.map((reference, key) => {
                    return (
                      <StyledReferenceRow key={key}>
                        <div style={{ display: "grid" }}>
                          {reference.resource && entity.entities?.[reference.resource] && (
                            <EntityTag fullWidth entity={entity.entities[reference.resource]} />
                          )}
                        </div>
                        <div style={{ display: "grid" }}>
                          {reference.value && entity.entities?.[reference.value] && (
                            <EntityTag fullWidth entity={entity.entities[reference.value]} />
                          )}
                        </div>
                      </StyledReferenceRow>
                    );
                  })}
              </StyledReferenceTable>

              <Loader show={isFetching} size={40} />
            </StyledDetailSectionContent>
          </StyledDetailSection>

          {/* Used in */}
          <StyledDetailSection>
            <StyledDetailSectionHeader>Used In:</StyledDetailSectionHeader>
            <StyledDetailSectionContent>
              {entity && (
                <>
                  {/* usedIn props */}
                  {!entity.isTemplate && entity.usedInMetaProps && (
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
                  {!entity.isTemplate && entity.usedInStatements && (
                    <EntityDetailStatementsTable
                      title={{ singular: "Statement", plural: "Statements" }}
                      entities={entity.entities}
                      useCases={entity.usedInStatements}
                      key="Statement"
                      perPage={10}
                      disableRowClick
                    />
                  )}

                  {/* usedIn statement props */}
                  {!entity.isTemplate && entity.usedInStatementProps && (
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
                  {!entity.isTemplate && entity.usedInStatementIdentifications && (
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
                  {!entity.isTemplate && entity.usedInStatementClassifications && (
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
            </StyledDetailSectionContent>
          </StyledDetailSection>
        </>

        {/* Audits */}
        {/* <StyledDetailSection>
            <StyledDetailSectionHeader>Audits</StyledDetailSectionHeader>
            <StyledDetailSectionContent>
              {audit && <AuditTable {...audit} />}
              <Loader show={isFetchingAudit} size={40} />
            </StyledDetailSectionContent>
          </StyledDetailSection> */}

        {/* JSON */}
        {/* <StyledDetailSection>
            <StyledDetailSectionHeader>JSON</StyledDetailSectionHeader>
            <StyledDetailSectionContent>
              {entity && <JSONExplorer data={entity} />}
              <Loader show={isFetching} size={40} />
            </StyledDetailSectionContent>
          </StyledDetailSection> */}
      </ColumnsContainer>
    </StyledQueryEntityDetail>
  );
};
