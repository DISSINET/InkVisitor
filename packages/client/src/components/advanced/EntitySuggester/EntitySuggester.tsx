import { getStoredUserRole } from "utils/userStorage";
import {
  classesAll,
  dropdownWildCard,
  entitiesDictKeys,
} from "@inkvisitor/shared/dictionaries/entity";
import { EntityEnums, UserEnums } from "@inkvisitor/shared/enums";
import { IEntity, IResponseEntity, IStatement, ITerritory } from "@inkvisitor/shared/types";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { STATEMENT_LABEL_NOT_RECOMMENDED, wildCardChar } from "Theme/constants";
import api from "api";
import { Suggester, Button } from "components";
import { CEntity, InstTemplate } from "constructors";
import { useDebounce, useSearchParams } from "hooks";
import React, { useEffect, useMemo, useRef, useState } from "react";
import { useDrop } from "react-dnd";
import { FaHome } from "react-icons/fa";
import { LuScanSearch } from "react-icons/lu";
import {
  ButtonSize,
  EntityDragItem,
  EntitySingleDropdownItem,
  SuggesterItemToCreate,
  ItemTypes,
} from "types";
import { deepCopy } from "utils/utils";
import { AddTerritoryModal, EntityCreateModal } from "..";
import { useUserQuery } from "hooks/react-query";

interface EntitySuggesterProps {
  categoryTypes?: EntityEnums.Class[];
  onSelected?: (id: string) => void;
  onPicked?: (entity: IEntity) => void;
  onChangeCategory?: (selectedOption: EntityEnums.Class | EntityEnums.Extension.Any) => void;
  onTyped?: (newType: string) => void;
  placeholder?: string;
  inputWidth?: number | "full";
  // Explicit width for the suggestions dropdown, independent of the input width.
  // Set to intentionally show a wider results list.
  suggestionListWidth?: number;
  openDetailOnCreate?: boolean;
  // territoryId keys the cached set of entity ids already used in the territory,
  // used to render the home icon next to suggestion list items. The cache is
  // seeded by the StatementEditor from its territoryData - this component never
  // fetches it, so the icon only appears where that seed exists (StatementEditor).
  territoryId?: string;
  excludedEntityClasses?: EntityEnums.Class[];
  excludedActantIds?: string[];
  filterEditorRights?: boolean;
  isInsideTemplate?: boolean;
  isInsideStatement?: boolean;
  // used for instantiating template T, entity suggestions
  territoryParentId?: string;
  // used for create entity modal
  parentTerritory?: IEntity;
  // not obligatory, only for specific creation like from annotator where calculation of order is needed
  onCreateStatement?: (entityCreateModalProps?: {
    label: string;
    detail: string;
    territoryId: string;
    language: EntityEnums.Language;
  }) => void;
  onEntityCreateMutationSuccess?: (entity: IEntity) => void;
  entityCreateStatementOrder?: number;

  // epistemic level of the anchor created for the new entity; forwarded to the
  // EntityCreateModal so the user can pick it there without closing the modal
  anchorElvl?: EntityEnums.Elvl;
  onAnchorElvlChange?: (elvl: EntityEnums.Elvl) => void;

  button?: React.ReactNode;
  // rendered inside the suggester input's trailing slot (only when disableCreate)
  rightContent?: React.ReactNode;
  // notifies the parent when the input gains/loses focus (e.g. the annotator
  // highlights the elvl group while the suggester is focused)
  onFocusChange?: (isFocused: boolean) => void;
  preSuggestions?: IEntity[];

  disableCreate?: boolean;
  disableTemplateInstantiation?: boolean;
  disableWildCard?: boolean;
  disableTemplatesAccept?: boolean;
  disableButtons?: boolean;

  disableEnter?: boolean;
  autoFocus?: boolean;
  autoFocusInput?: boolean;

  initTyped?: string;
  // seeds the class selection on mount and when the allowed classes change; the
  // suggester owns the live selection between those points
  initCategory?: EntityEnums.Class;
  // not necessary to base functionality, use wisely
  externalTyped?: string;

  alwaysShowCreateModal?: boolean;

