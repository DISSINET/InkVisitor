import {
  allEntities,
  DropdownItem,
  entitiesDict,
} from "@shared/dictionaries/entity";
import { EntityClass } from "@shared/enums";
import { IEntity, IOption } from "@shared/types";
import { IRequestSearch } from "@shared/types/request-search";
import api from "api";
import { Button, Dropdown, Input, Loader, TypeBar } from "components";
import { useDebounce } from "hooks";
import React, { useMemo, useState } from "react";
import { FaUnlink } from "react-icons/fa";
import { useQuery } from "react-query";
import { OptionsType, OptionTypeBase, ValueType } from "react-select";
import { wildCardChar } from "Theme/constants";
import { EntitySuggester, EntityTag } from "..";
import {
  StyledBoxContent,
  StyledResultsWrapper,
  StyledRow,
  StyledRowHeader,
  StyledTagLoaderWrap,
} from "./EntitySearchBoxStyles";
import { EntitySearchResults } from "./EntitySearchResults/EntitySearchResults";

const initValues: IRequestSearch = {
  label: "",
  cooccurrenceId: "",
};

const defaultOption = {
  label: "*",
  value: "",
};

const debounceTime: number = 100;

export const EntitySearchBox: React.FC = () => {
  const [classOption, setClassOption] = useState<DropdownItem>(defaultOption);
  const [templateOption, setTemplateOption] =
    useState<ValueType<OptionTypeBase, any>>(allEntities);
  const [searchData, setSearchData] = useState<IRequestSearch>(initValues);
  const debouncedValues = useDebounce<IRequestSearch>(searchData, debounceTime);

  // check whether the search should be executed
  const validSearch = useMemo(() => {
    return (
      (debouncedValues.label && debouncedValues.label.length > 2) ||
      !!debouncedValues.usedTemplate
    );
  }, [debouncedValues]);

  const { data: cooccurrenceEntity, isFetching: cooccurrenceIsFetching } =
    useQuery(
      ["co-occurrence", searchData.cooccurrenceId],
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

  const {
    status,
    data: entities,
    error,
    isFetching,
  } = useQuery(
    ["search", debouncedValues],
    async () => {
      const res = await api.entitiesSearch(debouncedValues);
      return res.data;
    },
    {
      enabled: api.isLoggedIn() && validSearch === true,
    }
  );

  const options: DropdownItem[] = entitiesDict.filter(
    (e) => e.value !== "A" && e.value !== "R" && e.value !== "X"
  );

  const handleChange = (changes: {
    [key: string]: string | false | ValueType<OptionTypeBase, any>;
  }) => {
    const newSearch = {
      ...searchData,
      ...changes,
    };
    setSearchData(newSearch);
  };

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

  const {
    status: templateStatus,
    data: templates,
    error: templateError,
    isFetching: isFetchingTemplates,
  } = useQuery(
    ["statement-templates", searchData, classOption],
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

  const templateOptions: DropdownItem[] = useMemo(() => {
    const options: DropdownItem[] = [allEntities];

    if (templates) {
      templates.forEach((template) => {
        options.push({
          value: template.id,
          label: template.label,
        });
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
          // placeholder="label (at least 2 characters)"
          placeholder="search"
          changeOnType
          onChangeFn={(value: string) => {
            handleChange({ label: value + wildCardChar });
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
            options={[defaultOption].concat(options)}
            value={classOption}
            onChange={(option: ValueType<OptionTypeBase, any>) => {
              setClassOption(option as DropdownItem);
              setTemplateOption(defaultOption);
              handleChange({
                class: (option as IOption).value,
                usedTemplate: defaultOption.value,
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
          options={templateOptions}
          value={templateOption}
          onChange={(option: ValueType<OptionTypeBase, any>) => {
            setTemplateOption(option);
            handleChange({ usedTemplate: (option as IOption).value });
          }}
        />
      </StyledRow>

      <StyledRow>
        <StyledRowHeader>Limit by co-occurrence</StyledRowHeader>
        <EntitySuggester
          categoryTypes={[
            EntityClass.Statement,
            EntityClass.Action,
            EntityClass.Territory,
            EntityClass.Resource,
            EntityClass.Person,
            EntityClass.Group,
            EntityClass.Object,
            EntityClass.Concept,
            EntityClass.Location,
            EntityClass.Value,
            EntityClass.Event,
          ]}
          onSelected={(newSelectedId: string) => {
            handleChange({ cooccurrenceId: newSelectedId });
          }}
          placeholder={"entity"}
          disableCreate
          inputWidth={114}
        />
      </StyledRow>
      {(cooccurrenceEntity || cooccurrenceIsFetching) && (
        <StyledRow>
          <StyledTagLoaderWrap>
            <Loader size={26} show={cooccurrenceIsFetching} />
          </StyledTagLoaderWrap>
          {cooccurrenceEntity && (
            <EntityTag
              actant={cooccurrenceEntity}
              tooltipPosition={"left center"}
              button={
                <Button
                  key="d"
                  icon={<FaUnlink />}
                  color="danger"
                  inverted={true}
                  tooltip="unlink entity"
                  onClick={() => {
                    handleChange({ cooccurrenceId: "" });
                  }}
                />
              }
            />
          )}
        </StyledRow>
      )}

      <StyledResultsWrapper>
        {/* RESULTS */}
        {sortedEntities.length > 0 && (
          <EntitySearchResults results={sortedEntities} />
        )}
        <Loader show={isFetching} />
      </StyledResultsWrapper>
    </StyledBoxContent>
  );
};

export const MemoizedEntitySearchBox = React.memo(EntitySearchBox);
