import { IEntity, IResponseDetail } from "@shared/types";
import { Button, Input } from "components";
import Dropdown, { EntityTag } from "components/advanced";
import React, { useEffect, useState } from "react";
import {
  StyledExpandedRow,
  StyledExpRowFormGrid,
  StyledExpRowFormGridColumnLabel,
  StyledExpRowFormGridColumnValue,
} from "./ExplorerTableStyles";
import { Explore } from "@shared/types/query";
import { languageDict } from "@shared/dictionaries";
import { useQuery } from "@tanstack/react-query";
import api from "api";
import { FaRegCopy } from "react-icons/fa";
import { toast } from "react-toastify";

interface ExplorerTableExpandedRow {
  rowEntity: IEntity;
  columns: Explore.IExploreColumn[];
}
export const ExplorerTableExpandedRow: React.FC<ExplorerTableExpandedRow> = ({
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

  if (entity) {
    const { entities, relations } = entity;
    return (
      <StyledExpandedRow $columnsSpan={columns.length + 2}>
        {/* expanded row  */}
        <StyledExpRowFormGrid>
          <StyledExpRowFormGridColumnLabel>ID:</StyledExpRowFormGridColumnLabel>
          <StyledExpRowFormGridColumnValue>
            {id}
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
          </StyledExpRowFormGridColumnValue>
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
          <StyledExpRowFormGridColumnLabel>
            references:
          </StyledExpRowFormGridColumnLabel>
          <div>
            {references.map((reference, key) => {
              return (
                <div key={key}>
                  <span>
                    resource:
                    <EntityTag entity={entities[reference.resource]} />
                  </span>
                  <span>
                    value:
                    <EntityTag entity={entities[reference.value]} />
                  </span>
                </div>
              );
            })}
          </div>
          <StyledExpRowFormGridColumnLabel>
            props:
          </StyledExpRowFormGridColumnLabel>
          <div>
            {props.map((prop, key) => {
              return (
                <div>
                  <span>
                    type:
                    <EntityTag entity={entities[prop.type.entityId]} />
                  </span>
                  <span>
                    value: <EntityTag entity={entities[prop.value.entityId]} />
                  </span>
                </div>
              );
            })}
          </div>
        </StyledExpRowFormGrid>
      </StyledExpandedRow>
    );
  }
};
