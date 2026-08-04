import { entitiesDict } from "@inkvisitor/shared/dictionaries";
import { EntityEnums, UserEnums } from "@inkvisitor/shared/enums";
import { IEntity } from "@inkvisitor/shared/types";
import { Button, Input, Loader } from "components";
import { getStoredUserRole } from "utils/userStorage";

import Dropdown, { EntityTag } from "components/advanced";
import { useDebounce } from "hooks";
import { useTemplatesQuery } from "hooks/react-query";
import React, { useMemo, useState } from "react";
import { useSelector } from "react-redux";
import { selectPanelWidth } from "redux/features/layout/mainPage/panelWidthsSlice";
import { IcoPlusBold, IcoTrashSimple } from "Theme/icons";
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
import { ButtonSize } from "types";

interface TemplateListBox {}
export const TemplateListBox: React.FC<TemplateListBox> = () => {
  // FILTER;
  const allEntityOption = {
    value: EntityEnums.Extension.Any,
    label: "all",
  } as { value: EntityEnums.Extension.Any; label: string };
  const allEntityOptions = [allEntityOption, ...entitiesDict];

  const [filterByClass, setFilterByClass] = useState<EntityEnums.Class | EntityEnums.Extension.Any>(
    EntityEnums.Extension.Any,
  );
  const [filterByLabel, setFilterByLabel] = useState<string>("");

  const fourthPanelWidth = useDebounce(useSelector(selectPanelWidth(3)), 200);
  const widthTooNarrow = fourthPanelWidth < 220;

  // purposefully fetch on page load so the detail box can use it immediately
  const { data: allTemplatesData, isFetching: isFetchingTemplates } = useTemplatesQuery();

  const templatesData = useMemo(() => {
    if (!allTemplatesData) {
      return [];
    }
    return allTemplatesData.filter((template: IEntity) => {
      if (filterByClass !== allEntityOption.value && template.class !== filterByClass) {
        return false;
      }
      if (
        filterByLabel.length &&
        !template.labels[0]?.toLocaleLowerCase().startsWith(filterByLabel.toLocaleLowerCase())
      ) {
        return false;
      }
      return true;
    });
  }, [allTemplatesData, filterByClass, filterByLabel]);

  // CREATE MODAL
  const [showCreateModal, setShowCreateModal] = useState<boolean>(false);

  const handleAskCreateTemplate = () => {
    setShowCreateModal(true);
  };

  // REMOVE MODAL
  const [removeEntityId, setRemoveEntityId] = useState<string | false>(false);

  const handleAskRemoveTemplate = (templateId: string) => {
    setRemoveEntityId(templateId);
  };

  const entityToRemove: false | IEntity = useMemo(() => {
    if (removeEntityId) {
      const templateToBeRemoved = templatesData?.find(
        (template: IEntity) => template.id === removeEntityId,
      );
      return templateToBeRemoved || false;
    } else {
      return false;
    }
  }, [removeEntityId]);

  const userRole = getStoredUserRole() as UserEnums.Role;

  return (
    <StyledBoxContent>
      <StyledTemplateSection>
        <StyledTemplateSectionHeader>
          {userRole !== UserEnums.Role.Viewer && (
            <Button
              key="add-template"
              icon={<IcoPlusBold />}
              color="primary"
              inverted
              label="new template"
              size={ButtonSize.Medium}
              onClick={() => {
                handleAskCreateTemplate();
              }}
            />
          )}
        </StyledTemplateSectionHeader>

        <StyledTemplateFilter>
          <StyledTemplateFilterInputRow>
            <StyledTemplateFilterInputLabel>{"Entity class: "}</StyledTemplateFilterInputLabel>
            <StyledTemplateFilterInputValue>
              <div style={{ position: "relative" }}>
                <Dropdown.Single.Entity
                  value={filterByClass}
                  options={
                    widthTooNarrow
                      ? allEntityOptions.map((c) => {
                          return {
                            value: c.value,
                            label: c.value,
                          };
                        })
                      : allEntityOptions
                  }
                  onChange={(selectedOption) => {
                    setFilterByClass(selectedOption);
                  }}
                  width="full"
                  disableTyping
                  disableTooltip={!widthTooNarrow}
                />
              </div>
            </StyledTemplateFilterInputValue>
          </StyledTemplateFilterInputRow>
          <StyledTemplateFilterInputRow>
            <StyledTemplateFilterInputLabel>{"Label: "}</StyledTemplateFilterInputLabel>
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
                    entity={templateEntity}
                    fullWidth
                    tooltipPosition="left"
                    unlinkButton={
                      userRole !== UserEnums.Role.Viewer && {
                        onClick: () => {
                          handleAskRemoveTemplate(templateEntity.id);
                        },
                        tooltipLabel: "delete template",
                        icon: <IcoTrashSimple />,
                      }
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
      {removeEntityId && (
        <TemplateListRemoveModal
          removeEntityId={removeEntityId}
          setRemoveEntityId={setRemoveEntityId}
          entityToRemove={entityToRemove}
        />
      )}
    </StyledBoxContent>
  );
};

export const MemoizedTemplateListBox = React.memo(TemplateListBox);
