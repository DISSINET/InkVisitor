import { entityStatusDict, languageDict } from "@shared/dictionaries";
import { entitiesDict } from "@shared/dictionaries/entity";
import { EntityEnums } from "@shared/enums";
import { IEntity } from "@shared/types";
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
import { useQuery } from "@tanstack/react-query";
import { wildCardChar } from "Theme/constants";
import { DropdownItem } from "types";
import useResizeObserver from "use-resize-observer";
import {
  StyledBoxContent,
  StyledDatePicker,
  StyledDateTag,
  StyledDateTagButton,
  StyledDateTagText,
  StyledResultsHeader,
  StyledResultsWrapper,
  StyledRow,
  StyledRowHeader,
} from "./EntitySearchBoxStyles";
import { EntitySearchResults } from "./EntitySearchResults/EntitySearchResults";
import { BsFilter } from "react-icons/bs";
import { useAppSelector } from "redux/hooks";

const initValues: IRequestSearch = {
  label: "",
  cooccurrenceId: "",
};
const defaultClassOption: DropdownItem = {
  label: "*",
  value: "",
};

const defaultStatusOption: DropdownItem = {
  label: "all",
  value: "",
};
const statusOptions: DropdownItem[] = [defaultStatusOption].concat(
  entityStatusDict
);

const defaultLanguageOption: DropdownItem = {
  label: "all",
  value: "",
};
const languageOptions: DropdownItem[] = [defaultLanguageOption].concat(
  languageDict
);

const anyTemplate: DropdownItem = {
  value: "Any",
  label: "Any template",
  info: "",
};

const debounceTime: number = 500;

// the minimum pixels for the results section height
const MIN_RESULT_H = 100;