  disabled?: boolean;
  isHidden?: boolean;
  // When the selected class is Statement, empties the input and shows a gray
  // hint placeholder ("label is not recommended for Statements"); restores the
  // previously typed text when switching back to another class. Statements are
  // not meant to carry a label.
  statementLabelHint?: boolean;
  disableCleanTypedAfterCreate?: boolean;
  clearableInput?: boolean;
  onEmptyAddButtonClick?: () => void;
}
/**
 * Internal heavy component. Use the wrapper export below to optionally defer mounting.
 */
const EntitySuggesterFull: React.FC<
  EntitySuggesterProps & {
    externalDroppedItem?: EntityDragItem | null;
    onConsumeExternalDrop?: () => void;
  }
> = ({
  categoryTypes = classesAll,
  onSelected = () => {},
  onPicked = () => {},
  onChangeCategory,
  onTyped,
  placeholder = "",
  inputWidth,
  suggestionListWidth,
  openDetailOnCreate = false,
  territoryId,
  excludedEntityClasses = [],
  filterEditorRights = false,
  excludedActantIds = [],
  isInsideTemplate = false,
  isInsideStatement = false,
  territoryParentId,
  parentTerritory,
  onCreateStatement,
  onEntityCreateMutationSuccess,
  entityCreateStatementOrder,
  anchorElvl,
  onAnchorElvlChange,

  button,
  rightContent,
  onFocusChange,
  preSuggestions,

  disableCreate = false,
  disableTemplateInstantiation = false,
  disableWildCard = false,
  disableTemplatesAccept = false,
  disableButtons = false,
  disableEnter = false,
  autoFocus,
  autoFocusInput,

  initTyped,
  initCategory,
  externalTyped,

  alwaysShowCreateModal,

  disabled = false,
  isHidden = false,
  statementLabelHint = false,
  externalDroppedItem,
  onConsumeExternalDrop,
  disableCleanTypedAfterCreate = false,
  onEmptyAddButtonClick,
  clearableInput = true,
}) => {
  const [typed, setTyped] = useState<string>(initTyped ?? "");
  // Remembers the input typed under a non-Statement class so it can be restored
  // when the user switches away from Statement (statementLabelHint mode).
  const preStatementTypedRef = useRef<string>(initTyped ?? "");
  const debouncedTyped = useDebounce(typed, 100);
  const [selectedCategory, setSelectedCategory] = useState<
    EntityEnums.Class | EntityEnums.Extension.Any
  >();
  // const [allCategories, setAllCategories] =
  //   useState<EntitySingleDropdownItem[]>();

  useEffect(() => {
    if (externalTyped !== undefined) {
      setTyped(externalTyped);
    }
  }, [externalTyped]);

  const allCategories = useMemo<EntitySingleDropdownItem[]>(() => {
    return categoryTypes.map((c) => {
      return {
        value: c,
        label: c,
        info: entitiesDictKeys[c]?.info,
      };
    });
  }, [categoryTypes]);

  // Seed the class selection on mount and whenever the allowed classes change
  // (an edge switch or a root-class change). It deliberately does NOT depend on
  // initCategory: picking the wildcard clears the node's entityClasses, which
  // flips initCategory back to a concrete class, and re-seeding on that would
  // overwrite the wildcard the user just chose.
  useEffect(() => {
    const seed =
      initCategory ??
      (!disableWildCard && categoryTypes.length > 1
        ? EntityEnums.Extension.Any
        : categoryTypes[0]);
    setSelectedCategory((prev) => (prev === seed ? prev : seed));
  }, [categoryTypes, disableWildCard]);

  const { appendDetailId } = useSearchParams();

  // get user data
  const userRole = getStoredUserRole();
  const { data: user } = useUserQuery();

  // Suggesions query
  const {
    status: statusStatement,
    data: suggestions,
    error: errorStatement,
    isFetching: isFetchingStatement,
  } = useQuery({
    queryKey: [
      "suggestion",
      debouncedTyped,
      selectedCategory,
      excludedEntityClasses,
    ],
    queryFn: async () => {
      const resSuggestions = await api.entitiesSearch({
        labelOrId: debouncedTyped + wildCardChar,
        class:
          selectedCategory === dropdownWildCard.value
            ? undefined
            : (selectedCategory as EntityEnums.Class),
        excluded: excludedEntityClasses.length ? excludedEntityClasses : undefined,
      });

      return filterSuggestions(resSuggestions.data ?? []);
    },
    enabled:
      debouncedTyped.length > 1 &&
      !!selectedCategory &&
      !excludedEntityClasses.map((key) => key.valueOf()).includes(selectedCategory) &&
      api.isLoggedIn(),
  });

  // territory actants - the ids of entities already used in the territory, used
  // to mark such suggestions with a home icon. This never fetches: the StatementEditor
  // seeds this cache from its already-loaded territoryData (same id set as
  // api.entityIdsInTerritory). Elsewhere (e.g. entity detail) nothing seeds it,
  // so it resolves to [] and no home icon is shown - it is only relevant there.
  const { data: territoryActantIds } = useQuery<string[]>({
    queryKey: ["territoryActants", territoryId],
    queryFn: async () => [],
    enabled: !!territoryId,
    staleTime: Infinity,
  });

  const filterSuggestions = (suggestions: IResponseEntity[]) => {
    return (
      deepCopy(suggestions)
        .sort((a, b) => {
          if (a.status === EntityEnums.Status.Discouraged) {
            return 1;
          } else {
            return -1;
          }
        })
        .filter((s) =>
          filterEditorRights &&
          userRole !== UserEnums.Role.Admin &&
          userRole !== UserEnums.Role.Owner
            ? s.right === UserEnums.RoleMode.Write
            : s,
        )
        .filter((s) => (excludedActantIds.length ? !excludedActantIds.includes(s.id) : s))
        .filter((s) => (disableTemplatesAccept ? !s.isTemplate : s))
        // filter T or S template inside S template
        .filter(
          (s) =>
            !(
              (s.class === EntityEnums.Class.Territory ||
                s.class === EntityEnums.Class.Statement) &&
              s.isTemplate &&
              isInsideStatement &&
              isInsideTemplate
            ),
        )
        .filter((s) => categoryTypes.includes(s.class))
        .map((entity: IEntity) => {
          const icons: React.ReactNode[] = [];

          if (territoryActantIds?.includes(entity.id)) {
            icons.push(<FaHome key={entity.id} size={12} />);
          }

          return {
            entity: entity,
            icons: icons,
          };
        })
    );
  };

  const handleClean = () => {
    setTyped("");
    onTyped && onTyped("");
  };

  useEffect(() => {
    if (initTyped && initTyped !== typed) {
      setTyped(initTyped);
    }
  }, [initTyped]);

  const queryClient = useQueryClient();

  const onMutationSuccess = (entity: IEntity) => {
    onSelected(entity.id);
    onPicked(entity);
    if (!disableCleanTypedAfterCreate) {
      handleClean();
    }
    if (openDetailOnCreate && entity.class !== EntityEnums.Class.Value) {
      appendDetailId(entity.id);
    }
    if (entity.class === EntityEnums.Class.Territory) {
      queryClient.invalidateQueries({ queryKey: ["tree"] });
    }
    onEntityCreateMutationSuccess && onEntityCreateMutationSuccess(entity);
  };

  const entityCreateMutation = useMutation({
    mutationFn: async (newActant: IEntity | IStatement | ITerritory) =>
      await api.entityCreate(newActant),
    onSuccess: (data, variables) => {
      onMutationSuccess(variables);
    },
  });

  const handleCreate = (newCreated: {
    label: string;
    entityClass: EntityEnums.Class;
    detail?: string;
    language: EntityEnums.Language | false;
    territoryId?: string;
  }) => {
    if (user) {
      const newEntity = CEntity(
        {
          ...user.options,
          defaultLanguage: newCreated.language || user.options.defaultLanguage,
        },
        newCreated.entityClass,
        newCreated.label,
        newCreated.detail,
      );
      entityCreateMutation.mutate(newEntity);
    }
  };

  const [showAddTerritoryModal, setShowAddTerritoryModal] = useState(false);
  const [tempTemplateToInstantiate, setTempTemplateToInstantiate] = useState<ITerritory | false>(
    false,
  );

  const instantiateTerritory = async (
    territoryToInst: ITerritory,
    territoryParentId?: string,
  ): Promise<IEntity | false> => {
    return await InstTemplate(
      territoryToInst,
      getStoredUserRole() as UserEnums.Role,
      territoryParentId,
    );
  };

  const handleInstantiateTemplate = async (
    templateToDuplicate: IEntity | IStatement | ITerritory,
  ) => {
    let newEntity: IEntity | false;
    if (templateToDuplicate.class === EntityEnums.Class.Territory) {
      if (territoryParentId) {
        newEntity = await instantiateTerritory(
          templateToDuplicate as ITerritory,
          territoryParentId,
        );
      } else {
        setTempTemplateToInstantiate(templateToDuplicate as ITerritory);
        setShowAddTerritoryModal(true);
        return;
      }
    } else {
      newEntity = await InstTemplate(
        templateToDuplicate,
        getStoredUserRole() as UserEnums.Role,
      );
    }
    if (newEntity) {
      onSelected(newEntity.id);
      onPicked(newEntity);
      handleClean();
      if (openDetailOnCreate && templateToDuplicate.class !== EntityEnums.Class.Value) {
        appendDetailId(newEntity.id);
      }
      if (templateToDuplicate.class === EntityEnums.Class.Territory) {
        queryClient.invalidateQueries({ queryKey: ["tree"] });
      }
    }
  };

  const handlePick = (newPicked: IEntity, instantiateTemplate?: boolean) => {
    if (instantiateTemplate && !disableTemplateInstantiation) {
      handleInstantiateTemplate(newPicked);
    } else {
      onSelected(newPicked.id);
      onPicked(newPicked);
      handleClean();
    }
  };

  const handleDropped = (newDropped: EntityDragItem, instantiateTemplate?: boolean) => {
    if (!isWrongDropCategory) {
      if (instantiateTemplate && !disableTemplateInstantiation) {
        newDropped.entity && handleInstantiateTemplate(newDropped.entity);
      } else {
        onSelected(newDropped.id);
        newDropped.entity && onPicked(newDropped.entity);
        handleClean();
      }
    }
  };

  const [isWrongDropCategory, setIsWrongDropCategory] = useState(false);

  const handleHoverred = (newHoverred: EntityDragItem) => {
    const hoverredCategory = newHoverred.entityClass;
    if (
      !allCategories?.map((c) => c.value).includes(hoverredCategory) ||
      (disableTemplatesAccept && newHoverred.isTemplate) ||
      newHoverred.isDiscouraged ||
      excludedActantIds.includes(newHoverred.id) ||
      excludedEntityClasses.includes(newHoverred.entityClass) ||
      // Is T or S template inside S template
      ((newHoverred.entityClass === EntityEnums.Class.Territory ||
        newHoverred.entityClass === EntityEnums.Class.Statement) &&
        isInsideStatement &&
        isInsideTemplate &&
        newHoverred.isTemplate) ||
      disabled
    ) {
      setIsWrongDropCategory(true);
    } else {
      setIsWrongDropCategory(false);
    }
  };

  const [showCreateModal, setShowCreateModal] = useState(false);

  const getClassFilteredPreSuggestions = (suggestions: IEntity[]) => {
    let filteredSuggestions;
    if (selectedCategory !== dropdownWildCard.value) {
      filteredSuggestions = suggestions.filter((s) => s.class === selectedCategory);
    } else {
      filteredSuggestions = suggestions;
    }

    if (excludedEntityClasses.length) {
      filteredSuggestions = filteredSuggestions.filter(
        (entity) => !excludedEntityClasses.includes(entity.class),
      );
    }

    return filteredSuggestions;
  };

  return selectedCategory && allCategories && user ? (
    <>
      <Suggester
        isFetching={isFetchingStatement}
        suggestions={suggestions || []}
        preSuggestions={
          preSuggestions && filterSuggestions(getClassFilteredPreSuggestions(preSuggestions))
        }
        placeholder={
          statementLabelHint && selectedCategory === EntityEnums.Class.Statement
            ? STATEMENT_LABEL_NOT_RECOMMENDED
            : placeholder
        }
        typed={typed} // input value
        category={selectedCategory} // selected category
        categories={allCategories} // all possible categories
        onCancel={handleClean}
        onType={(newType: string) => {
          setTyped(newType);
          onTyped && onTyped(newType);
        }}
        onChangeCategory={(option) => {
          if (statementLabelHint) {
            const toStatement =
              option === EntityEnums.Class.Statement &&
              selectedCategory !== EntityEnums.Class.Statement;
            const fromStatement =
              option !== EntityEnums.Class.Statement &&
              selectedCategory === EntityEnums.Class.Statement;
            if (toStatement) {
              // remember the current text and clear so the hint placeholder shows
              preStatementTypedRef.current = typed;
              setTyped("");
              onTyped && onTyped("");
            } else if (fromStatement) {
              // restore the text typed before switching to Statement
              setTyped(preStatementTypedRef.current);
              onTyped && onTyped(preStatementTypedRef.current);
            }
          }
          setSelectedCategory(option);
          onChangeCategory && onChangeCategory(option);
        }}
        onCreate={(newCreated: SuggesterItemToCreate) => {
          handleCreate(newCreated);
        }}
        onPick={(newPicked: IEntity, instantiateTemplate?: boolean) => {
          handlePick(newPicked, instantiateTemplate);
        }}
        onDrop={(newDropped: EntityDragItem, instantiateTemplate?: boolean) => {
          if (!disabled) {
            handleDropped(newDropped, instantiateTemplate);
          }
        }}
        onHover={(newHoverred: EntityDragItem) => {
          handleHoverred(newHoverred);
        }}
        isWrongDropCategory={isWrongDropCategory}
        disableCreate={disableCreate}
        disableButtons={disableButtons}
        disableEnter={disableEnter}
        inputWidth={inputWidth}
        suggestionListWidth={suggestionListWidth}
        isInsideTemplate={isInsideTemplate}
        territoryParentId={territoryParentId}
        userOptions={user.options}
        autoFocus={autoFocus}
        autoFocusInput={autoFocusInput}
        disabled={disabled}
        showCreateModal={showCreateModal}
        setShowCreateModal={setShowCreateModal}
        alwaysShowCreateModal={alwaysShowCreateModal}
        disableWildCard={disableWildCard || allCategories.length < 2}
        button={button}
        rightContent={rightContent}
        disableTemplateInstantiation={disableTemplateInstantiation}
        onFocusChange={onFocusChange}
        isHidden={isHidden}
        externalDroppedItem={externalDroppedItem}
        onConsumeExternalDrop={onConsumeExternalDrop}
        onEmptyAddButtonClick={onEmptyAddButtonClick}
        clearableInput={clearableInput}
      />
      {showAddTerritoryModal && (
        <AddTerritoryModal
          onSubmit={async (territoryId: string) => {
            setShowAddTerritoryModal(false);
            const newEntity = await instantiateTerritory(
              tempTemplateToInstantiate as ITerritory,
              territoryId,
            );
            if (newEntity) {
              onSelected(newEntity.id);
              onPicked(newEntity);
              handleClean();
              if (openDetailOnCreate) {
                appendDetailId(newEntity.id);
              }
              queryClient.invalidateQueries({ queryKey: ["tree"] });
            }
            setTempTemplateToInstantiate(false);
          }}
          onClose={() => setShowAddTerritoryModal(false)}
        />
      )}

      {showCreateModal && (
        <EntityCreateModal
          labelTyped={typed}
          categorySelected={
            selectedCategory !== EntityEnums.Extension.Any
              ? selectedCategory
              : allCategories[0].value
          }
          closeModal={() => setShowCreateModal(false)}
          onMutationSuccess={(entity) => onMutationSuccess(entity)}
          allowedEntityClasses={categoryTypes}
          parentTerritory={parentTerritory}
          entityCreateStatementOrder={entityCreateStatementOrder}
          onCreateStatement={onCreateStatement}
          anchorElvl={anchorElvl}
          onAnchorElvlChange={onAnchorElvlChange}
        />
      )}
    </>
  ) : (
    <div />
  );
};

