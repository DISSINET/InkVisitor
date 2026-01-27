import {
  FloatingPortal,
  autoUpdate,
  offset,
  useFloating,
} from "@floating-ui/react";
import { animated, config, useSpring } from "@react-spring/web";
import { entityStatusDict, languageDict } from "@shared/dictionaries";
import { entitiesDict } from "@shared/dictionaries/entity";
import { EntityEnums, UserEnums } from "@shared/enums";
import { IEntity } from "@shared/types";
import {
  IRequestSearch,
  IRequestSearchRootValidity,
} from "@shared/types/request-search";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { wildCardChar } from "Theme/constants";
import api from "api";
import { Button, Input, Loader, TypeBar } from "components";
import Dropdown, {
  AttributeButtonGroup,
  EntityCreateModal,
  EntitySuggester,
  EntityTag,
} from "components/advanced";
import { useDebounce, useResizeObserver, useSearchParams } from "hooks";
import React, { useEffect, useMemo, useState } from "react";
import {
  BsShieldExclamation,
  BsShieldFillCheck,
  BsShieldShaded,
} from "react-icons/bs";
import { CgOptions } from "react-icons/cg";
import { FaPlus } from "react-icons/fa";
import { IoMdArrowDropdownCircle } from "react-icons/io";
import { RiCloseFill } from "react-icons/ri";
import { DropdownItem } from "types";
import {
  StyledAdvancedOptions,
  StyledAdvancedOptionsSign,
  StyledBoxContent,
  StyledBubble,
  StyledBubbleLabel,
  StyledBubblesContainer,
  StyledOptions,
  StyledResultsHeader,
  StyledResultsWrapper,
  StyledRow,
  StyledRowHeader,
} from "./EntitySearchBoxStyles";
import { EntitySearchResults } from "./EntitySearchResults/EntitySearchResults";

