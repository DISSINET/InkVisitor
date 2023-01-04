import { EntityEnums, UserEnums } from "@shared/enums";
import { IEntity, IOption, IStatement, ITerritory } from "@shared/types";
import api from "api";
import { Suggester } from "components";
import {
  CEntity,
  CStatement,
  CTerritoryActant,
  DEntity,
  DStatement,
  InstTemplate,
} from "constructors";
import { useDebounce, useSearchParams } from "hooks";
import React, { useEffect, useState } from "react";
import { FaHome } from "react-icons/fa";
import { useMutation, useQuery } from "react-query";
import { OptionTypeBase, ValueType } from "react-select";
import { DropdownAny, rootTerritoryId, wildCardChar } from "Theme/constants";
import { EntityDragItem } from "types";

interface EntitySuggester {
  categoryTypes: EntityEnums.ExtendedClass[];
  onSelected: (id: string) => void;
  placeholder?: string;
  inputWidth?: number | "full";
  openDetailOnCreate?: boolean;
  territoryActants?: string[];
  excludedEntities?: EntityEnums.Class[];
  excludedActantIds?: string[];
  filterEditorRights?: boolean;
  isInsideTemplate?: boolean;
  territoryParentId?: string;

  disableCreate?: boolean;
  disableTemplateInstantiation?: boolean;
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
  disableTemplateInstantiation = false,
  disableWildCard = false,
  disableTemplatesAccept = false,
}) => {
  const [typed, setTyped] = useState<string>("");
  const debouncedTyped = useDebounce(typed, 100);
  const [selectedCategory, setSelectedCategory] = useState<any>();
  const [allCategories, setAllCategories] = useState<IOption[]>();

  const { appendDetailId, setSelectedDetailId } = useSearchParams();
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
        if (a.status === EntityEnums.Status.Discouraged) {
          return 1;
        } else {
          return -1;
        }
      });
      return resSuggestions.data
        .filter((s) =>
          filterEditorRights && userRole !== UserEnums.Role.Admin
            ? s.right === UserEnums.RoleMode.Write
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
        label: EntityEnums.Extension.Any,
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
          setSelectedDetailId(variables.id);
        }
      },
    }
  );

  const handleCreate = (newCreated: {
    label: string;
    entityClass: EntityEnums.Class;
    detail?: string;
    territoryId?: string;
  }) => {
    if (
      newCreated.entityClass === EntityEnums.Class.Statement &&
      newCreated.territoryId
    ) {
      const newStatement = CStatement(
        localStorage.getItem("userrole") as UserEnums.Role,
        newCreated.territoryId,
        newCreated.label,
        newCreated.detail
      );
      actantsCreateMutation.mutate(newStatement);
    } else if (newCreated.entityClass === EntityEnums.Class.Territory) {
      const newTerritory = CTerritoryActant(
        newCreated.label,
        newCreated.territoryId ? newCreated.territoryId : rootTerritoryId,
        -1,
        localStorage.getItem("userrole") as UserEnums.Role,
        newCreated.detail
      );
      actantsCreateMutation.mutate(newTerritory);
    } else {
      const newEntity = CEntity(
        newCreated.entityClass,
        newCreated.label,
        localStorage.getItem("userrole") as UserEnums.Role,
        newCreated.detail
      );
      actantsCreateMutation.mutate(newEntity);
    }
  };

  const handleInstantiateTemplate = async (
    templateToDuplicate: IEntity | IStatement | ITerritory
  ) => {
    const newEntityId = await InstTemplate(
      templateToDuplicate,
      localStorage.getItem("userrole") as UserEnums.Role
    );
    if (newEntityId) {
      onSelected(newEntityId);
      handleClean();
      if (openDetailOnCreate) {
        appendDetailId(newEntityId);
        setSelectedDetailId(newEntityId);
      }
    }
  };

  const handlePick = (newPicked: IEntity, instantiateTemplate?: boolean) => {
    if (instantiateTemplate && !disableTemplateInstantiation) {
      handleInstantiateTemplate(newPicked);
    } else {
      onSelected(newPicked.id);
      handleClean();
    }
  };

  const handleDropped = (
    newDropped: EntityDragItem,
    instantiateTemplate?: boolean
  ) => {
    if (!isWrongDropCategory) {
      if (instantiateTemplate && !disableTemplateInstantiation) {
        newDropped.entity && handleInstantiateTemplate(newDropped.entity);
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
      (newHoverred.isTemplate &&
        newHoverred.entityClass === EntityEnums.Class.Territory &&
        !territoryParentId) ||
      excludedActantIds.includes(newHoverred.id)
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
        entityClass: EntityEnums.Class;
        detail?: string;
        territoryId?: string;
      }) => {
        handleCreate(newCreated);
      }}
      onPick={(newPicked: IEntity, instantiateTemplate?: boolean) => {
        handlePick(newPicked, instantiateTemplate);
      }}
      onDrop={(newDropped: EntityDragItem, instantiateTemplate?: boolean) => {
        handleDropped(newDropped, instantiateTemplate);
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
