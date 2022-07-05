import { entitiesDict } from "@shared/dictionaries";
import { EntityClass } from "@shared/enums";
import { IEntity } from "@shared/types";
import { IRequestSearch } from "@shared/types/request-search";
import api from "api";
import { Button, Dropdown, Input, Loader, TypeBar } from "components";

import React, { useState } from "react";
import { FaPlus, FaTrash } from "react-icons/fa";
import { useQuery } from "react-query";
import { OptionTypeBase, ValueType } from "react-select";
import { useAppSelector } from "redux/hooks";
import { DropdownItem } from "types";
import { EntityTag } from "..";
import {
  StyledBoxContent,
  StyledTemplateFilter,
  StyledTemplateFilterInputLabel,
  StyledTemplateFilterInputRow,
  StyledTemplateFilterInputValue,
  StyledTemplateSection,
  StyledTemplateSectionHeader,
  StyledTemplateSectionList,
} from "./TemplateListBoxStyles";
import { TemplateListCreateModal } from "./TemplateListCreateModal/TemplateListCreateModal";
import { TemplateListRemoveModal } from "./TemplateListRemoveModal/TemplateListRemoveModal";

interface TemplateListBox {}
export const TemplateListBox: React.FC<TemplateListBox> = ({}) => {
  // FILTER;
  const allEntityOption = { value: "all", label: "all" };
  const allEntityOptions = [allEntityOption, ...entitiesDict] as any;

  const [filterByClass, setFilterByClass] =
    useState<DropdownItem>(allEntityOption);
  const [filterByLabel, setFilterByLabel] = useState<string>("");

  const fourthPanelBoxesOpened: { [key: string]: boolean } = useAppSelector(
    (state) => state.layout.fourthPanelBoxesOpened
  );

  const {
    status,
    data: templatesData,
    error,
    isFetching: isFetchingTemplates,
  } = useQuery(
    ["templates", filterByClass, filterByLabel],
    async () => {
      const filters: IRequestSearch = {
        onlyTemplates: true,
      };
      if (filterByClass.value !== "all") {
        filters.class = filterByClass.value as EntityClass;
      }

      const res = await api.entitiesSearch(filters);

      const templates = res.data;
      templates.sort((a: IEntity, b: IEntity) =>
        a.label.toLocaleLowerCase() > b.label.toLocaleLowerCase() ? 1 : -1
      );
      return templates;
    },
    {
      enabled: api.isLoggedIn() && fourthPanelBoxesOpened["templates"],
      initialData: [],
    }
  );

  // CREATE MODAL
  const [showCreateModal, setShowCreateModal] = useState<boolean>(false);

  const handleAskCreateTemplate = () => {
    setShowCreateModal(true);
  };

  // REMOVE MODAL
  const [showRemoveModal, setShowRemoveModal] = useState<boolean>(false);
  const [removeEntityId, setRemoveEntityId] = useState<string | false>(false);

  const handleAskRemoveTemplate = (templateId: string) => {
    setShowRemoveModal(true);
    setRemoveEntityId(templateId);
  };

  return (
    <StyledBoxContent>
      <StyledTemplateSection>
        <StyledTemplateSectionHeader>
          <Button
            key="add-statement"
            icon={<FaPlus size={14} />}
            color="primary"
            label="new Template"
            onClick={() => {
              handleAskCreateTemplate();
            }}
          />
        </StyledTemplateSectionHeader>

        <StyledTemplateFilter>
          <StyledTemplateFilterInputRow>
            <StyledTemplateFilterInputLabel>
              {"Entity class: "}
            </StyledTemplateFilterInputLabel>
            <StyledTemplateFilterInputValue>
              <div style={{ position: "relative" }}>
                <Dropdown
                  value={{
                    label: filterByClass.label,
                    value: filterByClass.value,
                  }}
                  options={allEntityOptions}
                  onChange={(option: ValueType<OptionTypeBase, any>) => {
                    setFilterByClass(option as DropdownItem);
                  }}
                  width="full"
                  entityDropdown
                  disableTyping
                />
                <TypeBar entityLetter={filterByClass.value} />
              </div>
            </StyledTemplateFilterInputValue>
          </StyledTemplateFilterInputRow>
          <StyledTemplateFilterInputRow>
            <StyledTemplateFilterInputLabel>
              {"Label: "}
            </StyledTemplateFilterInputLabel>
            <StyledTemplateFilterInputValue>
              <Input
                value={filterByLabel}
                onChangeFn={(newType: string) => setFilterByLabel(newType)}
                changeOnType
                width="full"
                autoFocus
              />
            </StyledTemplateFilterInputValue>
          </StyledTemplateFilterInputRow>
        </StyledTemplateFilter>
        <StyledTemplateSectionList>
          {templatesData &&
            templatesData.map((templateEntity, ti) => {
              return (
                <React.Fragment key={templateEntity.id + ti}>
                  <EntityTag
                    actant={templateEntity}
                    propId={templateEntity.id}
                    fullWidth
                    button={
                      <Button
                        tooltip="remove template"
                        icon={<FaTrash />}
                        color="plain"
                        inverted={true}
                        onClick={() => {
                          handleAskRemoveTemplate(templateEntity.id);
                        }}
                      />
                    }
                  />
                </React.Fragment>
              );
            })}
          <Loader show={isFetchingTemplates} size={40} />
        </StyledTemplateSectionList>
      </StyledTemplateSection>

      <TemplateListCreateModal
        showCreateModal={showCreateModal}
        setShowCreateModal={setShowCreateModal}
      />
      <TemplateListRemoveModal
        showRemoveModal={showRemoveModal}
        setShowRemoveModal={setShowRemoveModal}
        removeEntityId={removeEntityId}
        setRemoveEntityId={setRemoveEntityId}
        templatesData={templatesData}
      />
    </StyledBoxContent>
  );
};

export const MemoizedTemplateListBox = React.memo(TemplateListBox);
