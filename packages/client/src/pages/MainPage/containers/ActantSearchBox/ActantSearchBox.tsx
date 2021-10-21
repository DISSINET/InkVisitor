import React, { useEffect, useState } from "react";
import { OptionsType, OptionTypeBase, ValueType } from "react-select";

import { Button, Dropdown, Input, Loader, Tag } from "components";
import {
  StyledBoxContent,
  StyledResultHeading,
  StyledResultItem,
  StyledResults,
  StyledResultsWrapper,
  StyledRow,
  StyledRowHeader,
} from "./ActantSearchBoxStyles";
import { ActantSuggester } from "..";
import { useMutation, useQuery } from "react-query";
import api from "api";
import { Entities, IRequestSearch } from "types";
import { IOption, IResponseSearch } from "@shared/types";
import { FaUnlink } from "react-icons/fa";
import { useDebounce } from "hooks";

const classesActants = ["A", "P", "G", "O", "C", "L", "V", "E", "T", "R"];

const initValues: IRequestSearch = {
  actantId: "",
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

  const { status, data: actant, error, isFetching } = useQuery(
    ["actant", searchData.actantId],
    async () => {
      if (searchData.actantId) {
        const res = await api.detailGet(searchData.actantId);
        return res.data;
      }
    },
    { enabled: !!searchData.actantId && api.isLoggedIn() }
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
    if (searchData.actantId || searchData.label) {
      searchActantsMutation.mutate(searchData);
    } else {
      setResults([]);
    }
  }, [debouncedValues]);

  const searchActantsMutation = useMutation(
    async (searchData: IRequestSearch) => api.actantsSearch(searchData),
    {
      onSuccess: (data) => {
        setResults(data.data);
      },
    }
  );

  return (
    <StyledBoxContent>
      <StyledRow>
        <StyledRowHeader>Class</StyledRowHeader>
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
        <StyledRowHeader>Label</StyledRowHeader>
        <Input
          width={150}
          placeholder="search"
          changeOnType
          onChangeFn={(value: string) => handleChange("label", value)}
        />
      </StyledRow>
      <StyledRow>
        <StyledRowHeader>
          {/* used with */}
          Actant
        </StyledRowHeader>
        <ActantSuggester
          categoryIds={classesActants}
          onSelected={(newSelectedId: string) => {
            handleChange("actantId", newSelectedId);
          }}
          placeholder={"actant"}
          allowCreate={false}
          inputWidth={114}
        />
      </StyledRow>
      <StyledRow>
        {actant && (
          <Tag
            propId={actant.id}
            label={actant.label}
            category={actant.class}
            button={
              <Button
                key="d"
                icon={<FaUnlink />}
                color="danger"
                inverted={true}
                tooltip="unlink actant"
                onClick={() => {
                  handleChange("actantId", "");
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
                      propId={result.actantId}
                      label={result.actantLabel}
                      category={result.class}
                      fullWidth
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
