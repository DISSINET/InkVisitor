import { IEntity, IResponseDetail } from "@shared/types";
import { Button, Input } from "components";
import Dropdown, {
  AuditTable,
  EntityTag,
  JSONExplorer,
} from "components/advanced";
import React, { Component, useEffect, useState } from "react";
import {
  StyledExpandedRow,
  StyledExpRowSection,
  StyledExpRowFormGrid,
  StyledExpRowFormGridColumnLabel,
  StyledExpRowFormGridColumnValue,
  StyledExpRowFormGridColumnValueID,
  StyledExpRowSectionHeader,
  StyledExpRowSectionContent,
} from "../ExplorerTableStyles";
import { Explore } from "@shared/types/query";
import { languageDict } from "@shared/dictionaries";
import { useQuery } from "@tanstack/react-query";
import api from "api";
import { FaRegCopy } from "react-icons/fa";
import { toast } from "react-toastify";
import { EntityEnums } from "@shared/enums";
import { EntityDetailRelations } from "pages/Main/containers/EntityDetailBox/EntityDetail/EntityDetailRelations/EntityDetailRelations";
import { EntityDetailProtocol } from "pages/Main/containers/EntityDetailBox/EntityDetail/EntityDetailProtocol/EntityDetailProtocol";
import { EntityDetailValidationSection } from "pages/Main/containers/EntityDetailBox/EntityDetail/EntityDetailValidationSection/EntityDetailValidationSection";
import { ITerritoryValidation } from "@shared/types/territory";

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

  // const { entities, relations } = entity;

  return (
    <StyledExpandedRow $columnsSpan={columns.length + 2}>
      <StyledExpRowSection>
        <StyledExpRowFormGrid>
          <StyledExpRowFormGridColumnLabel>ID:</StyledExpRowFormGridColumnLabel>
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
            label:
          </StyledExpRowFormGridColumnLabel>
          <div>
            <Input width="full" value={label} disabled onChangeFn={() => {}} />
          </div>
          <StyledExpRowFormGridColumnLabel>
            detail:
          </StyledExpRowFormGridColumnLabel>
          <div>
            <Input width="full" value={detail} disabled onChangeFn={() => {}} />
          </div>
          <StyledExpRowFormGridColumnLabel>
            language:
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
            notes:
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

      {entity && (
        <>
          {rowEntity.class === EntityEnums.Class.Territory && (
            <>
              {/* Protocol */}
              <StyledExpRowSection>
                <StyledExpRowSectionHeader>Protocol</StyledExpRowSectionHeader>
                <StyledExpRowSectionContent>
                  <EntityDetailProtocol
                    territory={entity}
                    // to make it editable, this needs to be implemented
                    // updateEntityMutation={updateEntityMutation}
                    // isInsideTemplate={isInsideTemplate}
                    userCanEdit={false}
                  />
                </StyledExpRowSectionContent>
              </StyledExpRowSection>

              {/* Validation rules */}
              <StyledExpRowSection>
                <StyledExpRowSectionHeader>
                  Validation rules
                </StyledExpRowSectionHeader>
                <StyledExpRowSectionContent>
                  <EntityDetailValidationSection
                    validations={
                      entity.data.validations as
                        | ITerritoryValidation[]
                        | undefined
                    }
                    entities={entity.entities}
                    userCanEdit={false}
                    entity={entity}
                    // updateEntityMutation={updateEntityMutation}
                    // isInsideTemplate={isInsideTemplate}
                    // territoryParentId={getTerritoryId(entity)}
                    // setLoadingValidations={setLoadingValidations}
                  />
                </StyledExpRowSectionContent>
              </StyledExpRowSection>
            </>
          )}

          {/* Relations */}
          <StyledExpRowSection>
            <StyledExpRowSectionHeader>Relations</StyledExpRowSectionHeader>
            <StyledExpRowSectionContent>
              <EntityDetailRelations
                entity={entity}
                // to switch userCanEdit={true}, mutations needs to be sent to props
                userCanEdit={false}
              />
            </StyledExpRowSectionContent>
          </StyledExpRowSection>

          {/* Metaproperties */}
          <StyledExpRowSection>
            <StyledExpRowSectionHeader>
              Metaproperties
            </StyledExpRowSectionHeader>
            <StyledExpRowSectionContent>
              {props.map((prop, key) => {
                return (
                  <div>
                    <span>
                      type:
                      <EntityTag entity={entity.entities[prop.type.entityId]} />
                    </span>
                    <span>
                      value:{" "}
                      <EntityTag
                        entity={entity.entities[prop.value.entityId]}
                      />
                    </span>
                  </div>
                );
              })}
            </StyledExpRowSectionContent>
          </StyledExpRowSection>

          {/* References */}
          <StyledExpRowSection>
            <StyledExpRowSectionHeader>References</StyledExpRowSectionHeader>
            <StyledExpRowSectionContent>
              {references.map((reference, key) => {
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
                      <EntityTag entity={entity.entities[reference.resource]} />
                    </span>
                    <span>
                      <EntityTag entity={entity.entities[reference.value]} />
                    </span>
                  </div>
                );
              })}
            </StyledExpRowSectionContent>
          </StyledExpRowSection>

          {/* Used in */}
          <StyledExpRowSection>
            <StyledExpRowSectionHeader>Used In</StyledExpRowSectionHeader>
            <StyledExpRowSectionContent></StyledExpRowSectionContent>
          </StyledExpRowSection>

          {/* Audits */}
          <StyledExpRowSection>
            <StyledExpRowSectionHeader>Audits</StyledExpRowSectionHeader>
            <StyledExpRowSectionContent>
              {audit && <AuditTable {...audit} />}
            </StyledExpRowSectionContent>
          </StyledExpRowSection>

          {/* JSON */}
          <StyledExpRowSection>
            <StyledExpRowSectionHeader>JSON</StyledExpRowSectionHeader>
            <StyledExpRowSectionContent>
              {entity && <JSONExplorer data={entity} />}
            </StyledExpRowSectionContent>
          </StyledExpRowSection>
        </>
      )}
    </StyledExpandedRow>
  );
};