const initSearchValues: IRequestSearch = {
  labelOrId: "",
  cooccurrenceId: "",
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

const defaultLanguageOption = {
  label: "any",
  value: "" as EntityEnums.Language,
};
const languageOptions = [defaultLanguageOption].concat(languageDict);

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
    defaultClassOption.value as EntityEnums.Class
  );
  const [templateOption, setTemplateOption] =
    useState<DropdownItem>(defaultClassOption);
  const [searchData, setSearchData] =
    useState<IRequestSearch>(initSearchValues);
  const debouncedValues = useDebounce<IRequestSearch>(searchData, debounceTime);

  const { ref: resultRef, height: debouncedResultsHeight = 0 } =
    useResizeObserver<HTMLDivElement>();

  const statusOptionSelected: EntityEnums.Status = useMemo(() => {
    if (!!searchData.status) {
      return searchData.status || defaultStatusOption.value;
    }
    return defaultStatusOption.value;
  }, [searchData.status]);

  const languageOptionSelected: EntityEnums.Language = useMemo(() => {
    if (!!searchData.language) {
      return searchData.language || defaultLanguageOption.value;
    }
    return defaultLanguageOption.value;
  }, [searchData.language]);

  // check whether the search should be executed
  const validSearch = useMemo<boolean>(() => {
    return Boolean(
      debouncedValues?.labelOrId?.length &&
        debouncedValues?.labelOrId?.length > 1
    );
  }, [debouncedValues]);

  const {
    data: users,
    isFetching: isFetchingUsers,
    error: usersError,
  } = useQuery({
    queryKey: ["users"],
    queryFn: async () => {
      const res = await api.usersGetMore({});
      return res.data;
    },
    enabled: api.isLoggedIn(),
  });

  const {
    status,
    data: entities,
    error,
    isFetching,
    isPending,
  } = useQuery({
    queryKey: ["search", { searchData: JSON.stringify(debouncedValues) }],
    queryFn: async () => {
      if (debouncedValues.usedTemplate === "Any") {
        const { usedTemplate, ...filters } = debouncedValues;
        filters.onlyTemplates = true;
        const res = await api.entitiesSearch(filters);
        return res.data;
      }
      const labelWithWildCard =
        debouncedValues.labelOrId && debouncedValues.labelOrId?.length > 0
          ? debouncedValues.labelOrId + wildCardChar
          : debouncedValues.labelOrId;

      const res = await api.entitiesSearch({
        ...debouncedValues,
        labelOrId: labelWithWildCard,
      });
      return res.data;
    },
    enabled: api.isLoggedIn() && validSearch,
  });

  const [territoryEntity, setTerritoryEntity] = useState<IEntity | false>(
    false
  );
  const [cooccurrenceEntity, setCooccurrenceEntity] = useState<IEntity | false>(
    false
  );
  const [referencedTo, setReferencedTo] = useState<IEntity | false>(false);

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
        a.labels[0].toLocaleLowerCase() > b.labels[0].toLocaleLowerCase()
          ? 1
          : -1
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

  const [showAdvancedOptions, setShowAdvancedOptions] = useState(true);
  const [expandedOptions, setExpandedOptions] = useState<string[]>([]);
  const [showBubblesMenu, setShowBubblesMenu] = useState(false);
  const [portalMounted, setPortalMounted] = useState(false);
  const [timeoutId, setTimeoutId] = useState<number | null>(null);

  useEffect(() => {
    if (!showAdvancedOptions) {
      setSearchData({
        labelOrId: searchData.labelOrId,
      });
      setClassOption(defaultClassOption.value as EntityEnums.Class);
    }
  }, [showAdvancedOptions]);

  const [showEntityCreateModal, setShowEntityCreateModal] = useState(false);

  const rotateOptionsIcon = useSpring({
    transform: showAdvancedOptions ? "rotate(180deg)" : "rotate(0deg)",
    config: config.stiff,
  });

  const handleBubblesMouseEnter = () => {
    setPortalMounted(true);
    setShowBubblesMenu(true);
    if (timeoutId) {
      clearTimeout(timeoutId);
      setTimeoutId(null);
    }
  };

  const handleBubblesMouseLeave = () => {
    const id = window.setTimeout(() => {
      setShowBubblesMenu(false);
    }, 150);
    setTimeoutId(id);
  };

  useEffect(() => {
    if (!showBubblesMenu && portalMounted) {
      setTimeout(() => {
        setPortalMounted(false);
      }, 300);
    }
  }, [showBubblesMenu, portalMounted]);

  const animatedBubblesMount = useSpring({
    opacity: showBubblesMenu ? 1 : 0,
    config: config.stiff,
  });

  const { refs: bubblesRefs, floatingStyles: bubblesFloatingStyles } =
    useFloating({
      placement: "left",
      whileElementsMounted: autoUpdate,
      middleware: [offset({ mainAxis: 4 })],
    });

  const userRole = localStorage.getItem("userrole");

  const userOptions = useMemo(() => {
    const usersOptionsOut: DropdownItem[] = [
      { label: "any", value: "" },
    ].concat(
      users
        ?.filter((user) => user && user.id && user.name)
        .map((user) => ({
          label: user.name,
          value: user.id,
        })) ?? []
    );
    return usersOptionsOut;
  }, [users]);

  const advancedOptions = [
    "class",
    "status",
    "language",
    "territory",
    "co-occurrence",
    "referenced to",
    "created at",
    "udpated at",
    "created by",
    "updated by",
    "edited by",
    "root validity",
  ];

  return (
    <>
      <StyledBoxContent>
        <StyledOptions>
          <StyledRow>
            <StyledRowHeader $normalCursor>label or uuid</StyledRowHeader>
            <div
              style={{
                display: "grid",
                gridTemplateColumns: "1fr auto",
                width: "100%",
              }}
            >
              <Input
                width="full"
                placeholder="type to search"
                changeOnType
                onChangeFn={(value: string) =>
                  handleChange({ labelOrId: value })
                }
                clearable
              />
              {userRole !== UserEnums.Role.Viewer && (
                <Button
                  tooltipLabel="create entity"
                  icon={<FaPlus />}
                  onClick={() => setShowEntityCreateModal(true)}
                />
              )}
            </div>
          </StyledRow>

          <StyledAdvancedOptions
            ref={bubblesRefs.setReference}
            onMouseEnter={handleBubblesMouseEnter}
            onMouseLeave={handleBubblesMouseLeave}
          >
            <StyledAdvancedOptionsSign>
              <CgOptions size={12} />
              <i>advanced options</i>
            </StyledAdvancedOptionsSign>
          </StyledAdvancedOptions>

          {portalMounted && (
            <FloatingPortal id="page">
              <div
                ref={bubblesRefs.setFloating}
                style={{
                  ...bubblesFloatingStyles,
                  zIndex: 1000,
                  maxWidth: "250px",
                  padding: "4px",
                }}
                onMouseEnter={handleBubblesMouseEnter}
                onMouseLeave={handleBubblesMouseLeave}
              >
                <animated.div style={animatedBubblesMount}>
                  <StyledBubblesContainer>
                    {advancedOptions.map((option) => (
                      <>
                        {!expandedOptions.includes(option) && (
                          <StyledBubble
                            key={option}
                            onClick={() =>
                              setExpandedOptions([...expandedOptions, option])
                            }
                          >
                            <StyledBubbleLabel>{option}</StyledBubbleLabel>
                          </StyledBubble>
                        )}
                      </>
                    ))}
                  </StyledBubblesContainer>
                </animated.div>
              </div>
            </FloatingPortal>
          )}

          {/* ADVANCED OPTIONS */}
          {/* {showAdvancedOptions && ( */}
          <>
            {expandedOptions.includes("class") && (
              <StyledRow>
                <div
                  style={{
                    display: "flex",
                    justifyContent: "flex-end",
                    alignItems: "center",
                    marginRight: "0.5rem",
                  }}
                >
                  <StyledBubble
                    onClick={() =>
                      setExpandedOptions(
                        expandedOptions.filter((o) => o !== "class")
                      )
                    }
                  >
                    <StyledBubbleLabel>class</StyledBubbleLabel>
                  </StyledBubble>
                </div>
                <div style={{ position: "relative" }}>
                  <Dropdown.Single.Entity
                    placeholder={""}
                    width="full"
                    options={[defaultClassOption].concat(entitiesDict)}
                    value={classOption}
                    onChange={(selectedOption) => {
                      setClassOption(selectedOption as EntityEnums.Class);
                      setTemplateOption(defaultClassOption);
                      handleChange({
                        class: selectedOption,
                        usedTemplate: defaultClassOption.value,
                      });
                    }}
                  />
                  <TypeBar entityLetter={classOption} />
                </div>
              </StyledRow>
            )}

            {expandedOptions.includes("status") && (
              <StyledRow>
                <StyledRowHeader
                  onClick={() =>
                    setExpandedOptions(
                      expandedOptions.filter((o) => o !== "status")
                    )
                  }
                >
                  status
                </StyledRowHeader>
                <div style={{ position: "relative" }}>
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
                  <TypeBar entityLetter={classOption} />
                </div>
              </StyledRow>
            )}
            {expandedOptions.includes("language") && (
              <StyledRow>
                <StyledRowHeader
                  onClick={() =>
                    setExpandedOptions(
                      expandedOptions.filter((o) => o !== "language")
                    )
                  }
                >
                  language
                </StyledRowHeader>
                <div style={{ position: "relative" }}>
                  <Dropdown.Single.Basic
                    placeholder={""}
                    width="full"
                    options={languageOptions}
                    value={languageOptionSelected}
                    onChange={(selectedOption) => {
                      handleChange({
                        language: selectedOption,
                      });
                    }}
                  />
                  <TypeBar entityLetter={classOption} />
                </div>
              </StyledRow>
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
            {expandedOptions.includes("territory") && (
              <StyledRow>
                <StyledRowHeader
                  onClick={() =>
                    setExpandedOptions(
                      expandedOptions.filter((o) => o !== "territory")
                    )
                  }
                >
                  territory
                </StyledRowHeader>
                {territoryEntity ? (
                  <>
                    {territoryEntity && (
                      <EntityTag
                        entity={territoryEntity}
                        tooltipPosition={"left"}
                        unlinkButton={{
                          onClick: () => {
                            handleChange({
                              territoryId: "",
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
              </StyledRow>
            )}
            {territoryEntity && (
              <StyledRow>
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
              </StyledRow>
            )}
            {expandedOptions.includes("co-occurrence") && (
              <StyledRow>
                <StyledRowHeader
                  onClick={() =>
                    setExpandedOptions(
                      expandedOptions.filter((o) => o !== "co-occurrence")
                    )
                  }
                >
                  co-occurrence
                </StyledRowHeader>
                {cooccurrenceEntity ? (
                  <EntityTag
                    entity={cooccurrenceEntity}
                    tooltipPosition="left"
                    unlinkButton={{
                      onClick: () => {
                        handleChange({ cooccurrenceId: "" });
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
              </StyledRow>
            )}
            {expandedOptions.includes("referenced to") && (
              <StyledRow>
                <StyledRowHeader
                  onClick={() =>
                    setExpandedOptions(
                      expandedOptions.filter((o) => o !== "referenced to")
                    )
                  }
                >
                  referenced to
                </StyledRowHeader>
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
              </StyledRow>
            )}
            {expandedOptions.includes("created at") && (
              <StyledRow>
                <StyledRowHeader
                  onClick={() =>
                    setExpandedOptions(
                      expandedOptions.filter((o) => o !== "created at")
                    )
                  }
                >
                  created at
                </StyledRowHeader>

                <Input
                  type="date"
                  width="full"
                  value={
                    searchData.createdDate
                      ? searchData.createdDate.toISOString().split("T")[0]
                      : ""
                  }
                  onChangeFn={(value) => {
                    const createdDate = new Date(value);
                    if (createdDate && !isNaN(createdDate.getTime())) {
                      handleChange({ createdDate });
                    } else {
                      handleChange({ createdDate: undefined });
                    }
                  }}
                  clearable
                />
              </StyledRow>
            )}
            {expandedOptions.includes("udpated at") && (
              <StyledRow>
                <StyledRowHeader
                  onClick={() =>
                    setExpandedOptions(
                      expandedOptions.filter((o) => o !== "udpated at")
                    )
                  }
                >
                  udpated at
                </StyledRowHeader>

                <Input
                  type="date"
                  width="full"
                  onChangeFn={(value) => {
                    const updatedDate = new Date(value);

                    if (updatedDate && !isNaN(updatedDate.getTime())) {
                      handleChange({ updatedDate });
                    } else {
                      handleChange({ updatedDate: undefined });
                    }
                  }}
                  value={
                    searchData.updatedDate
                      ? searchData.updatedDate.toISOString().split("T")[0]
                      : ""
                  }
                  clearable
                />
              </StyledRow>
            )}

            {expandedOptions.includes("created by") && (
              <StyledRow>
                <StyledRowHeader
                  onClick={() =>
                    setExpandedOptions(
                      expandedOptions.filter((o) => o !== "created by")
                    )
                  }
                >
                  created by
                </StyledRowHeader>
                <Dropdown.Single.Basic
                  width="full"
                  options={userOptions}
                  value={searchData.createdBy ?? ""}
                  onChange={(value) => {
                    handleChange({ createdBy: value });
                  }}
                />
              </StyledRow>
            )}

            {expandedOptions.includes("updated by") && (
              <StyledRow>
                <StyledRowHeader
                  onClick={() =>
                    setExpandedOptions(
                      expandedOptions.filter((o) => o !== "updated by")
                    )
                  }
                >
                  updated by
                </StyledRowHeader>
                <Dropdown.Single.Basic
                  width="full"
                  options={userOptions}
                  value={searchData.updatedBy ?? ""}
                  onChange={(value) => {
                    handleChange({ updatedBy: value });
                  }}
                />
              </StyledRow>
            )}

            {expandedOptions.includes("edited by") && (
              <StyledRow>
                <StyledRowHeader
                  onClick={() =>
                    setExpandedOptions(
                      expandedOptions.filter((o) => o !== "edited by")
                    )
                  }
                >
                  edited by
                </StyledRowHeader>
                <Dropdown.Single.Basic
                  width="full"
                  options={userOptions}
                  value={searchData.editedBy ?? ""}
                  onChange={(value) => {
                    handleChange({ editedBy: value });
                  }}
                />
              </StyledRow>
            )}

            {expandedOptions.includes("root validity") && (
              <StyledRow>
                <StyledRowHeader
                  onClick={() =>
                    setExpandedOptions(
                      expandedOptions.filter((o) => o !== "root validity")
                    )
                  }
                >
                  root validity
                </StyledRowHeader>

                <AttributeButtonGroup
                  noMargin
                  options={[
                    {
                      longValue: "Any",
                      shortValue: "",
                      shortIcon: (
                        <BsShieldShaded style={{ margin: "2px 4px" }} />
                      ),
                      onClick: () => {
                        handleChange({
                          isRootInvalid: IRequestSearchRootValidity.Any,
                        });
                      },
                      selected:
                        searchData.isRootInvalid ===
                          IRequestSearchRootValidity.Any ||
                        searchData.isRootInvalid === undefined ||
                        searchData.isRootInvalid === null,
                    },
                    {
                      longValue: "Valid",
                      shortValue: "",
                      shortIcon: (
                        <BsShieldFillCheck style={{ margin: "2px 4px" }} />
                      ),
                      onClick: () => {
                        handleChange({
                          isRootInvalid: IRequestSearchRootValidity.Valid,
                        });
                      },
                      selected:
                        searchData.isRootInvalid ===
                        IRequestSearchRootValidity.Valid,
                    },
                    {
                      longValue: "Invalid",
                      shortValue: "",
                      shortIcon: (
                        <BsShieldExclamation style={{ margin: "2px 4px" }} />
                      ),
                      onClick: () => {
                        handleChange({
                          isRootInvalid: IRequestSearchRootValidity.Invalid,
                        });
                      },
                      selected:
                        searchData.isRootInvalid ===
                        IRequestSearchRootValidity.Invalid,
                    },
                  ]}
                />
              </StyledRow>
            )}
          </>
          {/* )} */}
        </StyledOptions>

        <StyledResultsHeader>
          {sortedEntities.length > 0 && (
            <>{`Results (${sortedEntities.length})`}</>
          )}
          {sortedEntities.length === 0 && (
            <p
              style={{
                fontStyle: "italic",
                fontSize: "1.4rem",
                margin: "0.5rem",
                padding: "2rem",
              }}
            >{`No results found`}</p>
          )}
        </StyledResultsHeader>

        {/* StyledResultsWrapper is used to calculate size for infinite scroll, don't put any other components inside! */}

        <StyledResultsWrapper ref={resultRef}>
          {/* RESULTS */}
          {sortedEntities.length > 0 && (
            <>
              <EntitySearchResults
                results={sortedEntities}
                height={debouncedResultsHeight}
              />
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
