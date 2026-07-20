import { entityStatusDict } from "@inkvisitor/shared/dictionaries";
import { EntityEnums } from "@inkvisitor/shared/enums";
import {
  IRequestSearch,
  IRequestSearchRootValidity,
} from "@inkvisitor/shared/types/request-search";
import { Input, TypeBar } from "components";
import Dropdown, { AttributeButtonGroup } from "components/advanced";
import { useOrderedLanguageDict } from "hooks/react-query";
import { useUsersSimplifiedQuery } from "hooks/react-query/useUsersSimplifiedQuery";
import React, { useCallback, useMemo, useState } from "react";
import { BsShieldExclamation, BsShieldFillCheck, BsShieldShaded } from "react-icons/bs";
import {
  StyledDateRange,
  StyledDateRangeField,
  StyledDateRangeLabel,
  StyledForm,
  StyledRow,
  StyledRowControl,
  StyledRowHeader,
} from "./FloatingSearchFormStyles";
import { DropdownItem } from "@inkvisitor/shared/types";
import { Explore } from "@inkvisitor/shared/types/query";
import { ExploreAction, ExploreActionType } from "../Explorer/state";

const defaultStatusOption = {
  label: "any",
  value: "" as EntityEnums.Status,
};
const statusOptions = [defaultStatusOption].concat(entityStatusDict);

const languageFilterAny = "*";
const defaultLanguageOption = {
  label: "any",
  value: languageFilterAny as EntityEnums.Language,
};
const defaultClassForTypeBar = "" as EntityEnums.Class;

const initSearchValues: IRequestSearch = {
  labelOrId: "",
  isRootInvalid: IRequestSearchRootValidity.Any,
};

