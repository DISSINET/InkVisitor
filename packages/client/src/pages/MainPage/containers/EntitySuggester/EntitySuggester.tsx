import React, { useEffect, useState } from "react";

import { Suggester, SuggestionI } from "components/Suggester/Suggester";
import { IOption, IActant } from "@shared/types";

import { FaHome } from "react-icons/fa";
import { CActant, CStatement, CTerritoryActant } from "constructors";
import { Entities } from "types";
import { useMutation, useQuery, useQueryClient } from "react-query";
import api from "api";
import {
  ActantStatus,
  ActantType,
  AllActantType,
  CategoryActantType,
  UserRole,
} from "@shared/enums";
import { useDebounce, useSearchParams } from "hooks";
import { rootTerritoryId } from "Theme/constants";
import { DragObjectWithType } from "react-dnd";

interface EntitySuggesterI {
  categoryTypes: ActantType[];
  onSelected: Function;
  placeholder?: string;
  allowCreate?: boolean;
  disableWildCard?: boolean;
  inputWidth?: number | "full";
  openDetailOnCreate?: boolean;
  territoryActants?: string[];
  excludedEntities?: ActantType[];
  filterEditorRights?: boolean;
}

export const EntitySuggester: React.FC<EntitySuggesterI> = ({
  categoryTypes,
  onSelected,
  placeholder = "",
  allowCreate,
  inputWidth,
  disableWildCard = false,
  openDetailOnCreate = false,
  territoryActants,
  excludedEntities = [],
  filterEditorRights,
}) => {
  const wildCardCategory = ActantType.Any;
  const queryClient = useQueryClient();
  const [typed, setTyped] = useState<string>("");
  const debouncedTyped = useDebounce(typed, 100);
  const [selectedCategory, setSelectedCategory] = useState<string>();
  const [allCategories, setAllCategories] = useState<IOption[]>();

  const { setActantId } = useSearchParams();

  // Suggesions query
  const {
    status: statusStatement,
    data: suggestions,
    error: errorStatement,
    isFetching: isFetchingStatement,
  } = useQuery(
    ["suggestion", debouncedTyped, selectedCategory],
    async () => {
      const resSuggestions = await api.actantsGetMore({
        label: debouncedTyped,
        class:
          selectedCategory === wildCardCategory.valueOf()
            ? false
            : selectedCategory,
        excluded: excludedEntities.length ? excludedEntities : undefined,
      });
      return resSuggestions.data
        .filter((s) => s.status !== ActantStatus.Discouraged)
        .map((s: IActant) => {
          const entity = Entities[s.class];

          const icons: React.ReactNode[] = [];

          if (territoryActants?.includes(s.id)) {
            icons.push(<FaHome key={s.id} color="" />);
          }
          return {
            color: entity.color,
            category: s.class,
            label: s.label,
            detail: s.detail,
            status: s.status,
            ltype: s.data.logicalType,
            id: s.id,
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
          .includes(selectedCategory) &&
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
        label: wildCardCategory.valueOf(),
        value: wildCardCategory.valueOf(),
      });
    }
    if (categories.length) {
      setAllCategories(categories);
      setSelectedCategory(categories[0].value);
    }
  }, [categoryTypes]);

  const handleCategoryChanged = (newCategory: string) => {
    setSelectedCategory(newCategory);
  };

  const actantsCreateMutation = useMutation(
    async (newActant: IActant) => await api.actantsCreate(newActant),
    {
      onSuccess: (data, variables) => {
        onSelected(variables.id);
        handleClean();
        if (variables.class === "T") {
          queryClient.invalidateQueries("tree");
        }
        if (openDetailOnCreate) {
          setActantId(variables.id);
        }
      },
    }
  );

  const handleCreate = async (newCreated: {
    label: string;
    category: ActantType;
    detail: string;
    territoryId?: string;
  }) => {
    if (
      newCreated.category === ActantType.Statement &&
      newCreated.territoryId
    ) {
      const newStatement = CStatement(
        newCreated.territoryId,
        localStorage.getItem("userrole") as UserRole
      );
      actantsCreateMutation.mutate(newStatement);
    } else if (newCreated.category === ActantType.Territory) {
      // TODO: add possibility to select territory
      const newActant = CTerritoryActant(
        newCreated.label,
        rootTerritoryId,
        -1,
        localStorage.getItem("userrole") as UserRole
      );
      actantsCreateMutation.mutate(newActant);
    } else {
      const newActant = CActant(
        newCreated.category as CategoryActantType,
        newCreated.label,
        localStorage.getItem("userrole") as UserRole,
        newCreated.detail
      );
      actantsCreateMutation.mutate(newActant);
    }
  };

  const handlePick = (newPicked: SuggestionI) => {
    onSelected(newPicked.id);
    handleClean();
  };
  const handleDropped = (newDropped: any) => {
    const droppedCategory = newDropped.category;
    if (categoryTypes.includes(droppedCategory)) {
      onSelected(newDropped.id);
    }
    handleClean();
  };

  const [isWrongDropCategory, setIsWrongDropCategory] = useState(false);

  const handleHoverred = (newHoverred: any) => {
    const hoverredCategory = newHoverred.category;
    if (!categoryTypes.includes(hoverredCategory)) {
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
      onChangeCategory={(newCategory: string) =>
        handleCategoryChanged(newCategory)
      }
      onCreate={(newCreated: {
        label: string;
        category: AllActantType;
        detail: string;
        territoryId?: string;
      }) => {
        handleCreate(newCreated);
      }}
      onPick={(newPicked: SuggestionI) => {
        handlePick(newPicked);
      }}
      onDrop={(newDropped: DragObjectWithType) => {
        handleDropped(newDropped);
      }}
      onHover={(newHoverred: DragObjectWithType) => {
        handleHoverred(newHoverred);
      }}
      isWrongDropCategory={isWrongDropCategory}
      allowCreate={allowCreate}
      inputWidth={inputWidth}
    />
  ) : (
    <div />
  );
};
