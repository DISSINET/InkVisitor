import { EntityEnums, UserEnums } from "@inkvisitor/shared/enums";
import { IResponseStatement, IStatement } from "@inkvisitor/shared/types";
import { Input, Loader } from "components";
import Dropdown from "components/advanced";
import { EntityWritesContext, useIsInViewport } from "hooks";
import { useOrderedLanguageDict, useUsedRelationsQuery } from "hooks/react-query";
import React from "react";
import { EntityDetailMetaProps } from "../../../EntityDetailBox/EntityDetail/EntityDetailMetaProps/EntityDetailMetaProps";
import { EntityDetailRelations } from "../../../EntityDetailBox/EntityDetail/EntityDetailRelations/EntityDetailRelations";
import { EntityDetailStatusButtons } from "../../../EntityDetailBox/EntityDetail/EntityDetailStatusButtons/EntityDetailStatusButtons";
import {
  StyledDetailContentRow,
  StyledDetailContentRowLabel,
  StyledDetailContentRowValue,
  StyledDetailForm,
} from "../../../EntityDetailBox/EntityDetail/EntityDetailStyles";
import { useRelationMutations } from "../../../EntityDetailBox/EntityDetail/useRelationMutations";
import { useStoredEntityWrites } from "../../../EntityDetailBox/EntityDetail/useStoredEntityWrites";
import { StyledEditorSectionContent } from "../../StatementEditorBoxStyles";
import {
  StyledDetailBlock,
  StyledDetailBlockLabel,
  StyledRelationsError,
  StyledRelationsLoading,
} from "./StatementEditorDetailSectionStyles";

interface StatementEditorDetailSection {
  statement: IResponseStatement;
  userCanEdit: boolean;
  widthTooNarrow: boolean;
  handleAttributeChange: (changes: Partial<IStatement>, instantUpdate?: boolean) => void;
}
/**
 * The parts of Detail the Editor has no section for. The statement's own attributes save through
 * the Editor, so they go out together with its unsaved edits; relations are stored apart from the
 * statement and are fetched once the section scrolls into view.
 */
export const StatementEditorDetailSection: React.FC<StatementEditorDetailSection> = ({
  statement,
  userCanEdit,
  widthTooNarrow,
  handleAttributeChange,
}) => {
  const [sectionRef, sectionInViewport] = useIsInViewport("200px");
  // the viewport flag flips on every scroll past the section; a write invalidates the query anyway
  const {
    data: usedRelations,
    isError: isRelationsError,
    isFetching: isRelationsFetching,
  } = useUsedRelationsQuery(statement.id, {
    enabled: sectionInViewport,
    staleTime: 60 * 1000,
  });

  const orderedLanguageDict = useOrderedLanguageDict();

  const writes = useStoredEntityWrites();
  const { relationCreateMutation, relationUpdateMutation, relationDeleteMutation } =
    useRelationMutations(writes);

  return (
    <StyledEditorSectionContent ref={sectionRef}>
      <StyledDetailForm>
        <StyledDetailContentRow>
          <StyledDetailContentRowLabel>Detail</StyledDetailContentRowLabel>
          <StyledDetailContentRowValue>
            <Input
              disabled={!userCanEdit}
              width="full"
              type="textarea"
              value={statement.detail}
              onChangeFn={(newValue: string) => {
                if (newValue !== statement.detail) {
                  handleAttributeChange({ detail: newValue }, true);
                }
              }}
            />
          </StyledDetailContentRowValue>
        </StyledDetailContentRow>
        <StyledDetailContentRow>
          <StyledDetailContentRowLabel>Status</StyledDetailContentRowLabel>
          <StyledDetailContentRowValue>
            <EntityDetailStatusButtons
              status={statement.status}
              onChange={(status) => handleAttributeChange({ status }, true)}
              disabled={statement.right !== UserEnums.RoleMode.Admin}
              iconsOnly={widthTooNarrow}
            />
          </StyledDetailContentRowValue>
        </StyledDetailContentRow>
        <StyledDetailContentRow>
          <StyledDetailContentRowLabel>Label language</StyledDetailContentRowLabel>
          <StyledDetailContentRowValue>
            <Dropdown.Single.Basic
              disabled={!userCanEdit}
              width="full"
              options={orderedLanguageDict}
              value={statement.language}
              onChange={(selectedOption) => {
                handleAttributeChange(
                  { language: selectedOption || EntityEnums.Language.Empty },
                  true,
                );
              }}
            />
          </StyledDetailContentRowValue>
        </StyledDetailContentRow>
      </StyledDetailForm>

      <StyledDetailBlock>
        <StyledDetailBlockLabel>Relations</StyledDetailBlockLabel>
        {usedRelations ? (
          <EntityWritesContext.Provider value={writes}>
            <EntityDetailRelations
              entity={usedRelations}
              relationCreateMutation={relationCreateMutation}
              relationUpdateMutation={relationUpdateMutation}
              relationDeleteMutation={relationDeleteMutation}
              userCanEdit={userCanEdit}
            />
          </EntityWritesContext.Provider>
        ) : isRelationsError && !isRelationsFetching ? (
          <StyledRelationsError>Relations could not be loaded</StyledRelationsError>
        ) : (
          <StyledRelationsLoading>
            <Loader show noBackground size={10} loaderStyle="beat" />
          </StyledRelationsLoading>
        )}
      </StyledDetailBlock>

      <StyledDetailBlock>
        <StyledDetailBlockLabel>Metaproperties</StyledDetailBlockLabel>
        <EntityDetailMetaProps
          entity={statement}
          onPropsChange={(props) => handleAttributeChange({ props }, true)}
          userCanEdit={userCanEdit}
          territoryParentId={statement.data.territory?.territoryId}
        />
      </StyledDetailBlock>
    </StyledEditorSectionContent>
  );
};