export const EntitySearchBox: React.FC = () => {
  const [classOption, setClassOption] =
    useState<DropdownItem>(defaultClassOption);
  const [templateOption, setTemplateOption] =
    useState<DropdownItem>(defaultClassOption);
  const [searchData, setSearchData] = useState<IRequestSearch>(initValues);
  const debouncedValues = useDebounce<IRequestSearch>(searchData, debounceTime);

  const { ref: resultRef, height = 0 } = useResizeObserver<HTMLDivElement>();

  const debouncedResultsHeight = useDebounce(height, 20);

  const statusOptionSelected: DropdownItem = useMemo(() => {
    if (!!debouncedValues.status) {
      return (
        statusOptions.find((option) => {
          return option.value === debouncedValues.status;
        }) || defaultStatusOption
      );
    }
    return defaultStatusOption;
  }, [debouncedValues.status]);

  const languageOptionSelected: DropdownItem = useMemo(() => {
    if (!!debouncedValues.language) {
      return (
        languageOptions.find((option) => {
          return option.value === debouncedValues.language;
        }) || defaultLanguageOption
      );
    }
    return defaultLanguageOption;
  }, [debouncedValues.language]);

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

  const classOptions: DropdownItem[] = entitiesDict.filter(
    (e) => e.value !== "R" && e.value !== "X"
  );

  // apply changes to search parameters
  const handleChange = (changes: {
    [key: string]:
      | string
      | false
      | true
      | undefined
      | DropdownItem
      | Date
      | string[];
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

  const showAdvancedOptions: boolean = useAppSelector(
    (state) => state.searchBox.showAdvancedOptions
  );

  return (
    <StyledBoxContent>
      <StyledRow>
        <StyledRowHeader>Label (at least 2 characters)</StyledRowHeader>
        <Input
          width="full"
          placeholder="search"
          changeOnType
          onChangeFn={(value: string) => {
            value.length
              ? handleChange({ label: value + wildCardChar })
              : handleChange({ label: value });
          }}
        />
      </StyledRow>

      {showAdvancedOptions && (
        <>
          {" "}
          <StyledRow>
            <StyledRowHeader>Limit by class</StyledRowHeader>
            <div style={{ position: "relative" }}>
              <Dropdown
                placeholder={""}
                width="full"
                entityDropdown
                options={[defaultClassOption].concat(classOptions)}
                value={classOption}
                onChange={(selectedOption) => {
                  setClassOption(selectedOption[0]);
                  setTemplateOption(defaultClassOption);
                  handleChange({
                    class: selectedOption[0].value,
                    usedTemplate: defaultClassOption.value,
                  });
                }}
              />
              <TypeBar entityLetter={(classOption as DropdownItem).value} />
            </div>
          </StyledRow>
          <StyledRow>
            <StyledRowHeader>ID</StyledRowHeader>
            <Input
              width="full"
              placeholder="ID"
              changeOnType
              onChangeFn={(value: string) =>
                handleChange({ entityIds: [value] })
              }
            />
          </StyledRow>
          <StyledRow>
            <StyledRowHeader>Limit by status</StyledRowHeader>
            <div style={{ position: "relative" }}>
              <Dropdown
                placeholder={""}
                width="full"
                options={statusOptions}
                value={statusOptionSelected}
                onChange={(selectedOption) => {
                  handleChange({
                    status: selectedOption[0].value,
                  });
                }}
              />
              <TypeBar entityLetter={(classOption as DropdownItem).value} />
            </div>
          </StyledRow>
          <StyledRow>
            <StyledRowHeader>Limit by language</StyledRowHeader>
            <div style={{ position: "relative" }}>
              <Dropdown
                placeholder={""}
                width="full"
                options={languageOptions}
                value={languageOptionSelected}
                onChange={(selectedOption) => {
                  handleChange({
                    language: selectedOption[0].value,
                  });
                }}
              />
              <TypeBar entityLetter={(classOption as DropdownItem).value} />
            </div>
          </StyledRow>
          {/* <StyledRow>
          <StyledRowHeader>Limit by template</StyledRowHeader>
          <Dropdown
            placeholder={""}
            width="full"
            options={[defaultClassOption].concat(templateOptions)}
            value={templateOption}
            onChange={(selectedOption) => {
              setTemplateOption(option);
              handleChange({ usedTemplate: (selectedOption[0]).value });
            }}
          />
        </StyledRow> */}
          <StyledRow>
            <StyledRowHeader>Limit by territory</StyledRowHeader>
            {debouncedValues.territoryId && searchTerritoryEntity ? (
              <>
                <Loader size={26} show={searchTerritoryEntityIsFetching} />
                {searchTerritoryEntity && (
                  <EntityTag
                    entity={searchTerritoryEntity}
                    tooltipPosition={"left"}
                    unlinkButton={{
                      onClick: () => {
                        handleChange({
                          territoryId: "",
                          subTerritorySearch: undefined,
                        });
                      },
                      color: "danger",
                      icon: <RiCloseFill />,
                    }}
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
                  inputWidth="full"
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
                    tooltipPosition="left"
                    unlinkButton={{
                      onClick: () => {
                        handleChange({ cooccurrenceId: "" });
                      },
                      color: "danger",
                      icon: <RiCloseFill />,
                    }}
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
                  inputWidth="full"
                />
              </div>
            )}
          </StyledRow>
          <StyledRow>
            <StyledRowHeader>Created at</StyledRowHeader>
            {debouncedValues.createdDate ? (
              <StyledDateTag>
                <StyledDateTagText>
                  {debouncedValues.createdDate.toDateString()}
                </StyledDateTagText>
                <StyledDateTagButton
                  key="d"
                  icon={<RiCloseFill />}
                  color="white"
                  noBorder
                  noBackground
                  inverted
                  tooltipLabel="remove date"
                  onClick={() => {
                    handleChange({ createdDate: undefined });
                  }}
                />
              </StyledDateTag>
            ) : (
              <StyledDatePicker
                type="date"
                id="created-date"
                width="full"
                name="created-date"
                onChange={(e) => {
                  const createdDate = new Date(e.target.value);
                  handleChange({ createdDate });
                }}
              />
            )}
          </StyledRow>
          <StyledRow>
            <StyledRowHeader>Udpated at</StyledRowHeader>
            {debouncedValues.updatedDate ? (
              <StyledDateTag>
                <StyledDateTagText>
                  {debouncedValues.updatedDate.toDateString()}
                </StyledDateTagText>
                <StyledDateTagButton
                  key="d"
                  icon={<RiCloseFill />}
                  color="white"
                  noBorder
                  noBackground
                  inverted
                  tooltipLabel="remove date"
                  onClick={() => {
                    handleChange({ updatedDate: undefined });
                  }}
                />
              </StyledDateTag>
            ) : (
              <StyledDatePicker
                type="date"
                id="updated-date"
                width="full"
                name="updated-date"
                onChange={(e) => {
                  const updatedDate = new Date(e.target.value);
                  handleChange({ updatedDate });
                }}
              />
            )}
          </StyledRow>
        </>
      )}

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
