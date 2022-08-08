import {
  EntityClass,
  EntityExtension,
  EntityStatus,
  ExtendedEntityClass,
  UserRole,
  UserRoleMode,
} from "@shared/enums";
import { IEntity, IOption } from "@shared/types";
import api from "api";
import { Suggester } from "components";
import { CEntity, CStatement, CTerritoryActant } from "constructors";
import { useDebounce, useSearchParams } from "hooks";
import React, { useEffect, useState } from "react";
import { FaHome } from "react-icons/fa";
import { useMutation, useQuery } from "react-query";
import { OptionTypeBase, ValueType } from "react-select";
import { DropdownAny, rootTerritoryId, wildCardChar } from "Theme/constants";
import { Entities, EntityDragItem, EntitySuggestionI } from "types";

interface EntitySuggester {
  categoryTypes: ExtendedEntityClass[];
  onSelected: (id: string, isTemplate: boolean) => void;
  placeholder?: string;
  disableCreate?: boolean;
  disableWildCard?: boolean;
  inputWidth?: number | "full";
  openDetailOnCreate?: boolean;
  territoryActants?: string[];
  excludedEntities?: EntityClass[];
  excludedActantIds?: string[];
  filterEditorRights?: boolean;
  isInsideTemplate?: boolean;
  disableTemplatesAccept?: boolean;
}

