import { DropdownItem, entitiesDict } from "@shared/dictionaries/entity";
import { EntityEnums } from "@shared/enums";
import { IEntity, IOption } from "@shared/types";
import { IRequestSearch } from "@shared/types/request-search";
import api from "api";
import { Button, Dropdown, Input, Loader, TypeBar } from "components";
import {
  AttributeButtonGroup,
  EntitySuggester,
  EntityTag,
} from "components/advanced";
import { useDebounce } from "hooks";
import React, { useMemo, useState } from "react";
import { RiCloseFill } from "react-icons/ri";
import { useQuery } from "react-query";
import { OptionTypeBase, ValueType } from "react-select";
import { wildCardChar } from "Theme/constants";
import useResizeObserver from "use-resize-observer";
import {
  StyledBoxContent,
  StyledResultsHeader,
  StyledResultsWrapper,
  StyledRow,
  StyledRowHeader,
} from "./EntitySearchBoxStyles";
import { EntitySearchResults } from "./EntitySearchResults/EntitySearchResults";

const initValues: IRequestSearch = {
  label: "",
  cooccurrenceId: "",
};
const defaultClassOption: DropdownItem = {
  label: "*",
  value: "",
};

const anyTemplate: DropdownItem = {
  value: "Any",
  label: "Any template",
  info: "",
};

const debounceTime: number = 100;

// the minimum pixels for the results section height
const MIN_RESULT_H = 100;

