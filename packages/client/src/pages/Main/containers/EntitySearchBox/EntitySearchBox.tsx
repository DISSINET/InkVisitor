import { entityStatusDict } from "@inkvisitor/shared/dictionaries";
import { entitiesDict } from "@inkvisitor/shared/dictionaries/entity";
import { EntityEnums, SearchEnums, UserEnums } from "@inkvisitor/shared/enums";
import { DropdownItem, IEntity } from "@inkvisitor/shared/types";
import {
  IRequestSearch,
  IRequestSearchRootValidity,
} from "@inkvisitor/shared/types/request-search";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { FOURTH_PANEL_MIN_WIDTH, wildCardChar } from "Theme/constants";
import { IcoPlusBold, IcoSearch } from "Theme/icons";
import api from "api";
import { boxContentId, Button, IconWithTooltip, Input, Loader, TypeBar } from "components";
import Dropdown, {
  AttributeButtonGroup,
  EntityCreateModal,
  EntitySuggester,
  EntityTag,
} from "components/advanced";
import { useDebounce, useResizeObserver, useSearchParams, useWidthBreakpoint } from "hooks";
import { useOrderedLanguageDict } from "hooks/react-query";
import { mergeTokensIntoIds, parseEntityIdsFromText, unparsedRemainder } from "pages/Query/utils";
import React, { useCallback, useEffect, useMemo, useState } from "react";
import { RiCloseFill } from "react-icons/ri";
import { setExpandedOptions } from "redux/features/entitySearch/expandedOptionsSlice";
import { useAppDispatch, useAppSelector } from "redux/hooks";
import { getStoredUserRole } from "utils/userStorage";
import { EntitySearchAdvancedOptions } from "./EntitySearchAdvancedOptions/EntitySearchAdvancedOptions";
import {
  StyledBoxContent,
  StyledCellMerge,
  StyledDropdownWithTypeBar,
  StyledNoResults,
  StyledOptionRow,
  StyledOptionRows,
  StyledOptions,
  StyledPill,
  StyledPillCloseIcon,
  StyledPillLabel,
  StyledPillWrap,
  StyledResultsHeader,
  StyledResultsWrapper,
  StyledRow,
  StyledRowHeader,
} from "./EntitySearchBoxStyles";
import { EntitySearchResults } from "./EntitySearchResults/EntitySearchResults";
import { EntitySearchUuids } from "./EntitySearchUuids/EntitySearchUuids";

const initSearchValues: IRequestSearch = {
  labelOrId: "",
  cooccurrenceId: undefined,
  territoryId: undefined,
  isRootInvalid: IRequestSearchRootValidity.Any,
};
const defaultClassOption = {
  label: "*",
  value: "" as EntityEnums.Class,
};

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
const anyTemplate: DropdownItem = {
  value: "Any",
  label: "Any template",
  info: "",
};

const debounceTime: number = 500;

