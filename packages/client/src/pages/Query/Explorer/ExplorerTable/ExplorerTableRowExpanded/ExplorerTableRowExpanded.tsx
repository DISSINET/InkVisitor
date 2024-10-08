import { IEntity, IResponseDetail } from "@shared/types";
import { Button, Input } from "components";
import Dropdown, { EntityTag } from "components/advanced";
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
          {/* Protocol */}
          <StyledExpRowSection>
            <StyledExpRowSectionHeader>Protocol</StyledExpRowSectionHeader>
            <StyledExpRowSectionContent></StyledExpRowSectionContent>
          </StyledExpRowSection>

          {/* Validation rules */}
          <StyledExpRowSection>
            <StyledExpRowSectionHeader>
              Validation rules
            </StyledExpRowSectionHeader>
            <StyledExpRowSectionContent></StyledExpRowSectionContent>
          </StyledExpRowSection>

          {/* Relations */}
          <StyledExpRowSection>
            <StyledExpRowSectionHeader>Relations</StyledExpRowSectionHeader>
            <StyledExpRowSectionContent></StyledExpRowSectionContent>
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
                  <div key={key}>
                    <span>
                      resource:
                      <EntityTag entity={entity.entities[reference.resource]} />
                    </span>
                    <span>
                      value:
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
            <StyledExpRowSectionContent></StyledExpRowSectionContent>
          </StyledExpRowSection>

          {/* JSON */}
          <StyledExpRowSection>
            <StyledExpRowSectionHeader>JSON</StyledExpRowSectionHeader>
            <StyledExpRowSectionContent></StyledExpRowSectionContent>
          </StyledExpRowSection>
        </>
      )}
    </StyledExpandedRow>
  );
};
