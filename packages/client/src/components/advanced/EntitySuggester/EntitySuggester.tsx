import {
  EntityClass,
  EntityExtension,
  EntityStatus,
  ExtendedEntityClass,
  UserRole,
  UserRoleMode,
} from "@shared/enums";
import { IEntity, IOption, IStatement, ITerritory } from "@shared/types";
import api from "api";
import { Suggester } from "components";
import {
  CEntity,
  CStatement,
  CTerritoryActant,
  DEntity,
  DStatement,
} from "constructors";
import { useDebounce, useSearchParams } from "hooks";
import React, { useEffect, useState } from "react";
import { FaHome } from "react-icons/fa";
import { useMutation, useQuery } from "react-query";
import { OptionTypeBase, ValueType } from "react-select";
import { DropdownAny, rootTerritoryId, wildCardChar } from "Theme/constants";
import { EntityDragItem } from "types";

interface EntitySuggester {
  categoryTypes: ExtendedEntityClass[];
  onSelected: (id: string) => void;
  placeholder?: string;
  inputWidth?: number | "full";
  openDetailOnCreate?: boolean;
  territoryActants?: string[];
  excludedEntities?: EntityClass[];
  excludedActantIds?: string[];
  filterEditorRights?: boolean;
  isInsideTemplate?: boolean;
  territoryParentId?: string;

  disableCreate?: boolean;
  disableDuplicate?: boolean;
  disableWildCard?: boolean;
  disableTemplatesAccept?: boolean;
}

export const EntitySuggester: React.FC<EntitySuggester> = ({
  categoryTypes,
  onSelected,
  placeholder = "",
  inputWidth,
  openDetailOnCreate = false,
  territoryActants,
  excludedEntities = [],
  filterEditorRights = false,
  excludedActantIds = [],
  isInsideTemplate = false,
  territoryParentId,

  disableCreate,
  disableDuplicate = false,
  disableWildCard = false,
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
            : selectedCategory?.value,
        excluded: excludedEntities.length ? excludedEntities : undefined,
      });

      const suggestions = resSuggestions.data;
      suggestions.sort((a, b) => {
        if (a.status === EntityStatus.Discouraged) {
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
        .filter((s) => (disableTemplatesAccept ? !s.isTemplate : s))
        .filter((s) => categoryTypes.includes(s.class))
        .map((entity: IEntity) => {
          const icons: React.ReactNode[] = [];

          if (territoryActants?.includes(entity.id)) {
            icons.push(<FaHome key={entity.id} color="" />);
          }

          return {
            entity: entity,
            icons: icons,
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
    async (newActant: IEntity | IStatement | ITerritory) =>
      await api.entityCreate(newActant),
    {
      onSuccess: (data, variables) => {
        onSelected(variables.id);
        handleClean();
        if (openDetailOnCreate) {
          appendDetailId(variables.id);
        }
      },
    }
  );

  const handleCreate = (newCreated: {
    label: string;
    entityClass: EntityClass;
    detail?: string;
    territoryId?: string;
  }) => {
    if (
      newCreated.entityClass === EntityClass.Statement &&
      newCreated.territoryId
    ) {
      const newStatement = CStatement(
        localStorage.getItem("userrole") as UserRole,
        newCreated.territoryId,
        newCreated.label,
        newCreated.detail
      );
      actantsCreateMutation.mutate(newStatement);
    } else if (newCreated.entityClass === EntityClass.Territory) {
      const newTerritory = CTerritoryActant(
        newCreated.label,
        newCreated.territoryId ? newCreated.territoryId : rootTerritoryId,
        -1,
        localStorage.getItem("userrole") as UserRole,
        newCreated.detail
      );
      actantsCreateMutation.mutate(newTerritory);
    } else {
      const newEntity = CEntity(
        newCreated.entityClass,
        newCreated.label,
        localStorage.getItem("userrole") as UserRole,
        newCreated.detail
      );
      actantsCreateMutation.mutate(newEntity);
    }
  };

  const handleDuplicate = (
    templateToDuplicate: IEntity | IStatement | ITerritory
  ) => {
    if (templateToDuplicate.class === EntityClass.Statement) {
      const newStatement = DStatement(
        templateToDuplicate as IStatement,
        localStorage.getItem("userrole") as UserRole,
        true
      );
      actantsCreateMutation.mutate(newStatement);
    } else if (templateToDuplicate.class === EntityClass.Territory) {
      if (territoryParentId) {
        const newTerritory = DEntity(
          templateToDuplicate as IEntity,
          localStorage.getItem("userrole") as UserRole,
          true
        );
        newTerritory.data.parent.id = territoryParentId;
        actantsCreateMutation.mutate(newTerritory);
      }
    } else {
      const newEntity = DEntity(
        templateToDuplicate as IEntity,
        localStorage.getItem("userrole") as UserRole,
        true
      );
      actantsCreateMutation.mutate(newEntity);
    }
  };

  const handlePick = (newPicked: IEntity, duplicate?: boolean) => {
    if (duplicate && !disableDuplicate) {
      handleDuplicate(newPicked);
    } else {
      onSelected(newPicked.id);
      handleClean();
    }
  };

  const handleDropped = (newDropped: EntityDragItem, duplicate?: boolean) => {
    if (!isWrongDropCategory) {
      if (duplicate && !disableDuplicate) {
        newDropped.entity && handleDuplicate(newDropped.entity);
      } else {
        onSelected(newDropped.id);
        handleClean();
      }
    }
  };

  const [isWrongDropCategory, setIsWrongDropCategory] = useState(false);

  const handleHoverred = (newHoverred: EntityDragItem) => {
    const hoverredCategory = newHoverred.entityClass;
    if (
      !categoryTypes.includes(hoverredCategory) ||
      (disableTemplatesAccept && newHoverred.isTemplate) ||
      newHoverred.isDiscouraged ||
      (newHoverred.entityClass === EntityClass.Territory && !territoryParentId)
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
      onChangeCategory={(option: ValueType<OptionTypeBase, any> | null) => {
        setSelectedCategory(option);
      }}
      onCreate={(newCreated: {
        label: string;
        entityClass: EntityClass;
        detail?: string;
        territoryId?: string;
      }) => {
        handleCreate(newCreated);
      }}
      onPick={(newPicked: IEntity, duplicate?: boolean) => {
        handlePick(newPicked, duplicate);
      }}
      onDrop={(newDropped: EntityDragItem, duplicate?: boolean) => {
        handleDropped(newDropped, duplicate);
      }}
      onHover={(newHoverred: EntityDragItem) => {
        handleHoverred(newHoverred);
      }}
      isWrongDropCategory={isWrongDropCategory}
      disableCreate={disableCreate}
      inputWidth={inputWidth}
      isInsideTemplate={isInsideTemplate}
      territoryParentId={territoryParentId}
    />
  ) : (
    <div />
  );
};