/**
 * Wrapper that can defer mounting the heavy suggester until user interaction.
 * compactUntilHover: when true, show a small button; mount full suggester on hover/click.
 * Once mounted it stays mounted while it holds focus or typed text, so the
 * pointer can leave to reach the suggestion list without collapsing it.
 */
export const EntitySuggester: React.FC<EntitySuggesterProps & { compactUntilHover?: boolean }> = ({
  compactUntilHover = false,
  ...rest
}) => {
  const [isMinified, setIsMinified] = useState<boolean>(true);
  const hideTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const [pendingDropItem, setPendingDropItem] = useState<EntityDragItem | null>(null);
  const containerRef = useRef<HTMLDivElement | null>(null);
  const [isFocused, setIsFocused] = useState(false);
  const [hasTypedText, setHasTypedText] = useState(false);
  // the delayed minify closes over the state of the render that scheduled it,
  // so it reads these refs for the values current when it fires
  const keepMountedRef = useRef(false);
  const isHoveredRef = useRef(false);

  useEffect(() => {
    keepMountedRef.current = isFocused || hasTypedText;
  }, [isFocused, hasTypedText]);

  const isDropValid = (item: EntityDragItem): boolean => {
    const {
      excludedActantIds = [],
      excludedEntityClasses = [],
      disableTemplatesAccept = false,
      isInsideTemplate = false,
      isInsideStatement = false,
      disabled = false,
      categoryTypes = classesAll,
    } = rest;

    if (disabled) return false;
    if (item.isDiscouraged) return false;
    if (disableTemplatesAccept && item.isTemplate) return false;
    if (excludedActantIds.includes(item.id)) return false;
    if (excludedEntityClasses.includes(item.entityClass)) return false;
    if (
      (item.entityClass === EntityEnums.Class.Territory ||
        item.entityClass === EntityEnums.Class.Statement) &&
      isInsideStatement &&
      isInsideTemplate &&
      item.isTemplate
    ) {
      return false;
    }
    // Allow only classes permitted by this suggester's categoryTypes
    if (!categoryTypes.includes(item.entityClass)) return false;
    return true;
  };

  const [, drop] = useDrop({
    accept: ItemTypes.TAG,
    canDrop: (item: EntityDragItem) => isDropValid(item),
    hover: (item, monitor) => {
      if (monitor.canDrop()) {
        setIsMinified(false);
      }
    },
    drop: (item: EntityDragItem, monitor) => {
      if (monitor.canDrop()) {
        setPendingDropItem(item);
        setIsMinified(false);
      }
    },
  });

  const clearHideTimeout = () => {
    if (hideTimeoutRef.current) {
      clearTimeout(hideTimeoutRef.current);
      hideTimeoutRef.current = null;
    }
  };

  /** Collapse back to the button unless the suggester is in use when the delay expires */
  const scheduleMinify = () => {
    clearHideTimeout();
    hideTimeoutRef.current = setTimeout(() => {
      hideTimeoutRef.current = null;
      if (!keepMountedRef.current && !isHoveredRef.current) {
        setIsMinified(true);
      }
    }, 1000);
  };

  const handleFocusChange = (focused: boolean) => {
    setIsFocused(focused);
    rest.onFocusChange?.(focused);
    if (!focused) {
      scheduleMinify();
    }
  };

  const handleTyped = (typed: string) => {
    setHasTypedText(typed.length > 0);
    rest.onTyped?.(typed);
  };

  useEffect(() => {
    if (containerRef.current) {
      drop(containerRef);
    }
    return () => clearHideTimeout();
  }, [drop]);

  if (!compactUntilHover) {
    return <EntitySuggesterFull {...rest} />;
  }

  return (
    <div
      ref={containerRef}
      onMouseEnter={() => {
        isHoveredRef.current = true;
        clearHideTimeout();
        setIsMinified(false);
      }}
      onMouseLeave={() => {
        isHoveredRef.current = false;
        scheduleMinify();
      }}
      style={{ display: "inline-flex", alignItems: "center" }}
    >
      {isMinified ? (
        <Button
          tooltipLabel="Open suggester"
          icon={<LuScanSearch color="black" />}
          color="gray"
          shape="rounded-lg"
          size={ButtonSize.Medium}
          // inverted
          noBorder
        />
      ) : (
        <EntitySuggesterFull
          {...rest}
          onFocusChange={handleFocusChange}
          onTyped={handleTyped}
          externalDroppedItem={pendingDropItem}
          onConsumeExternalDrop={() => setPendingDropItem(null)}
        />
      )}
    </div>
  );
};
