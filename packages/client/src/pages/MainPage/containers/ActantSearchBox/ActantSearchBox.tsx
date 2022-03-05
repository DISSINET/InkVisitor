import { EntityClass } from "@shared/enums";
import { IOption, IResponseSearch } from "@shared/types";
import api from "api";
import { Button, Dropdown, Input, Loader, Tag } from "components";
import { useDebounce } from "hooks";
import React, { useEffect, useState } from "react";
import { FaUnlink } from "react-icons/fa";
import { useMutation, useQuery } from "react-query";
import { OptionsType, OptionTypeBase, ValueType } from "react-select";
import { Entities, IRequestSearch } from "types";
import { EntitySuggester } from "..";
import {
  StyledBoxContent,
  StyledResultHeading,
  StyledResultItem,
  StyledResults,
  StyledResultsWrapper,
  StyledRow,
  StyledRowHeader,
  StyledTagLoaderWrap,
} from "./ActantSearchBoxStyles";

const classesActants = [
  EntityClass.Action,
  EntityClass.Person,
  EntityClass.Group,
  EntityClass.Object,
  EntityClass.Concept,
  EntityClass.Location,
  EntityClass.Value,
  EntityClass.Event,
  EntityClass.Territory,
  EntityClass.Resource,
];

const initValues: IRequestSearch = {
  entityId: "",
  label: "",
};

export const ActantSearchBox: React.FC = () => {
  const [options, setOptions] = useState<OptionsType<OptionTypeBase>>();
  const [classOption, setClassOption] = useState<
    ValueType<OptionTypeBase, any>
  >({
    label: "*",
    value: undefined,
  });
  const [searchData, setSearchData] = useState<IRequestSearch>(initValues);
  const debouncedValues = useDebounce<IRequestSearch>(searchData, 100);

  const [results, setResults] = useState<IResponseSearch[]>([]);

  const {
    status,
    data: entity,
    error,
    isFetching,
  } = useQuery(
    ["entity", searchData.entityId],
    async () => {
      if (searchData.entityId) {
        const res = await api.detailGet(searchData.entityId);
        return res.data;
      }
    },
    {
      enabled: !!searchData.entityId && api.isLoggedIn(),
    }
  );

  useEffect(() => {
    const optionsToSet: {
      value: string | undefined;
      label: string;
    }[] = Object.entries(Entities)
      .filter((c: any) => {
        if (c[1].id !== "A" && c[1].id !== "R") {
          return c;
        }
      })
      .map((entity) => {
        return { value: entity[1].id, label: entity[1].label };
      });
    optionsToSet.unshift({ value: undefined, label: "*" });
    setOptions(optionsToSet);
  }, []);

  const handleChange = (
    key: string,
    value: string | false | ValueType<OptionTypeBase, any>
  ) => {
    setSearchData({
      ...searchData,
      [key]: value,
    });
  };

  useEffect(() => {
    if (debouncedValues.entityId || debouncedValues.label.length > 3) {
      searchActantsMutation.mutate(debouncedValues);
    } else {
      setResults([]);
    }
  }, [debouncedValues]);

  const searchActantsMutation = useMutation(
    async (searchData: IRequestSearch) => api.entitiesSearch(searchData),
    {
      onSuccess: (data) => {
        setResults(data.data);
      },
    }
  );

  return (
    <StyledBoxContent>
      <StyledRow>
        <StyledRowHeader>Label (at least 4 characters)</StyledRowHeader>
        <Input
          width={150}
          placeholder="search"
          changeOnType
          onChangeFn={(value: string) => handleChange("label", value)}
        />
      </StyledRow>
      <StyledRow>
        <StyledRowHeader>Limit by class</StyledRowHeader>
        <Dropdown
          placeholder={""}
          width={150}
          options={options}
          value={classOption}
          onChange={(option: ValueType<OptionTypeBase, any>) => {
            setClassOption(option);
            handleChange("class", (option as IOption).value);
          }}
        />
      </StyledRow>

      <StyledRow>
        <StyledRowHeader>
          {/* used with */}
          Limit by co-occurrence
        </StyledRowHeader>
        <EntitySuggester
          categoryTypes={classesActants}
          onSelected={(newSelectedId: string) => {
            handleChange("entityId", newSelectedId);
          }}
          placeholder={"entity"}
          allowCreate={false}
          inputWidth={114}
        />
      </StyledRow>
      <StyledRow>
        <StyledTagLoaderWrap>
          <Loader size={26} show={isFetching} />
        </StyledTagLoaderWrap>
        {entity && (
          <Tag
            propId={entity.id}
            label={entity.label}
            category={entity.class}
            tooltipPosition={"left center"}
            button={
              <Button
                key="d"
                icon={<FaUnlink />}
                color="danger"
                inverted={true}
                tooltip="unlink entity"
                onClick={() => {
                  handleChange("entityId", "");
                }}
              />
            }
          />
        )}
      </StyledRow>

      {results.length > 0 && (
        <StyledRow>
          <StyledResultHeading>Results:</StyledResultHeading>
        </StyledRow>
      )}
      <StyledResultsWrapper>
        {/* RESULTS */}
        {results.length > 0 && (
          <>
            <StyledRow>
              <StyledResults>
                {results.map((result: IResponseSearch, key: number) => (
                  <StyledResultItem key={key}>
                    <Tag
                      tooltipPosition="left top"
                      propId={result.entityId}
                      label={result.entityLabel}
                      category={result.class}
                      fullWidth
                      ltype={result.logicalType}
                    />
                  </StyledResultItem>
                ))}
              </StyledResults>
            </StyledRow>
          </>
        )}
        <Loader show={searchActantsMutation.isLoading} />
      </StyledResultsWrapper>
    </StyledBoxContent>
  );
};