export const EntitySearchBox: React.FC = () => {
  const [classOption, setClassOption] =
    useState<DropdownItem>(defaultClassOption);
  const [templateOption, setTemplateOption] =
    useState<ValueType<OptionTypeBase, any>>(defaultClassOption);
  const [searchData, setSearchData] = useState<IRequestSearch>(initValues);
  const debouncedValues = useDebounce<IRequestSearch>(searchData, debounceTime);

  const { ref: resultRef, height = 0 } = useResizeObserver<HTMLDivElement>();

  const debouncedResultsHeight = useDebounce(height, 20);

  // check whether the search should be executed
  const validSearch = useMemo(() => {
    return (
      Object.values(debouncedValues).filter((searchValue: any) => searchValue)
        .length > 0
    );
  }, [debouncedValues]);

  // get the co-occurence entity
  const { data: cooccurrenceEntity, isFetching: cooccurrenceIsFetching } =
    useQuery(
      ["search-cooccurrence", searchData.cooccurrenceId],
      async () => {
        if (searchData?.cooccurrenceId) {
          const res = await api.entitiesGet(searchData.cooccurrenceId);
          return res.data;
        }
      },
      {
        enabled: !!searchData?.cooccurrenceId,
      }
    );

  // get the searchByTerritory entity
  const {
    data: searchTerritoryEntity,
    isFetching: searchTerritoryEntityIsFetching,
  } = useQuery(
    ["search-territory", searchData.territoryId],
    async () => {
      if (searchData?.territoryId) {
        const res = await api.entitiesGet(searchData.territoryId);
        return res.data;
      }
    },
    {
      enabled: !!searchData?.territoryId,
    }
  );

  const {
    status,
    data: entities,
    error,
    isFetching,
  } = useQuery(
    ["search", debouncedValues],
    async () => {
      if (debouncedValues.usedTemplate === "Any") {
        const { usedTemplate, ...filters } = debouncedValues;
        filters.onlyTemplates = true;
        const res = await api.entitiesSearch(filters);
        return res.data;
      }
      console.log("getting a new search", debouncedValues);
      const res = await api.entitiesSearch(debouncedValues);
      return res.data;
    },
    {
      enabled: api.isLoggedIn() && validSearch,
    }
  );

  // get all templates for the "limit by template" option
  const {
    status: templateStatus,
    data: templates,
    error: templateError,
    isFetching: isFetchingTemplates,
  } = useQuery(
    ["search-templates", searchData, classOption],
    async () => {
      const res = await api.entitiesSearch({
        onlyTemplates: true,
        class: searchData.class,
      });

      const templates = res.data;

      templates.sort((a: IEntity, b: IEntity) =>
        a.label.toLocaleLowerCase() > b.label.toLocaleLowerCase() ? 1 : -1
      );
      return templates;
    },
    { enabled: api.isLoggedIn() }
  );

  const options: DropdownItem[] = entitiesDict.filter(
    (e) => e.value !== "A" && e.value !== "R" && e.value !== "X"
  );

  // apply changes to search parameters
  const handleChange = (changes: {
    [key: string]:
      | string
      | false
      | true
      | undefined
      | ValueType<OptionTypeBase, any>;
  }) => {
    const newSearch = {
      ...searchData,
      ...changes,
    };

    // remove parameters where the value is set to undefined
    Object.keys(changes).forEach((changeKey) => {
      const value = changes[changeKey];
      if (value === undefined) {
        delete changes[changeKey];
      }
    });

    setSearchData(newSearch);
  };

  // sort found entities by label
  const sortedEntities = useMemo(() => {
    if (entities) {
      const sorted = [...entities];
      sorted.sort((a: IEntity, b: IEntity) =>
        a.label.toLocaleLowerCase() > b.label.toLocaleLowerCase() ? 1 : -1
      );
      return entities;
    }
    return [];
  }, [entities]);

  const templateOptions: DropdownItem[] = useMemo(() => {
    const options: DropdownItem[] = [anyTemplate];

    if (templates) {
      templates.forEach((template) => {
        if (template.label.length > 20) {
          options.push({
            value: template.id,
            label: template.label.substring(0, 20) + "...",
          });
        } else {
          options.push({
            value: template.id,
            label: template.label,
          });
        }
      });
    }
    return options;
  }, [templates]);

  return (
    <StyledBoxContent>
      <StyledRow>
        <StyledRowHeader>Label (at least 2 characters)</StyledRowHeader>
        <Input
          width={150}
          placeholder="search"
          changeOnType
          onChangeFn={(value: string) => {
            value.length
              ? handleChange({ label: value + wildCardChar })
              : handleChange({ label: value });
          }}
        />
      </StyledRow>
      <StyledRow>
        <StyledRowHeader>Limit by class</StyledRowHeader>
        <div style={{ position: "relative" }}>
          <Dropdown
            placeholder={""}
            width={150}
            entityDropdown
            options={[defaultClassOption].concat(options)}
            value={classOption}
            onChange={(option: ValueType<OptionTypeBase, any>) => {
              setClassOption(option as DropdownItem);
              setTemplateOption(defaultClassOption);
              handleChange({
                class: (option as IOption).value,
                usedTemplate: defaultClassOption.value,
              });
            }}
          />
          <TypeBar entityLetter={(classOption as IOption).value} />
        </div>
      </StyledRow>
      <StyledRow>
        <StyledRowHeader>Limit by template</StyledRowHeader>
        <Dropdown
          placeholder={""}
          width={150}
          options={[defaultClassOption].concat(templateOptions)}
          value={templateOption}
          onChange={(option: ValueType<OptionTypeBase, any>) => {
            setTemplateOption(option);
            handleChange({ usedTemplate: (option as IOption).value });
          }}
        />
      </StyledRow>

      <StyledRow>
        <StyledRowHeader>Limit by territory</StyledRowHeader>
        {debouncedValues.territoryId && searchTerritoryEntity ? (
          <>
            <Loader size={26} show={searchTerritoryEntityIsFetching} />
            {searchTerritoryEntity && (
              <EntityTag
                entity={searchTerritoryEntity}
                tooltipPosition={"left"}
                button={
                  <Button
                    key="d"
                    icon={<RiCloseFill />}
                    color="danger"
                    inverted
                    tooltipLabel="unlink entity"
                    onClick={() => {
                      handleChange({
                        territoryId: "",
                        subTerritorySearch: undefined,
                      });
                    }}
                  />
                }
              />
            )}
          </>
        ) : (
          <div>
            <EntitySuggester
              disableTemplatesAccept
              categoryTypes={[EntityEnums.Class.Territory]}
              onSelected={(newSelectedId: string) => {
                handleChange({ territoryId: newSelectedId });
              }}
              placeholder={"territory"}
              disableCreate
              inputWidth={114}
            />
          </div>
        )}
      </StyledRow>

      {debouncedValues.territoryId && (
        <StyledRow>
          <StyledRowHeader>Territory children</StyledRowHeader>
          {searchTerritoryEntity && (
            <AttributeButtonGroup
              options={[
                {
                  longValue: "included",
                  shortValue: "included",
                  onClick: () => {
                    handleChange({ subTerritorySearch: true });
                  },
                  selected: debouncedValues.subTerritorySearch === true,
                },
                {
                  longValue: "not included",
                  shortValue: "not included",
                  onClick: () => {
                    handleChange({ subTerritorySearch: undefined });
                  },
                  selected: debouncedValues.subTerritorySearch !== true,
                },
              ]}
            />
          )}
        </StyledRow>
      )}

      <StyledRow>
        <StyledRowHeader>Limit by co-occurrence</StyledRowHeader>
        {debouncedValues.cooccurrenceId ? (
          <>
            <Loader size={26} show={cooccurrenceIsFetching} />
            {cooccurrenceEntity && (
              <EntityTag
                entity={cooccurrenceEntity}
                tooltipPosition={"left"}
                button={
                  <Button
                    key="d"
                    icon={<RiCloseFill />}
                    color="danger"
                    inverted
                    tooltipLabel="unlink entity"
                    onClick={() => {
                      handleChange({ cooccurrenceId: "" });
                    }}
                  />
                }
              />
            )}
          </>
        ) : (
          <div>
            <EntitySuggester
              disableTemplatesAccept
              categoryTypes={[
                EntityEnums.Class.Statement,
                EntityEnums.Class.Action,
                EntityEnums.Class.Territory,
                EntityEnums.Class.Resource,
                EntityEnums.Class.Person,
                EntityEnums.Class.Being,
                EntityEnums.Class.Group,
                EntityEnums.Class.Object,
                EntityEnums.Class.Concept,
                EntityEnums.Class.Location,
                EntityEnums.Class.Value,
                EntityEnums.Class.Event,
              ]}
              onSelected={(newSelectedId: string) => {
                handleChange({ cooccurrenceId: newSelectedId });
              }}
              placeholder={"entity"}
              disableCreate
              inputWidth={114}
            />
          </div>
        )}
      </StyledRow>

      <StyledResultsHeader>
        {sortedEntities.length > 0 && (
          <>{`Results (${sortedEntities.length})`}</>
        )}
      </StyledResultsHeader>

      {/* StyledResultsWrapper is used to calculate size for infinite scroll, don't put any other components inside! */}
      <StyledResultsWrapper ref={resultRef}>
        {/* RESULTS */}
        {sortedEntities.length > 0 && (
          <>
            <EntitySearchResults
              results={sortedEntities}
              height={
                debouncedResultsHeight > MIN_RESULT_H
                  ? debouncedResultsHeight
                  : MIN_RESULT_H
              }
            />
          </>
        )}
        <Loader show={isFetching} />
      </StyledResultsWrapper>
    </StyledBoxContent>
  );
};

export const MemoizedEntitySearchBox = React.memo(EntitySearchBox);
