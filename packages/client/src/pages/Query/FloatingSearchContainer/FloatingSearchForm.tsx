import { entityStatusDict } from "@inkvisitor/shared/dictionaries";
import { EntityEnums } from "@inkvisitor/shared/enums";
import {
  IRequestSearch,
  IRequestSearchRootValidity,
} from "@inkvisitor/shared/types/request-search";
import { TypeBar } from "components";
import Dropdown, { AttributeButtonGroup } from "components/advanced";
import { useOrderedLanguageDict } from "hooks/react-query";
import React, { useCallback, useMemo, useState } from "react";
import { BsShieldExclamation, BsShieldFillCheck, BsShieldShaded } from "react-icons/bs";
import { CoOccurrencePicker } from "./CoOccurrencePicker";
import { DateRangeFilter, parseDate } from "./DateRangeFilter";
import { useUserFilterOptions } from "./useUserFilterOptions";
import {
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
        searchData.createdAfter = parseDate(filter.createdAfter);
        searchData.createdBefore = parseDate(filter.createdBefore);
        break;
      case Explore.SearchOption.UpdatedAt:
        searchData.updatedAfter = parseDate(filter.updatedAfter);
        searchData.updatedBefore = parseDate(filter.updatedBefore);
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

const filtersToCoOccurrenceIds = (filters: Explore.IExploreSearchFilter[]): string[] =>
  filters.find(
    (f): f is Explore.IExploreCoOccurrenceFilter => f.type === Explore.SearchOption.CoOccurrence,
  )?.entityIds ?? [];

interface FloatingSearchFormProps {
  dispatch: React.Dispatch<ExploreAction>;
  filters: Explore.IExploreSearchFilter[];
}
export const FloatingSearchForm: React.FC<FloatingSearchFormProps> = ({ dispatch, filters }) => {
  const [searchData, setSearchData] = useState<IRequestSearch>(() => filtersToSearchData(filters));

  const userOptions = useUserFilterOptions();

  // the applied filter is the single source of truth for the picked entities:
  // the form is unmounted while the panel is minimised, so keeping them in
  // local state would lose them on reopen
  const coOccurrenceIds = filtersToCoOccurrenceIds(filters);

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
            isClearable={!!searchData.status}
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
            isClearable={searchData.language !== undefined}
            onChange={(selectedOption) => {
              // clearing reports an empty string
              const language =
                !selectedOption || selectedOption === defaultLanguageOption.value
                  ? undefined
                  : selectedOption;
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
        <StyledRowHeader>{Explore.SearchOption.CoOccurrence}</StyledRowHeader>
        <StyledRowControl>
          <CoOccurrencePicker
            entityIds={coOccurrenceIds}
            onChange={(entityIds) =>
              dispatch({ type: ExploreActionType.setCoOccurrenceFilter, payload: { entityIds } })
            }
          />
        </StyledRowControl>
      </StyledRow>

      <StyledRow>
        <StyledRowHeader $belowFieldLabel>{Explore.SearchOption.CreatedAt}</StyledRowHeader>
        <StyledRowControl>
          <DateRangeFilter
            after={searchData.createdAfter}
            before={searchData.createdBefore}
            onChange={(createdAfter, createdBefore) => {
              handleChange({ createdAfter, createdBefore });
              dispatch({
                type: ExploreActionType.setCreatedAtFilter,
                payload: { createdAfter, createdBefore },
              });
            }}
          />
        </StyledRowControl>
      </StyledRow>

      <StyledRow>
        <StyledRowHeader $belowFieldLabel>{Explore.SearchOption.UpdatedAt}</StyledRowHeader>
        <StyledRowControl>
          <DateRangeFilter
            after={searchData.updatedAfter}
            before={searchData.updatedBefore}
            onChange={(updatedAfter, updatedBefore) => {
              handleChange({ updatedAfter, updatedBefore, updatedDate: undefined });
              dispatch({
                type: ExploreActionType.setUpdatedAtFilter,
                payload: { updatedAfter, updatedBefore },
              });
            }}
          />
        </StyledRowControl>
      </StyledRow>

      <StyledRow>
        <StyledRowHeader>{Explore.SearchOption.CreatedBy}</StyledRowHeader>
        <StyledRowControl>
          <Dropdown.Single.User
            width="full"
            options={userOptions.single}
            value={searchData.createdBy ?? ""}
            isClearable={!!searchData.createdBy}
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
            options={userOptions.single}
            value={searchData.updatedBy ?? ""}
            isClearable={!!searchData.updatedBy}
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
            options={userOptions.multi}
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