export const EntitySuggester: React.FC<EntitySuggester> = ({
  categoryTypes,
  onSelected,
  placeholder = "",
  disableCreate,
  inputWidth,
  disableWildCard = false,
  openDetailOnCreate = false,
  territoryActants,
  excludedEntities = [],
  filterEditorRights = false,
  excludedActantIds = [],
  isInsideTemplate = false,
  disableTemplatesAccept = false,
}) => {
  const [typed, setTyped] = useState<string>("");
  const debouncedTyped = useDebounce(typed, 100);
  const [selectedCategory, setSelectedCategory] = useState<any>();
  const [allCategories, setAllCategories] = useState<IOption[]>();

  const { appendDetailId } = useSearchParams();
  const userRole = localStorage.getItem("userrole");

  // Suggesions query
  const {
    status: statusStatement,
    data: suggestions,
    error: errorStatement,
    isFetching: isFetchingStatement,
  } = useQuery(
    ["suggestion", debouncedTyped, selectedCategory, excludedEntities],
    async () => {
      const resSuggestions = await api.entitiesSearch({
        label: debouncedTyped + wildCardChar,
        class:
          selectedCategory?.value === DropdownAny
            ? false
            : selectedCategory.value,
        excluded: excludedEntities.length ? excludedEntities : undefined,
      });

      const suggestions = resSuggestions.data;
      suggestions.sort((a, b) => {
        if (a.status == EntityStatus.Discouraged) {
          return 1;
        } else {
          return -1;
        }
      });
      return resSuggestions.data
        .filter((s) =>
          filterEditorRights && userRole !== UserRole.Admin
            ? s.right === UserRoleMode.Write
            : s
        )
        .filter((s) =>
          excludedActantIds.length ? !excludedActantIds.includes(s.id) : s
        )
        .map((entity: IEntity) => {
          const category = Entities[entity.class];
          const icons: React.ReactNode[] = [];

          if (territoryActants?.includes(entity.id)) {
            icons.push(<FaHome key={entity.id} color="" />);
          }
          const { label, detail, status, data, isTemplate, id } = entity;

          return {
            color: category.color,
            entityClass: entity.class,
            label: label,
            detail: detail,
            status: status,
            ltype: data.logicalType,
            isTemplate: isTemplate ? isTemplate : false,
            id: id,
            icons: icons,
            entity: entity,
          };
        });
    },
    {
      enabled:
        debouncedTyped.length > 1 &&
        !!selectedCategory &&
        !excludedEntities
          .map((key) => key.valueOf())
          .includes(selectedCategory?.value) &&
        api.isLoggedIn(),
    }
  );

  const handleClean = () => {
    setTyped("");
  };

  // initial load of categories
  useEffect(() => {
    const categories: IOption[] = [];
    categoryTypes.forEach((category) => {
      categories.push({
        label: category.valueOf(),
        value: category.valueOf(),
      });
    });
    if (categories.length > 1 && !disableWildCard) {
      categories.unshift({
        label: EntityExtension.Any,
        value: DropdownAny,
      });
    }
    if (categories.length) {
      setAllCategories(categories);
      setSelectedCategory(categories[0]);
    }
  }, [categoryTypes]);

  const actantsCreateMutation = useMutation(
    async (newActant: IEntity) => await api.entityCreate(newActant),
    {
      onSuccess: (data, variables) => {
        onSelected(variables.id, false);
        handleClean();
        if (openDetailOnCreate) {
          appendDetailId(variables.id);
        }
      },
    }
  );

  const handleCreate = async (newCreated: {
    label: string;
    category: EntityClass;
    detail: string;
    territoryId?: string;
  }) => {
    if (
      newCreated.category === EntityClass.Statement &&
      newCreated.territoryId
    ) {
      const newStatement = CStatement(
        localStorage.getItem("userrole") as UserRole,
        newCreated.territoryId,
        newCreated.label,
        newCreated.detail
      );
      actantsCreateMutation.mutate(newStatement);
    } else if (newCreated.category === EntityClass.Territory) {
      const newActant = CTerritoryActant(
        newCreated.label,
        newCreated.territoryId ? newCreated.territoryId : rootTerritoryId,
        -1,
        localStorage.getItem("userrole") as UserRole,
        newCreated.detail
      );
      actantsCreateMutation.mutate(newActant);
    } else {
      const newActant = CEntity(
        newCreated.category,
        newCreated.label,
        localStorage.getItem("userrole") as UserRole,
        newCreated.detail
      );
      actantsCreateMutation.mutate(newActant);
    }
  };

  const handlePick = (newPicked: EntitySuggestionI) => {
    onSelected(newPicked.id, newPicked.isTemplate);
    handleClean();
  };

  const handleDropped = (newDropped: EntityDragItem) => {
    if (!isWrongDropCategory) {
      onSelected(newDropped.id, newDropped.isTemplate);
    }
    handleClean();
  };

  const [isWrongDropCategory, setIsWrongDropCategory] = useState(false);

  const handleHoverred = (newHoverred: EntityDragItem) => {
    const hoverredCategory = newHoverred.category;
    if (
      !categoryTypes.includes(hoverredCategory) ||
      (disableTemplatesAccept && newHoverred.isTemplate)
    ) {
      setIsWrongDropCategory(true);
    } else {
      setIsWrongDropCategory(false);
    }
  };

  return selectedCategory && allCategories ? (
    <Suggester
      isFetching={isFetchingStatement}
      marginTop={false}
      suggestions={suggestions || []}
      placeholder={placeholder}
      typed={typed} // input value
      category={selectedCategory} // selected category
      categories={allCategories} // all possible categories
      suggestionListPosition={""} // todo not implemented yet
      onCancel={() => {
        handleClean();
      }}
      //disabled?: boolean; // todo not implemented yet
      onType={(newType: string) => {
        setTyped(newType);
      }}
      onChangeCategory={(option: ValueType<OptionTypeBase, any>) => {
        setSelectedCategory(option);
      }}
      onCreate={(newCreated: {
        label: string;
        category: EntityClass;
        detail: string;
        territoryId?: string;
      }) => {
        handleCreate(newCreated);
      }}
      onPick={(newPicked: EntitySuggestionI) => {
        if (isInsideTemplate) {
          // TODO
        } else {
          handlePick(newPicked);
        }
      }}
      onDrop={(newDropped: EntityDragItem) => {
        if (isInsideTemplate) {
          // TODO
        } else {
          handleDropped(newDropped);
        }
      }}
      onHover={(newHoverred: EntityDragItem) => {
        handleHoverred(newHoverred);
      }}
      isWrongDropCategory={isWrongDropCategory}
      disableCreate={disableCreate}
      inputWidth={inputWidth}
    />
  ) : (
    <div />
  );
};
