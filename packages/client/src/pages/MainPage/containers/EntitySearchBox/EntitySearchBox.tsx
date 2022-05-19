import { DropdownItem } from "@shared/dictionaries/entity";
import { EntityClass } from "@shared/enums";
import { IEntity, IOption, IResponseEntity } from "@shared/types";
import api, { IFilterEntities } from "api";
import { Button, Dropdown, Input, Loader } from "components";
import { useDebounce } from "hooks";
import React, { useEffect, useMemo, useState } from "react";
import { FaUnlink } from "react-icons/fa";
import { useQuery } from "react-query";
import { OptionsType, OptionTypeBase, ValueType } from "react-select";
import { wildCardChar } from "Theme/constants";
import { Entities } from "types";
import { EntitySuggester, EntityTag } from "..";
import {
  StyledBoxContent,
  StyledResultHeading,
  StyledResultsWrapper,
  StyledRow,
  StyledRowHeader,
  StyledTagLoaderWrap,
} from "./EntitySearchBoxStyles";
import { EntitySearchResults } from "./EntitySearchResults/EntitySearchResults";

const initValues: IFilterEntities = {
  label: "",
  cooccurrenceId: "",
};

const defaultOption = {
  label: "*",
  value: "",
};

export const EntitySearchBox: React.FC = () => {
  const [options, setOptions] = useState<OptionsType<OptionTypeBase>>();
  const [classOption, setClassOption] =
    useState<ValueType<OptionTypeBase, any>>(defaultOption);
  const [templateOption, setTemplateOption] =
    useState<ValueType<OptionTypeBase, any>>(defaultOption);
  const [searchData, setSearchData] = useState<IFilterEntities>(initValues);
  const debouncedValues = useDebounce<IFilterEntities>(searchData, 100);

  const [results, setResults] = useState<IResponseEntity[]>([]);

  // check whether the search should be executed
  const validSearch = useMemo(() => {
    return (
      (searchData.label && searchData.label.length > 2) ||
      !!searchData.usedTemplate
    );
  }, [searchData]);

  const { data: cooccurrenceEntity } = useQuery(
    ["co-occurrence", searchData.cooccurrenceId],
    async () => {
      if (searchData?.cooccurrenceId) {
        const res = await api.entitiesGet(searchData.cooccurrenceId);
        return res.data;
      }
      return "";
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
    ["search", searchData],
    async () => {
      const res = await api.entitiesSearch(searchData);
      return res.data;
    },
    {
      enabled: api.isLoggedIn() && validSearch === true,
    }
  );

  useEffect(() => {
    const optionsToSet: {
      value: string | undefined;
      label: string;
    }[] = Object.entries(Entities)
      .filter((c: any) => {
        if (c[1].id !== "A" && c[1].id !== "R" && c[1].id !== "X") {
          return c;
        }
      })
      .map((entity) => {
        return { value: entity[1].id, label: entity[1].label };
      });
    optionsToSet.unshift({ value: undefined, label: "*" });
    setOptions(optionsToSet);
  }, []);

  const handleChange = (changes: {
    [key: string]: string | false | ValueType<OptionTypeBase, any>;
  }) => {
    const newSearch = {
      ...searchData,
      ...changes,
    };
    setSearchData(newSearch);
  };

  // useEffect(() => {
  //   if (debouncedValues.entityId || debouncedValues.label.length > 1) {
  //     searchActantsMutation.mutate(debouncedValues);
  //   } else {
  //     setResults([]);
  //   }
  // }, [debouncedValues]);

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
    { enabled: api.isLoggedIn(), retry: 2 }
  );

  const templateOptions: DropdownItem[] = useMemo(() => {
    const options: DropdownItem[] = [defaultOption];

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
          placeholder="search"
          changeOnType
          onChangeFn={(value: string) => {
            handleChange({ label: value + wildCardChar });
          }}
        />
      </StyledRow>
      <StyledRow>
        <StyledRowHeader>Limit by Entity class</StyledRowHeader>
        <Dropdown
          placeholder={""}
          width={150}
          options={options}
          value={classOption}
          onChange={(option: ValueType<OptionTypeBase, any>) => {
            setClassOption(option);
            setTemplateOption(defaultOption);
            handleChange({
              class: (option as IOption).value,
              usedTemplate: defaultOption.value,
            });
          }}
        />
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
      {(cooccurrenceEntity || isFetching) && (
        <StyledRow>
          <StyledTagLoaderWrap>
            <Loader size={26} show={isFetching} />
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

      {results.length > 0 && (
        <StyledRow>
          <StyledResultHeading>Results:</StyledResultHeading>
        </StyledRow>
      )}
      <StyledResultsWrapper>
        {/* RESULTS */}
        {sortedEntities.length > 0 && (
          <StyledRow>
            <EntitySearchResults results={sortedEntities} />
          </StyledRow>
        )}
        <Loader show={isFetching} />
      </StyledResultsWrapper>
    </StyledBoxContent>
  );
};
