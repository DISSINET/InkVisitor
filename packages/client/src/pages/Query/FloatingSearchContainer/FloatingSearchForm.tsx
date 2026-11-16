import { EntityEnums } from "@inkvisitor/shared/enums";
import {
  IRequestSearch,
  IRequestSearchRootValidity,
} from "@inkvisitor/shared/types/request-search";
import { TypeBar } from "components";
import Dropdown, { AttributeButtonGroup } from "components/advanced";
import { useOrderedLanguageDict } from "hooks/react-query";
import React, { useCallback, useState } from "react";
import { BsShieldExclamation, BsShieldFillCheck, BsShieldShaded } from "react-icons/bs";
import {
  logicalTypeFilterOptions,
  partOfSpeechFilterOptions,
  statusFilterOptions,
} from "./attributeFilterOptions";
import { CoOccurrencePicker } from "./CoOccurrencePicker";
import { DateRangeFilter, parseDate } from "./DateRangeFilter";
import { useUserFilterOptions } from "./useUserFilterOptions";
import {
  StyledForm,
  StyledRow,
  StyledRowControl,
  StyledRowHeader,
} from "./FloatingSearchFormStyles";
import { Explore } from "@inkvisitor/shared/types/query";
import { AttributeFilter, ExploreAction, ExploreActionType } from "../Explorer/state";

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
        // label and UUID filters have their own controls outside this panel, and
        // the list filters are read straight from the applied filters
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

  const attributeParams = Explore.attributeFilterParams(filters);
  const setAttributeFilter = (filter: AttributeFilter) =>
    dispatch({ type: ExploreActionType.setAttributeFilter, payload: filter });

  const orderedLanguageDict = useOrderedLanguageDict();

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
          <Dropdown.Multi.Basic
            placeholder="any"
            width="full"
            options={statusFilterOptions}
            value={attributeParams.entityStatuses ?? []}
            onChange={(statuses) =>
              setAttributeFilter({ type: Explore.SearchOption.Status, statuses })
            }
          />
          <TypeBar entityLetter={defaultClassForTypeBar} />
        </StyledRowControl>
      </StyledRow>
      <StyledRow>
        <StyledRowHeader>{Explore.SearchOption.Language}</StyledRowHeader>
        <StyledRowControl>
          <Dropdown.Multi.Basic
            placeholder="any"
            width="full"
            options={orderedLanguageDict}
            value={attributeParams.entityLanguages ?? []}
            onChange={(languages) =>
              setAttributeFilter({ type: Explore.SearchOption.Language, languages })
            }
          />
          <TypeBar entityLetter={defaultClassForTypeBar} />
        </StyledRowControl>
      </StyledRow>
      <StyledRow>
        <StyledRowHeader>{Explore.SearchOption.LogicalType}</StyledRowHeader>
        <StyledRowControl>
          <Dropdown.Multi.Basic
            placeholder="any"
            width="full"
            options={logicalTypeFilterOptions}
            value={attributeParams.entityLogicalTypes ?? []}
            onChange={(logicalTypes) =>
              setAttributeFilter({ type: Explore.SearchOption.LogicalType, logicalTypes })
            }
          />
        </StyledRowControl>
      </StyledRow>
      <StyledRow>
        <StyledRowHeader>{Explore.SearchOption.PartOfSpeech}</StyledRowHeader>
        <StyledRowControl>
          <Dropdown.Multi.Basic
            placeholder="any"
            width="full"
            options={partOfSpeechFilterOptions}
            value={attributeParams.entityPartsOfSpeech ?? []}
            onChange={(partsOfSpeech) =>
              setAttributeFilter({ type: Explore.SearchOption.PartOfSpeech, partsOfSpeech })
            }
          />
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
        <StyledRowHeader $belowFieldLabel>date created</StyledRowHeader>
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
        <StyledRowHeader $belowFieldLabel>date updated</StyledRowHeader>
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
