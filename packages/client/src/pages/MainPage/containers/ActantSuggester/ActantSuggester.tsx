import React, { useEffect, useState } from "react";

import { Suggester, SuggestionI } from "components/Suggester/Suggester";
import { IOption, IActant } from "@shared/types";

import { CActant } from "constructors";
import { Entities } from "types";
import { useQuery, useQueryClient } from "react-query";
import api from "api";

interface ActantSuggesterI {
  categoryIds: string[];
  onSelected: Function;
  placeholder?: string;
}

export const ActantSuggester: React.FC<ActantSuggesterI> = ({
  categoryIds,
  onSelected,
  placeholder = "",
}) => {
  const [typed, setTyped] = useState<string>("");
  const [selectedCategory, setSelectedCategory] = useState<string>();
  const [allCategories, setAllCategories] = useState<false | IOption[]>();

  const queryClient = useQueryClient();

  // Statement query
  const {
    status: statusStatement,
    data: suggestions,
    error: errorStatement,
    isFetching: isFetchingStatement,
  } = useQuery(
    ["suggestion", typed, selectedCategory],
    async () => {
      const resSuggestions = await api.actantsGetMore({
        label: typed,
        class: selectedCategory,
      });
      return resSuggestions.data.map((s: IActant) => {
        const entity = Entities[s.class];
        return {
          color: entity.color,
          category: s.class,
          label: s.label,
          id: s.id,
        };
      });
    },
    { enabled: typed.length > 2 && !!selectedCategory }
  );

  const handleClean = () => {
    setTyped("");
  };

  // initial load of categories
  useEffect(() => {
    const categories: IOption[] = [];
    categoryIds.forEach((categoryId) => {
      const foundEntityCategory = Entities[categoryId];
      if (foundEntityCategory) {
        categories.push({
          label: foundEntityCategory.id,
          value: foundEntityCategory.id,
        });
      }
    });
    if (categories.length) {
      setAllCategories(categories);
      setSelectedCategory(categories[0].value);
    }
  }, [categoryIds]);

  const handleTyped = (newType: string) => {
    setTyped(newType);
  };
  const handleCategoryChanged = (newCategory: string) => {
    setSelectedCategory(newCategory);
  };

  const handleCreate = async (newCreated: {
    label: string;
    category: "P" | "G" | "O" | "C" | "L" | "V" | "E";
  }) => {
    const newActant = CActant(newCreated.category, newCreated.label);
    const resCreate = await api.actantsCreate(newActant);
    onSelected(newActant.id);
    handleClean();
  };
  const handlePick = (newPicked: SuggestionI) => {
    onSelected(newPicked.id);
    handleClean();
  };
  const handleDropped = (newDropped: any) => {
    const droppedCategory = newDropped.category;
    if (categoryIds.includes(droppedCategory)) {
      onSelected(newDropped.id);
    }
    handleClean();
  };

  return selectedCategory && allCategories ? (
    <Suggester
      marginTop={false}
      suggestions={suggestions || []}
      placeholder={placeholder}
      typed={typed} // input value
      category={selectedCategory} // selected category
      categories={allCategories} // all possible categories
      suggestionListPosition={""} // todo not implemented yet
      //disabled?: boolean; // todo not implemented yet
      onType={(newType: string) => {
        handleTyped(newType);
      }}
      onChangeCategory={(newCategory: string) =>
        handleCategoryChanged(newCategory)
      }
      onCreate={(newCreated: {
        label: string;
        category: "P" | "G" | "O" | "C" | "L" | "V" | "E";
      }) => {
        handleCreate(newCreated);
      }}
      onPick={(newPicked: SuggestionI) => {
        handlePick(newPicked);
      }}
      onDrop={(newDropped: any) => {
        handleDropped(newDropped);
      }}
    />
  ) : (
    <div></div>
  );
};
