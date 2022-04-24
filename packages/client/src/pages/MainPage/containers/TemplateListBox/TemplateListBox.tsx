import { entitiesDict } from "@shared/dictionaries";
import { allEntities } from "@shared/dictionaries/entity";
import { EntityClass, UserRole } from "@shared/enums";
import { IEntity } from "@shared/types";
import api, { IFilterEntities } from "api";
import {
  Button,
  ButtonGroup,
  Dropdown,
  Input,
  Modal,
  ModalContent,
  ModalFooter,
  ModalHeader,
  ModalInputForm,
  ModalInputLabel,
  ModalInputWrap,
} from "components";
import { StyledTypeBar } from "components/Suggester/SuggesterStyles";
import { CEntity, CStatement } from "constructors";
import { useSearchParams } from "hooks";
import React, { useEffect, useMemo, useState } from "react";
import { FaPlus } from "react-icons/fa";
import { useMutation, useQuery, useQueryClient } from "react-query";
import { ValueType, OptionTypeBase } from "react-select";
import { toast } from "react-toastify";
import { DropdownItem } from "types";
import { EntityTag } from "..";
import { StyledContent } from "../EntityBookmarkBox/EntityBookmarkBoxStyles";
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

interface TemplateListBox {}
export const TemplateListBox: React.FC<TemplateListBox> = ({}) => {
  const [createModal, setCreateModal] = useState<boolean>(false);
  const [createModalEntityClass, setCreateModalEntityClass] =
    useState<DropdownItem>(entitiesDict[0]);
  const [createModalEntityLabel, setCreateModalEntityLabel] =
    useState<string>("");
  const [createModalEntityDetail, setCreateModalEntityDetail] =
    useState<string>("");

  // FILTER;

  const allEntityOption = { value: "all", label: "all" };
  const allEntityOptions = [allEntityOption, ...entitiesDict] as any;

  const [filterByClass, setFilterByClass] =
    useState<DropdownItem>(allEntityOption);
  const [filterByLabel, setFilterByLabel] = useState<string>("");

  const handleCloseCreateModal = () => {
    setCreateModal(false);
    resetCreateModal();
  };

  const resetCreateModal = () => {
    setCreateModalEntityLabel("");
    setCreateModalEntityDetail("");
    setCreateModalEntityClass(entitiesDict[0]);
  };

  const { setDetailId, setStatementId } = useSearchParams();
  const queryClient = useQueryClient();
  const {
    status,
    data: templatesData,
    error,
    isFetching: isFetchingTemplates,
  } = useQuery(
    ["templates", filterByClass, filterByLabel],
    async () => {
      const filters: IFilterEntities = {
        onlyTemplates: true,
      };
      if (filterByClass.value !== "all") {
        filters["class"] = filterByClass.value;
      }
      if (filterByLabel) {
        filters["label"] = "*" + filterByLabel + "*";
      }

      const res = await api.entitiesGetMore(filters);

      const templates = res.data;
      templates.sort((a: IEntity, b: IEntity) =>
        a.label.toLocaleLowerCase() > b.label.toLocaleLowerCase() ? 1 : -1
      );
      return templates;
    },
    {
      enabled: api.isLoggedIn(),
      initialData: [],
    }
  );

  const templateCreateMutation = useMutation(
    async (newEntity: IEntity) => await api.entityCreate(newEntity),
    {
      onSuccess: (data, variables) => {
        toast.info(
          `Template [${variables.class}]${variables.label} was created`
        );
        queryClient.invalidateQueries(["templates"]);
        if (variables.class === EntityClass.Statement) {
          setStatementId(variables.id);
        } else {
          setDetailId(variables.id);
        }
      },
    }
  );

  const handleAskCreateTemplate = () => {
    setCreateModal(true);
  };

  const handleCreateTemplate = () => {
    if (createModalEntityClass.value === EntityClass.Statement) {
      handleCreateNewStatementTemplate();
    } else {
      handleCreateNewEntityTemplate();
    }
    handleCloseCreateModal();
  };

  const handleCreateNewStatementTemplate = () => {
    const newTemplate = CStatement(
      localStorage.getItem("userrole") as UserRole,
      undefined,
      createModalEntityLabel,
      createModalEntityDetail
    );
    newTemplate.isTemplate = true;
    templateCreateMutation.mutate(newTemplate);
  };
  const handleCreateNewEntityTemplate = () => {
    const newTemplate = CEntity(
      EntityClass.Person,
      createModalEntityLabel,
      localStorage.getItem("userrole") as UserRole,
      createModalEntityDetail
    );
    newTemplate.isTemplate = true;
    templateCreateMutation.mutate(newTemplate);
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
              <Dropdown
                value={{
                  label: filterByClass.label,
                  value: filterByClass.value,
                }}
                options={allEntityOptions}
                onChange={(option: ValueType<OptionTypeBase, any>) => {
                  setFilterByClass(option as DropdownItem);
                }}
                width={80}
                entityDropdown
                disableTyping
                oneLetter
              />
              <StyledTypeBar
                entity={`entity${createModalEntityClass.value}`}
              ></StyledTypeBar>
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
                  />
                </React.Fragment>
              );
            })}
        </StyledTemplateSectionList>
      </StyledTemplateSection>

      <Modal
        showModal={createModal}
        width="thin"
        onEnterPress={() => {
          handleCreateTemplate();
        }}
        onClose={() => {
          handleCloseCreateModal();
        }}
      >
        <ModalHeader title="Create Template" />
        <ModalContent>
          <StyledContent>
            <ModalInputForm>
              <ModalInputLabel>{"Entity type: "}</ModalInputLabel>
              <ModalInputWrap>
                <Dropdown
                  value={{
                    label: createModalEntityClass.label,
                    value: createModalEntityClass.value,
                  }}
                  options={entitiesDict}
                  onChange={(option: ValueType<OptionTypeBase, any>) => {
                    setCreateModalEntityClass(option as DropdownItem);
                  }}
                  width={80}
                  entityDropdown
                  disableTyping
                  oneLetter
                />
                <StyledTypeBar
                  entity={`entity${createModalEntityClass.value}`}
                ></StyledTypeBar>
              </ModalInputWrap>
              <ModalInputLabel>{"Label: "}</ModalInputLabel>
              <ModalInputWrap>
                <Input
                  value={createModalEntityLabel}
                  onChangeFn={(newType: string) =>
                    setCreateModalEntityLabel(newType)
                  }
                  changeOnType
                  autoFocus
                />
              </ModalInputWrap>
              <ModalInputLabel>{"Detail: "}</ModalInputLabel>
              <ModalInputWrap>
                <Input
                  value={createModalEntityDetail}
                  onChangeFn={(newType: string) =>
                    setCreateModalEntityDetail(newType)
                  }
                  changeOnType
                />
              </ModalInputWrap>
            </ModalInputForm>
          </StyledContent>
        </ModalContent>
        <ModalFooter>
          <ButtonGroup>
            <Button
              key="cancel"
              label="Cancel"
              color="greyer"
              inverted
              onClick={() => {
                handleCloseCreateModal();
              }}
            />
            <Button
              key="submit"
              label="Create"
              color="info"
              onClick={() => {
                handleCreateTemplate();
              }}
            />
          </ButtonGroup>
        </ModalFooter>
      </Modal>
    </StyledBoxContent>
  );
};
