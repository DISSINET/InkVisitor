import { entitiesDict } from "@inkvisitor/shared/dictionaries";
import { EntityEnums, UserEnums } from "@inkvisitor/shared/enums";
import { IEntity, IResponseUser, IUserOptions } from "@inkvisitor/shared/types";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import api from "api";
import { Button, Input, Loader } from "components";
import { getStoredUserId, getStoredUserRole } from "utils/userStorage";

import Dropdown, { EntityTag } from "components/advanced";
import { useDebounce } from "hooks";
import { useTemplatesQuery, useUserQuery } from "hooks/react-query";
import React, { useMemo, useState } from "react";
import { useSelector } from "react-redux";
import { selectPanelWidth } from "redux/features/layout/mainPage/panelWidthsSlice";
import { IcoPlusBold, IcoSort, IcoStar, IcoTrashSimple } from "Theme/icons";
import {
  StyledBoxContent,
  StyledStarButtonWrap,
  StyledTemplateControl,
  StyledTemplateFilter,
  StyledTemplateSection,
  StyledTemplateSectionHeader,
  StyledTemplateSectionList,
} from "./TemplateListBoxStyles";
import { TemplateListCreateModal } from "./TemplateListCreateModal/TemplateListCreateModal";
import { TemplateListRemoveModal } from "./TemplateListRemoveModal/TemplateListRemoveModal";
import { sortTemplates, TemplateOrder, templateOrderOptions } from "./sortTemplates";
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
  const [onlyStarred, setOnlyStarred] = useState<boolean>(false);
  const [order, setOrder] = useState<TemplateOrder>("label");

  const { data: user } = useUserQuery();
  const promotedTemplateClass = user?.options.promotedTemplateClass;
  const starredTemplateIds = useMemo(
    () => new Set(user?.options.starredTemplates ?? []),
    [user?.options.starredTemplates],
  );

  const fourthPanelWidth = useDebounce(useSelector(selectPanelWidth(3)), 200);
  const widthTooNarrow = fourthPanelWidth < 220;

  // purposefully fetch on page load so the detail box can use it immediately
  const { data: allTemplatesData, isFetching: isFetchingTemplates } = useTemplatesQuery();

  const templatesData = useMemo(() => {
    if (!allTemplatesData) {
      return [];
    }
    const filtered = allTemplatesData.filter((template: IEntity) => {
      // discouraged templates stay reachable through search and Explorer only
      if (template.status === EntityEnums.Status.Discouraged) {
        return false;
      }
      if (filterByClass !== allEntityOption.value && template.class !== filterByClass) {
        return false;
      }
      if (onlyStarred && !starredTemplateIds.has(template.id)) {
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
    return sortTemplates(filtered, order, promotedTemplateClass);
  }, [
    order,
    allTemplatesData,
    filterByClass,
    filterByLabel,
    onlyStarred,
    starredTemplateIds,
    promotedTemplateClass,
  ]);

  const queryClient = useQueryClient();

  const userKey = ["user", getStoredUserId()];

  // one at a time, so a later list can not be overwritten by an earlier one
  // that reaches the server second
  const starMutation = useMutation({
    scope: { id: "starredTemplates" },
    mutationFn: async (starredTemplates: string[]) => {
      // the server merges options into the stored ones, so only the starred
      // list is sent
      await api.usersUpdate(getStoredUserId() as string, {
        options: { starredTemplates } as IUserOptions,
      });
    },
    onError: () => {
      queryClient.invalidateQueries({ queryKey: userKey });
    },
  });

  // reads the user from the cache at click time and writes the result back
  // straight away, so quick clicks each start from the previous one. It reads
  // nothing that changes between renders, which matters because EntityTag
  // re-renders on a changed `button` only when it appears or goes away.
  const toggleStar = (templateId: string) => {
    const current = queryClient.getQueryData<IResponseUser>(userKey);
    if (!current) {
      return;
    }
    const starred = current.options.starredTemplates ?? [];
    const starredTemplates = starred.includes(templateId)
      ? starred.filter((id) => id !== templateId)
      : [...starred, templateId];
    queryClient.setQueryData<IResponseUser>(userKey, {
      ...current,
      options: { ...current.options, starredTemplates },
    });
    starMutation.mutate(starredTemplates);
  };

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
              icon={<IcoPlusBold size={14} />}
              color="primary"
              inverted
              label={widthTooNarrow ? "" : "template"}
              tooltipLabel={widthTooNarrow ? "new template" : ""}
              size={ButtonSize.Medium}
              onClick={() => {
                handleAskCreateTemplate();
              }}
            />
          )}
          <Button
            icon={<IcoStar size={14} />}
            color={onlyStarred ? "warning" : "greyer"}
            inverted={!onlyStarred}
            size={ButtonSize.Medium}
            onClick={() => setOnlyStarred(!onlyStarred)}
            tooltipLabel="starred templates"
          />
          <StyledTemplateControl>
            <Input
              value={filterByLabel}
              onChangeFn={(newType: string) => setFilterByLabel(newType)}
              changeOnType
              width="full"
              placeholder="filter by label"
              autoFocus
              clearable
            />
          </StyledTemplateControl>
        </StyledTemplateSectionHeader>

        <StyledTemplateFilter>
          <StyledTemplateControl>
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
                setFilterByClass(selectedOption || EntityEnums.Extension.Any);
              }}
              width="full"
              tooltipLabel="entity class"
              isClearable={filterByClass !== EntityEnums.Extension.Any}
              disableTooltip={!widthTooNarrow}
            />
          </StyledTemplateControl>
          <StyledTemplateControl>
            <Dropdown.Single.Basic
              value={order}
              options={templateOrderOptions}
              onChange={(newOrder) => setOrder(newOrder)}
              icon={<IcoSort />}
              tooltipLabel="order"
              width="full"
              disableTyping
            />
          </StyledTemplateControl>
        </StyledTemplateFilter>
        <StyledTemplateSectionList>
          {templatesData &&
            templatesData.map((templateEntity, ti) => {
              const isStarred = starredTemplateIds.has(templateEntity.id);
              return (
                <React.Fragment key={templateEntity.id + ti}>
                  <EntityTag
                    entity={templateEntity}
                    fullWidth
                    tooltipPosition="left"
                    isFavorited={isStarred}
                    button={
                      <StyledStarButtonWrap>
                        <Button
                          tooltipLabel={isStarred ? "unstar template" : "star template"}
                          icon={<IcoStar />}
                          color={isStarred ? "warning" : "grey"}
                          inverted
                          shape="sharp"
                          onClick={() => toggleStar(templateEntity.id)}
                        />
                      </StyledStarButtonWrap>
                    }
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
