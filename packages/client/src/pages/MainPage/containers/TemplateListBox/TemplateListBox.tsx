import { entitiesDict } from "@shared/dictionaries";
import { EntityClass, UserRole } from "@shared/enums";
import { IEntity } from "@shared/types";
import api from "api";
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
    isFetching,
  } = useQuery(
    ["templates"],
    async () => {
      const res = await api.entitiesGetMore({
        class: false,
        onlyTemplates: true,
      });
      return res.data;
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
        <StyledTemplateSectionList>
          {templatesData &&
            templatesData.map((templateEntity) => {
              return (
                <React.Fragment key={templateEntity.id}>
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
                  width={40}
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