export const EntitySearchBox: React.FC = () => {
  const queryClient = useQueryClient();
  const { appendDetailId } = useSearchParams();

  const [classOption, setClassOption] = useState<EntityEnums.Class>(
    defaultClassOption.value as EntityEnums.Class,
  );
  const [searchData, setSearchData] = useState<IRequestSearch>(initSearchValues);
  const debouncedValues = useDebounce<IRequestSearch>(searchData, debounceTime);

  const { ref: resultRef, height: debouncedResultsHeight = 0 } =
    useResizeObserver<HTMLDivElement>();

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

  // check whether the search should be executed
  // it has to work also when label is not set but some of the options is selected #2913
  const validSearch = useMemo<boolean>(() => {
    return Boolean(
      debouncedValues?.entityIds?.length ||
      (debouncedValues?.labelOrId?.length && debouncedValues?.labelOrId?.length > 1) ||
      debouncedValues?.class ||
      debouncedValues?.territoryId ||
      debouncedValues?.cooccurrenceId ||
      debouncedValues?.haveReferenceTo,
    );
  }, [debouncedValues]);

  const dispatch = useAppDispatch();
  const expandedOptions = useAppSelector((state) => state.entitySearch.expandedOptions);

  const {
    status,
    data: entities,
    error,
    isFetching,
    isPending,
  } = useQuery({
    // react-query hashes the key by value with object keys sorted, so the fresh
    // object the debounce produces on every keystroke only misses the cache when
    // a filter actually changed (no need to manually stringify here)
    queryKey: ["search", debouncedValues],
    queryFn: async () => {
      // if (debouncedValues.usedTemplate === "Any") {
      //   const { usedTemplate, ...filters } = debouncedValues;
      //   filters.onlyTemplates = true;
      //   const res = await api.entitiesSearch(filters);
      //   return res.data;
      // }
      const labelWithWildCard =
        debouncedValues.labelOrId && debouncedValues.labelOrId?.length > 0
          ? debouncedValues.labelOrId + wildCardChar
          : debouncedValues.labelOrId;

      const res = await api.entitiesSearch({
        ...debouncedValues,
        // uuids and a label are exclusive ways of naming the wanted entities, so
        // the leftover label text is dropped once any uuid is entered
        labelOrId: debouncedValues.entityIds?.length ? undefined : labelWithWildCard,
      });
      return res.data;
    },
    enabled: api.isLoggedIn() && validSearch,
  });

  const [territoryEntity, setTerritoryEntity] = useState<IEntity | false>(false);
  const [cooccurrenceEntity, setCooccurrenceEntity] = useState<IEntity | false>(false);
  const [referencedTo, setReferencedTo] = useState<IEntity | false>(false);

  // apply changes to search parameters
  const handleChange = (changes: {
    [key: string]: string | false | true | undefined | DropdownItem | Date | string[];
  }) => {
    const newSearch = {
      ...searchData,
      ...changes,
    };

    // remove parameters where the value is set to undefined
    Object.keys(changes).forEach((changeKey) => {
      const value = changes[changeKey];
      if (value === undefined) {
        delete (newSearch as any)[changeKey];
      }
    });

    setSearchData(newSearch);
  };

  const entityIds = searchData.entityIds ?? [];

  // complete uuids typed or pasted into the search field are lifted out into
  // pills; whatever is left stays in the field as the label part of the query
  const handleSearchTextChange = (text: string) => {
    // text without a complete uuid is kept verbatim - stripping it through
    // unparsedRemainder would swallow the spaces of a multi-word label
    if (parseEntityIdsFromText(text).length === 0) {
      handleChange({ labelOrId: text });
      return;
    }

    handleChange({
      labelOrId: unparsedRemainder(text),
      entityIds: mergeTokensIntoIds(entityIds, text),
    });
  };

  const removeEntityId = (id: string) => {
    const nextIds = entityIds.filter((entityId) => entityId.toLowerCase() !== id.toLowerCase());
    handleChange({ entityIds: nextIds.length > 0 ? nextIds : undefined });
  };

  // sort found entities by label
  const sortedEntities = useMemo(() => {
    if (entities) {
      const sorted = [...entities];
      sorted.sort((a: IEntity, b: IEntity) =>
        a.labels[0].toLocaleLowerCase() > b.labels[0].toLocaleLowerCase() ? 1 : -1,
      );
      return entities;
    }
    return [];
  }, [entities]);

  // get all templates for the "limit by template" option
  // const {
  //   status: templateStatus,
  //   data: templates,
  //   error: templateError,
  //   isFetching: isFetchingTemplates,
  // } = useQuery({
  //   queryKey: ["search-templates", searchData, classOption],
  //   queryFn: async () => {
  //     const res = await api.entitiesSearch({
  //       onlyTemplates: true,
  //       class: searchData.class,
  //     });

  //     const templates = res.data;

  //     templates.sort((a: IEntity, b: IEntity) =>
  //       a.label.toLocaleLowerCase() > b.label.toLocaleLowerCase() ? 1 : -1
  //     );
  //     return templates;
  //   },
  //   enabled: api.isLoggedIn(),
  // });

  // RELATED TO UNUSED TEMPLATE DROPDOWN
  // const templateOptions: DropdownItem[] = useMemo(() => {
  //   const options: DropdownItem[] = [anyTemplate];

  //   if (templates) {
  //     templates.forEach((template) => {
  //       if (template.label.length > 20) {
  //         options.push({
  //           value: template.id,
  //           label: template.label.substring(0, 20) + "...",
  //         });
  //       } else {
  //         options.push({
  //           value: template.id,
  //           label: template.label,
  //         });
  //       }
  //     });
  //   }
  //   return options;
  // }, [templates]);

  const [showEntityCreateModal, setShowEntityCreateModal] = useState(false);

  const userRole = getStoredUserRole();

  const handleSetExpandedOptions = useCallback(
    (options: SearchEnums.AdvancedOption[]) => {
      dispatch(setExpandedOptions(options));
    },
    [dispatch],
  );

  // Map AdvancedOption enum values to IRequestSearch property names
  const getPropertyNameFromOption = useCallback(
    (option: SearchEnums.AdvancedOption): keyof IRequestSearch => {
      const mapping: Partial<Record<SearchEnums.AdvancedOption, keyof IRequestSearch>> = {
        [SearchEnums.AdvancedOption.Class]: "class",
        [SearchEnums.AdvancedOption.Status]: "status",
        [SearchEnums.AdvancedOption.Language]: "language",
        [SearchEnums.AdvancedOption.Territory]: "territoryId",
        [SearchEnums.AdvancedOption.CoOccurrence]: "cooccurrenceId",
        [SearchEnums.AdvancedOption.ReferencedTo]: "haveReferenceTo",
      };
      return mapping[option] as keyof IRequestSearch;
    },
    [],
  );

  const renderOptionLabel = useCallback(
    (option: SearchEnums.AdvancedOption) => {
      const propertyName = getPropertyNameFromOption(option);
      return (
        <StyledPillWrap>
          <StyledPill>
            <StyledPillLabel>{option}</StyledPillLabel>
            <StyledPillCloseIcon
              onClick={() => {
                handleSetExpandedOptions(
                  expandedOptions.filter((o: SearchEnums.AdvancedOption) => o !== option),
                );
                // Special handling for different options
                if (option === SearchEnums.AdvancedOption.Territory) {
                  handleChange({
                    territoryId: undefined,
                    subTerritorySearch: undefined,
                  });
                  setTerritoryEntity(false);
                } else if (option === SearchEnums.AdvancedOption.CoOccurrence) {
                  handleChange({
                    cooccurrenceId: undefined,
                  });
                  setCooccurrenceEntity(false);
                } else if (option === SearchEnums.AdvancedOption.ReferencedTo) {
                  handleChange({
                    haveReferenceTo: undefined,
                  });
                  setReferencedTo(false);
                } else {
                  handleChange({
                    [propertyName]: undefined,
                  });
                }
              }}
            >
              <IconWithTooltip
                tooltipLabel={`Clear [${option}] filter`}
                icon={<RiCloseFill size={15} />}
                fullWidth
                tooltipPosition="left"
              />
            </StyledPillCloseIcon>
          </StyledPill>
        </StyledPillWrap>
      );
    },
    [expandedOptions, handleSetExpandedOptions, getPropertyNameFromOption, handleChange],
  );

  // If used as template is implemented, it'll be set here
  useEffect(() => {
    if (searchData.class) {
      setClassOption(searchData.class as EntityEnums.Class);
    } else {
      setClassOption(defaultClassOption.value as EntityEnums.Class);
    }
  }, [searchData.class]);

  useEffect(() => {
    const filtered = expandedOptions.filter((option: SearchEnums.AdvancedOption) =>
      SearchEnums.AdvancedOptions.includes(option),
    );
    if (filtered.length !== expandedOptions.length) {
      dispatch(setExpandedOptions(filtered));
    }
  }, [dispatch, expandedOptions]);

  useEffect(() => {
    if (!expandedOptions.includes(SearchEnums.AdvancedOption.Territory)) {
      setTerritoryEntity(false);
    }
  }, [expandedOptions.includes(SearchEnums.AdvancedOption.Territory)]);

  const isUndersized = useWidthBreakpoint(FOURTH_PANEL_MIN_WIDTH + 10, boxContentId("Search"));

  return (
    <>
      <StyledBoxContent>
        <StyledOptions $isUndersized={isUndersized}>
          <StyledRow>
            <StyledCellMerge>
              <Input
                width="full"
                icon={<IcoSearch />}
                placeholder={entityIds.length > 0 ? "uuid(s)" : "label or uuid(s)"}
                changeOnType
                value={searchData.labelOrId ?? ""}
                valueControlled
                onChangeFn={handleSearchTextChange}
                clearable
                rightContent={
                  <>
                    {userRole !== UserEnums.Role.Viewer && (
                      <Button
                        tooltipLabel="create entity"
                        icon={<IcoPlusBold />}
                        onClick={() => setShowEntityCreateModal(true)}
                        noBackground
                        noBorder
                        inverted
                      />
                    )}
                  </>
                }
              />
            </StyledCellMerge>
          </StyledRow>

          {entityIds.length > 0 && (
            <StyledRow>
              <StyledCellMerge>
                <EntitySearchUuids
                  entityIds={entityIds}
                  labelIgnored={!!searchData.labelOrId?.length}
                  onRemove={removeEntityId}
                  onClearAll={() => handleChange({ entityIds: undefined })}
                />
              </StyledCellMerge>
            </StyledRow>
          )}

          <EntitySearchAdvancedOptions
            expandedOptions={expandedOptions}
            setExpandedOptions={handleSetExpandedOptions}
            searchData={searchData}
            setSearchData={setSearchData}
            isUndersized={isUndersized}
          />

          {/* ADVANCED OPTIONS */}
          <StyledOptionRows>
            {expandedOptions.includes(SearchEnums.AdvancedOption.Class) && (
              <StyledOptionRow>
                {renderOptionLabel(SearchEnums.AdvancedOption.Class)}
                <Dropdown.Single.Entity
                  placeholder={""}
                  width="full"
                  options={[defaultClassOption].concat(entitiesDict)}
                  value={classOption}
                  onChange={(selectedOption) => {
                    handleChange({
                      class: selectedOption,
                    });
                  }}
                />
              </StyledOptionRow>
            )}

            {expandedOptions.includes(SearchEnums.AdvancedOption.Status) && (
              <StyledOptionRow>
                {renderOptionLabel(SearchEnums.AdvancedOption.Status)}
                <StyledDropdownWithTypeBar>
                  <Dropdown.Single.Basic
                    placeholder={""}
                    width="full"
                    options={statusOptions}
                    value={statusOptionSelected}
                    onChange={(selectedOption) => {
                      handleChange({
                        status: selectedOption,
                      });
                    }}
                  />
                  <TypeBar entityLetter={classOption} noMargin width={4} />
                </StyledDropdownWithTypeBar>
              </StyledOptionRow>
            )}

            {expandedOptions.includes(SearchEnums.AdvancedOption.Language) && (
              <StyledOptionRow>
                {renderOptionLabel(SearchEnums.AdvancedOption.Language)}
                <StyledDropdownWithTypeBar>
                  <Dropdown.Single.Basic
                    placeholder={""}
                    width="full"
                    options={languageOptions}
                    value={languageOptionSelected}
                    onChange={(selectedOption) => {
                      handleChange({
                        language:
                          selectedOption === defaultLanguageOption.value
                            ? undefined
                            : selectedOption,
                      });
                    }}
                  />
                  <TypeBar entityLetter={classOption} noMargin width={4} />
                </StyledDropdownWithTypeBar>
              </StyledOptionRow>
            )}

            {/* NOT USED NOW */}
            {/* <StyledRow>
              <StyledRowHeader>template</StyledRowHeader>
               <Dropdown.Single.Attribute
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
            {expandedOptions.includes(SearchEnums.AdvancedOption.Territory) && (
              <StyledOptionRow>
                {renderOptionLabel(SearchEnums.AdvancedOption.Territory)}
                {territoryEntity ? (
                  <>
                    {territoryEntity && (
                      <EntityTag
                        entity={territoryEntity}
                        tooltipPosition={"left"}
                        unlinkButton={{
                          onClick: () => {
                            handleChange({
                              territoryId: undefined,
                              subTerritorySearch: undefined,
                            });
                            setTerritoryEntity(false);
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
                      onPicked={(entity: IEntity) => {
                        handleChange({ territoryId: entity.id });
                        setTerritoryEntity(entity);
                      }}
                      placeholder={"territory"}
                      disableCreate
                      inputWidth="full"
                    />
                  </div>
                )}
              </StyledOptionRow>
            )}
            {territoryEntity && (
              <StyledOptionRow>
                <StyledRowHeader>Territory children</StyledRowHeader>
                <AttributeButtonGroup
                  options={[
                    {
                      longValue: "included",
                      shortValue: "included",
                      onClick: () => {
                        handleChange({ subTerritorySearch: true });
                      },
                      selected: searchData.subTerritorySearch === true,
                    },
                    {
                      longValue: "not included",
                      shortValue: "not included",
                      onClick: () => {
                        handleChange({ subTerritorySearch: undefined });
                      },
                      selected: searchData.subTerritorySearch !== true,
                    },
                  ]}
                />
              </StyledOptionRow>
            )}
            {expandedOptions.includes(SearchEnums.AdvancedOption.CoOccurrence) && (
              <StyledOptionRow>
                {renderOptionLabel(SearchEnums.AdvancedOption.CoOccurrence)}
                {cooccurrenceEntity ? (
                  <EntityTag
                    entity={cooccurrenceEntity}
                    tooltipPosition="left"
                    unlinkButton={{
                      onClick: () => {
                        handleChange({ cooccurrenceId: undefined });
                        setCooccurrenceEntity(false);
                      },
                      color: "danger",
                      icon: <RiCloseFill />,
                    }}
                  />
                ) : (
                  <div>
                    <EntitySuggester
                      disableTemplatesAccept
                      reuseDroppedValue
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
                      onPicked={(entity: IEntity) => {
                        handleChange({ cooccurrenceId: entity.id });
                        setCooccurrenceEntity(entity);
                      }}
                      placeholder={"entity"}
                      disableCreate
                      inputWidth="full"
                    />
                  </div>
                )}
              </StyledOptionRow>
            )}
            {expandedOptions.includes(SearchEnums.AdvancedOption.ReferencedTo) && (
              <StyledOptionRow>
                {renderOptionLabel(SearchEnums.AdvancedOption.ReferencedTo)}
                {referencedTo ? (
                  <EntityTag
                    entity={referencedTo}
                    unlinkButton={{
                      onClick: () => {
                        handleChange({ haveReferenceTo: undefined });
                        setReferencedTo(false);
                      },
                      color: "danger",
                      icon: <RiCloseFill />,
                    }}
                  />
                ) : (
                  <EntitySuggester
                    disableCreate
                    onPicked={(entity) => {
                      setReferencedTo(entity);
                      handleChange({ haveReferenceTo: entity.id });
                    }}
                    disableTemplatesAccept
                    categoryTypes={[EntityEnums.Class.Resource]}
                    inputWidth="full"
                    placeholder="resource"
                  />
                )}
              </StyledOptionRow>
            )}
          </StyledOptionRows>
          {/* )} */}
        </StyledOptions>

        <StyledResultsHeader>
          {sortedEntities.length > 0 && <>{`Results (${sortedEntities.length})`}</>}
          {sortedEntities.length === 0 && !isFetching && (
            <StyledNoResults>{`No results found`}</StyledNoResults>
          )}
        </StyledResultsHeader>

        {/* StyledResultsWrapper is used to calculate size for infinite scroll, don't put any other components inside! */}

        <StyledResultsWrapper ref={resultRef}>
          {/* RESULTS */}
          {sortedEntities.length > 0 && (
            <>
              <EntitySearchResults results={sortedEntities} height={debouncedResultsHeight} />
            </>
          )}
          <Loader show={isFetching} />
        </StyledResultsWrapper>
      </StyledBoxContent>

      {showEntityCreateModal && (
        <EntityCreateModal
          labelTyped={searchData.labelOrId}
          categorySelected={
            searchData.class !== EntityEnums.Extension.Any
              ? searchData.class
              : entitiesDict[0].value
          }
          languageSelected={searchData.language}
          closeModal={() => setShowEntityCreateModal(false)}
          onMutationSuccess={(entity) => {
            if (entity.class !== EntityEnums.Class.Value) {
              appendDetailId(entity.id);
            }
            if (entity.class === EntityEnums.Class.Territory) {
              queryClient.invalidateQueries({ queryKey: ["tree"] });
            }
          }}
        />
      )}
    </>
  );
};

export const MemoizedEntitySearchBox = React.memo(EntitySearchBox);
