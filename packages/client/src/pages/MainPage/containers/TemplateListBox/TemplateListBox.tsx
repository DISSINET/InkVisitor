import { entitiesDict } from "@shared/dictionaries";
import { EntityClass } from "@shared/enums";
import { IEntity } from "@shared/types";
import { IRequestSearch } from "@shared/types/request-search";
import api from "api";
import {
  Button,
  ButtonGroup,
  Dropdown,
  Input,
  Loader,
  Modal,
  ModalContent,
  ModalFooter,
  ModalHeader,
  TypeBar,
} from "components";

import { useSearchParams } from "hooks";
import React, { useMemo, useState } from "react";
import { FaPlus, FaTrash } from "react-icons/fa";
import { useMutation, useQuery, useQueryClient } from "react-query";
import { OptionTypeBase, ValueType } from "react-select";
import { toast } from "react-toastify";
import { useAppSelector } from "redux/hooks";
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
import { TemplateListCreateModal } from "./TemplateListCreateModal/TemplateListCreateModal";

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

  const { detailIdArray, removeDetailId } = useSearchParams();
  const queryClient = useQueryClient();
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

  const templateRemoveMutation = useMutation(
    async (entityId: string) => await api.entityDelete(entityId),
    {
      onSuccess: () => {
        if (removeEntityId && detailIdArray.includes(removeEntityId)) {
          removeDetailId(removeEntityId);
        }
        entityToRemove &&
          toast.warning(
            `Template [${entityToRemove.class}]${entityToRemove.label} was removed`
          );
        setRemoveEntityId(false);
        queryClient.invalidateQueries(["templates"]);
        queryClient.invalidateQueries(["entity"]);
      },
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

  const entityToRemove: false | IEntity = useMemo(() => {
    if (removeEntityId) {
      const templateToBeRemoved = templatesData?.find(
        (template: IEntity) => template.id === removeEntityId
      );
      return templateToBeRemoved || false;
    } else {
      return false;
    }
  }, [removeEntityId]);

  const handleAskRemoveTemplate = (templateId: string) => {
    setShowRemoveModal(true);
    setRemoveEntityId(templateId);
  };

  const handleRemoveTemplateCancel = () => {
    setRemoveEntityId(false);
    setShowRemoveModal(false);
  };
  // TODO: fix - lifecycle - removeEntityId is 2x, not work with shortcuts
  const handleRemoveTemplateAccept = () => {
    setShowRemoveModal(false);
    if (removeEntityId) {
      templateRemoveMutation.mutate(removeEntityId);
    }
    setRemoveEntityId(false);
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
      <Modal
        key="remove"
        showModal={showRemoveModal}
        width="thin"
        onEnterPress={() => {
          handleRemoveTemplateAccept();
        }}
        onClose={() => {
          handleRemoveTemplateCancel();
        }}
      >
        <ModalHeader title="Remove Template" />
        <ModalContent>
          <StyledContent>
            Remove template entity?
            {entityToRemove && <EntityTag actant={entityToRemove} />}
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
                handleRemoveTemplateCancel();
              }}
            />
            <Button
              key="remove"
              label="Remove"
              color="danger"
              onClick={() => {
                handleRemoveTemplateAccept();
              }}
            />
          </ButtonGroup>
        </ModalFooter>
      </Modal>
    </StyledBoxContent>
  );
};

export const MemoizedTemplateListBox = React.memo(TemplateListBox);