const dateToDatetimeLocal = (date: Date): string => {
  const pad = (value: number) => String(value).padStart(2, "0");
  return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}T${pad(date.getHours())}:${pad(date.getMinutes())}`;
};

const datetimeLocalToDate = (value: string): Date | undefined => {
  if (!value) {
    return undefined;
  }
  const parsed = new Date(value);
  return Number.isNaN(parsed.getTime()) ? undefined : parsed;
};

const storedDateToDate = (value: string | undefined): Date | undefined => {
  if (!value) {
    return undefined;
  }
  const parsed = new Date(value);
  return Number.isNaN(parsed.getTime()) ? undefined : parsed;
};

// The form is unmounted while the panel is minimised, so its local state has to
// be rebuilt from the filters that are still applied - otherwise reopening the
// panel shows empty controls while the results stay filtered.
const filtersToSearchData = (filters: Explore.IExploreSearchFilter[]): IRequestSearch => {
  const searchData: IRequestSearch = { ...initSearchValues };

  filters.forEach((filter) => {
    switch (filter.type) {
      case Explore.SearchOption.Status:
        searchData.status = filter.status;
        break;
      case Explore.SearchOption.Language:
        searchData.language = filter.language;
        break;
      case Explore.SearchOption.CreatedAt:
        searchData.createdAfter = storedDateToDate(filter.createdAfter);
        searchData.createdBefore = storedDateToDate(filter.createdBefore);
        break;
      case Explore.SearchOption.UpdatedAt:
        searchData.updatedAfter = storedDateToDate(filter.updatedAfter);
        searchData.updatedBefore = storedDateToDate(filter.updatedBefore);
        break;
      case Explore.SearchOption.CreatedBy:
        searchData.createdBy = filter.createdBy;
        break;
      case Explore.SearchOption.UpdatedBy:
        searchData.updatedBy = filter.updatedBy;
        break;
      case Explore.SearchOption.EditedBy:
        searchData.editedBy = filter.editedBy;
        break;
      case Explore.SearchOption.RootValidity:
        searchData.isRootInvalid = filter.rootValidity;
        break;
      default:
        // label and UUID filters have their own controls outside this panel
        break;
    }
  });

  return searchData;
};

interface FloatingSearchFormProps {
  dispatch: React.Dispatch<ExploreAction>;
  filters: Explore.IExploreSearchFilter[];
}
export const FloatingSearchForm: React.FC<FloatingSearchFormProps> = ({ dispatch, filters }) => {
  const [searchData, setSearchData] = useState<IRequestSearch>(() =>
    filtersToSearchData(filters),
  );

  const { data: users } = useUsersSimplifiedQuery();

  const orderedLanguageDict = useOrderedLanguageDict();
  const languageOptions: DropdownItem[] = useMemo(
    () => [defaultLanguageOption].concat(orderedLanguageDict),
    [orderedLanguageDict],
  );

  const statusOptionSelected: EntityEnums.Status = useMemo(() => {
    if (!!searchData.status) {
      return searchData.status || defaultStatusOption.value;
    }
    return defaultStatusOption.value;
  }, [searchData.status]);

  const languageOptionSelected = useMemo(() => {
    if (searchData.language !== undefined) {
      return searchData.language;
    }
    return defaultLanguageOption.value;
  }, [searchData.language]);

  const userOptions = useMemo(() => {
    return [{ label: "any", value: "" }].concat(
      users
        ?.filter((user) => user?.id && user?.name)
        .map((user) => ({
          label: user.name,
          value: user.id,
        })) ?? [],
    );
  }, [users]);

  const userMultiOptions = useMemo(() => {
    return (
      users
        ?.filter((user) => user?.id && user?.name)
        .map((user) => ({
          label: user.name,
          value: user.id,
        })) ?? []
    );
  }, [users]);

  const handleChange = useCallback(
    (changes: {
      [key: string]: string | string[] | undefined | Date | IRequestSearchRootValidity;
    }) => {
      const newSearch = { ...searchData, ...changes };

      Object.keys(changes).forEach((changeKey) => {
        if (changes[changeKey] === undefined) {
          delete (newSearch as Record<string, unknown>)[changeKey];
        }
      });

      setSearchData(newSearch);
    },
    [searchData],
  );

  return (
    <StyledForm>
      <StyledRow>
        <StyledRowHeader>{Explore.SearchOption.Status}</StyledRowHeader>
        <StyledRowControl>
          <Dropdown.Single.Basic
            placeholder=""
            width="full"
            options={statusOptions}
            value={statusOptionSelected}
            onChange={(selectedOption) => {
              const status =
                selectedOption === defaultStatusOption.value ? undefined : selectedOption;
              handleChange({
                status,
              });
              dispatch({
                type: ExploreActionType.setStatusFilter,
                payload: {
                  status,
                },
              });
            }}
          />
          <TypeBar entityLetter={defaultClassForTypeBar} />
        </StyledRowControl>
      </StyledRow>
      <StyledRow>
        <StyledRowHeader>{Explore.SearchOption.Language}</StyledRowHeader>
        <StyledRowControl>
          <Dropdown.Single.Basic
            placeholder=""
            width="full"
            options={languageOptions}
            value={languageOptionSelected}
            onChange={(selectedOption) => {
              const language =
                selectedOption === defaultLanguageOption.value ? undefined : selectedOption;
              handleChange({
                language,
              });
              dispatch({
                type: ExploreActionType.setLanguageFilter,
                payload: {
                  language,
                },
              });
            }}
          />
          <TypeBar entityLetter={defaultClassForTypeBar} />
        </StyledRowControl>
      </StyledRow>

      <StyledRow>
        <StyledRowHeader>{Explore.SearchOption.CreatedAt}</StyledRowHeader>
        <StyledRowControl>
          <StyledDateRange>
            <StyledDateRangeField>
              <StyledDateRangeLabel>after</StyledDateRangeLabel>
              <Input
                type="datetime-local"
                width="full"
                value={searchData.createdAfter ? dateToDatetimeLocal(searchData.createdAfter) : ""}
                onChangeFn={(value) => {
                  const createdAfter = datetimeLocalToDate(value);
                  const createdBefore = searchData.createdBefore;
                  handleChange({ createdAfter });
                  dispatch({
                    type: ExploreActionType.setCreatedAtFilter,
                    payload: {
                      createdAfter,
                      createdBefore,
                    },
                  });
                }}
                clearable
              />
            </StyledDateRangeField>
            <StyledDateRangeField>
              <StyledDateRangeLabel>before</StyledDateRangeLabel>
              <Input
                type="datetime-local"
                width="full"
                value={
                  searchData.createdBefore ? dateToDatetimeLocal(searchData.createdBefore) : ""
                }
                onChangeFn={(value) => {
                  const createdBefore = datetimeLocalToDate(value);
                  const createdAfter = searchData.createdAfter;
                  handleChange({ createdBefore });
                  dispatch({
                    type: ExploreActionType.setCreatedAtFilter,
                    payload: {
                      createdAfter,
                      createdBefore,
                    },
                  });
                }}
                clearable
              />
            </StyledDateRangeField>
          </StyledDateRange>
        </StyledRowControl>
      </StyledRow>

      <StyledRow>
        <StyledRowHeader>{Explore.SearchOption.UpdatedAt}</StyledRowHeader>
        <StyledRowControl>
          <StyledDateRange>
            <StyledDateRangeField>
              <StyledDateRangeLabel>after</StyledDateRangeLabel>
              <Input
                type="datetime-local"
                width="full"
                value={searchData.updatedAfter ? dateToDatetimeLocal(searchData.updatedAfter) : ""}
                onChangeFn={(value) => {
                  const updatedAfter = datetimeLocalToDate(value);
                  const updatedBefore = searchData.updatedBefore;
                  handleChange({ updatedAfter, updatedDate: undefined });
                  dispatch({
                    type: ExploreActionType.setUpdatedAtFilter,
                    payload: {
                      updatedAfter,
                      updatedBefore,
                    },
                  });
                }}
                clearable
              />
            </StyledDateRangeField>
            <StyledDateRangeField>
              <StyledDateRangeLabel>before</StyledDateRangeLabel>
              <Input
                type="datetime-local"
                width="full"
                value={
                  searchData.updatedBefore ? dateToDatetimeLocal(searchData.updatedBefore) : ""
                }
                onChangeFn={(value) => {
                  const updatedBefore = datetimeLocalToDate(value);
                  const updatedAfter = searchData.updatedAfter;
                  handleChange({ updatedBefore, updatedDate: undefined });
                  dispatch({
                    type: ExploreActionType.setUpdatedAtFilter,
                    payload: {
                      updatedAfter,
                      updatedBefore,
                    },
                  });
                }}
                clearable
              />
            </StyledDateRangeField>
          </StyledDateRange>
        </StyledRowControl>
      </StyledRow>

      <StyledRow>
        <StyledRowHeader>{Explore.SearchOption.CreatedBy}</StyledRowHeader>
        <StyledRowControl>
          <Dropdown.Single.User
            width="full"
            options={userOptions}
            value={searchData.createdBy ?? ""}
            onChange={(value) => {
              handleChange({ createdBy: value || undefined });
              dispatch({
                type: ExploreActionType.setCreatedByFilter,
                payload: {
                  createdBy: value || undefined,
                },
              });
            }}
          />
        </StyledRowControl>
      </StyledRow>

      <StyledRow>
        <StyledRowHeader>{Explore.SearchOption.UpdatedBy}</StyledRowHeader>
        <StyledRowControl>
          <Dropdown.Single.User
            width="full"
            options={userOptions}
            value={searchData.updatedBy ?? ""}
            onChange={(value) => {
              handleChange({ updatedBy: value || undefined });
              dispatch({
                type: ExploreActionType.setUpdatedByFilter,
                payload: {
                  updatedBy: value || undefined,
                },
              });
            }}
          />
        </StyledRowControl>
      </StyledRow>

      <StyledRow>
        <StyledRowHeader>{Explore.SearchOption.EditedBy}</StyledRowHeader>
        <StyledRowControl>
          <Dropdown.Multi.User
            width="full"
            limitSelectedItems={2}
            placeholder="any"
            options={userMultiOptions}
            value={searchData.editedBy ?? []}
            onChange={(values) => {
              const editedBy = values.length > 0 ? values : undefined;
              handleChange({ editedBy });
              dispatch({
                type: ExploreActionType.setEditedByFilter,
                payload: {
                  editedBy,
                },
              });
            }}
          />
        </StyledRowControl>
      </StyledRow>

      <StyledRow>
        <StyledRowHeader>{Explore.SearchOption.RootValidity}</StyledRowHeader>
        <StyledRowControl>
          <AttributeButtonGroup
            noMargin
            options={[
              {
                longValue: "Any",
                shortValue: "",
                shortIcon: <BsShieldShaded style={{ margin: "2px 4px" }} />,
                onClick: () => {
                  handleChange({
                    isRootInvalid: IRequestSearchRootValidity.Any,
                  });
                  dispatch({
                    type: ExploreActionType.setRootValidityFilter,
                    payload: {
                      rootValidity: IRequestSearchRootValidity.Any,
                    },
                  });
                },
                selected:
                  searchData.isRootInvalid === IRequestSearchRootValidity.Any ||
                  searchData.isRootInvalid === undefined ||
                  searchData.isRootInvalid === null,
              },
              {
                longValue: "Valid",
                shortValue: "",
                shortIcon: <BsShieldFillCheck style={{ margin: "2px 4px" }} />,
                onClick: () => {
                  handleChange({
                    isRootInvalid: IRequestSearchRootValidity.Valid,
                  });
                  dispatch({
                    type: ExploreActionType.setRootValidityFilter,
                    payload: {
                      rootValidity: IRequestSearchRootValidity.Valid,
                    },
                  });
                },
                selected: searchData.isRootInvalid === IRequestSearchRootValidity.Valid,
              },
              {
                longValue: "Invalid",
                shortValue: "",
                shortIcon: <BsShieldExclamation style={{ margin: "2px 4px" }} />,
                onClick: () => {
                  handleChange({
                    isRootInvalid: IRequestSearchRootValidity.Invalid,
                  });
                  dispatch({
                    type: ExploreActionType.setRootValidityFilter,
                    payload: {
                      rootValidity: IRequestSearchRootValidity.Invalid,
                    },
                  });
                },
                selected: searchData.isRootInvalid === IRequestSearchRootValidity.Invalid,
              },
            ]}
          />
        </StyledRowControl>
      </StyledRow>
    </StyledForm>
  );
};
