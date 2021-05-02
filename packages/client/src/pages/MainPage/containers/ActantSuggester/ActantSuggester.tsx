import React, { useEffect, useState } from "react";

import { Suggester, SuggestionI } from "components/Suggester/Suggester";
import { IOption, IActant } from "@shared/types";

import { FaHome } from "react-icons/fa";
import { CActant } from "constructors";
import { Entities } from "types";
import { useQuery, useQueryClient } from "react-query";
import api from "api";
import { CategoryActantType } from "@shared/enums";

const queryString = require("query-string");

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
  //const [territoryActantIds, setTerritoryActantIds] = useState<string[]>([]);

  var hashParams = queryString.parse(location.hash);
  const queryClient = useQueryClient();
  const territoryId = hashParams.territory;

  // territory query
  const { status, data: territoryActants, error, isFetching } = useQuery(
    ["territory", "suggesters", territoryId],
    async () => {
      const res = await api.actantIdsInTerritory(territoryId);
      //setTerritoryActantIds(res.data.actants.map((a) => a.id));
      return res.data;
    },
    { initialData: [], enabled: !!territoryId }
  );

  // Suggesions query
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

        const icons: React.ReactNode[] = [];

        //console.log(territoryActants, territoryActantIds, s.id);
        if ((territoryActants as string[])?.includes(s.id)) {
          icons.push(<FaHome key={s.id} color="" />);
        }
        return {
          color: entity.color,
          category: s.class,
          label: s.label,
          id: s.id,
          icons: icons,
        };
      });
    },
    { enabled: typed.length > 2 && !!selectedCategory && api.isLoggedIn() }
  );

  const handleClean = () => {
    setTyped("");
  };

  const handleKeyPress = (event: KeyboardEvent) => {
    if (event.key === "Escape") {
      handleClean();
    }
  };

  // clean on escape press
  useEffect(() => {
    document.addEventListener("keydown", handleKeyPress);
    return () => {
      window.removeEventListener("keydown", handleKeyPress);
    };
  }, []);

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
    category: CategoryActantType;
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
      displayCancelButton={typed.length > 0}
      onCancel={() => {
        handleClean();
      }}
      //disabled?: boolean; // todo not implemented yet
      onType={(newType: string) => {
        handleTyped(newType);
      }}
      onChangeCategory={(newCategory: string) =>
        handleCategoryChanged(newCategory)
      }
      onCreate={(newCreated: {
        label: string;
        category: CategoryActantType;
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
