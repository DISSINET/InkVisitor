import { EntityEnums, UserEnums } from "@shared/enums";
import {
  IEntity,
  IResponseTerritory,
  IStatement,
  ITerritory,
} from "@shared/types";
import api from "api";
import { Suggester } from "components";
import { CEntity, CStatement, CTerritory, InstTemplate } from "constructors";
import { useDebounce, useSearchParams } from "hooks";
import React, { useEffect, useState } from "react";
import { FaHome } from "react-icons/fa";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { DropdownAny, rootTerritoryId, wildCardChar } from "Theme/constants";
import { DropdownItem, EntityDragItem, SuggesterItemToCreate } from "types";
import { AddTerritoryModal } from "..";

interface EntitySuggester {
  categoryTypes: EntityEnums.ExtendedClass[];
  onSelected: (id: string) => void;
  onPicked?: (entity: IEntity) => void;
  onChangeCategory?: (selectedOption: DropdownItem) => void;
  onTyped?: (newType: string) => void;
  placeholder?: string;
  inputWidth?: number | "full";
  openDetailOnCreate?: boolean;
  territoryActants?: string[];
  excludedEntities?: EntityEnums.Class[];
  excludedActantIds?: string[];
  filterEditorRights?: boolean;
  isInsideTemplate?: boolean;
  isInsideStatement?: boolean;
  territoryParentId?: string;

  disableCreate?: boolean;
  disableTemplateInstantiation?: boolean;
  disableWildCard?: boolean;
  disableTemplatesAccept?: boolean;
  disableButtons?: boolean;
  disableEnter?: boolean;
  autoFocus?: boolean;

  disabled?: boolean;
}

export const EntitySuggester: React.FC<EntitySuggester> = ({
  categoryTypes,
  onSelected,
  onPicked = () => {},
  onChangeCategory,
  onTyped,
  placeholder = "",
  inputWidth,
  openDetailOnCreate = false,
  territoryActants,
  excludedEntities = [],
  filterEditorRights = false,
  excludedActantIds = [],
  isInsideTemplate = false,
  isInsideStatement = false,
  territoryParentId,

  disableCreate,
  disableTemplateInstantiation = false,
  disableWildCard = false,
  disableTemplatesAccept = false,
  disableButtons = false,
  disableEnter,
  autoFocus,

  disabled = false,
}) => {
  const [typed, setTyped] = useState<string>("");
  const debouncedTyped = useDebounce(typed, 100);
  const [selectedCategory, setSelectedCategory] = useState<any>();
  const [allCategories, setAllCategories] = useState<DropdownItem[]>();

  const { appendDetailId } = useSearchParams();
  const userRole = localStorage.getItem("userrole");

  // get user data
  const userId = localStorage.getItem("userid");
  const {
    status: statusUser,
    data: user,
    error: errorUser,
    isFetching: isFetchingUser,
  } = useQuery(
    ["user", userId],
    async () => {
      if (userId) {
        const res = await api.usersGet(userId);
        return res.data;
      }
    },
    { enabled: !!userId && api.isLoggedIn() }
  );

  // Suggesions query
  const {
    status: statusStatement,
    data: suggestions,
    error: errorStatement,
    isFetching: isFetchingStatement,
  } = useQuery(
    ["suggestion", debouncedTyped, selectedCategory, excludedEntities],
    async () => {
      const resSuggestions = await api.entitiesSearch({
        label: debouncedTyped + wildCardChar,
        class:
          selectedCategory?.value === DropdownAny
            ? false
            : selectedCategory?.value,
        excluded: excludedEntities.length ? excludedEntities : undefined,
      });

      const suggestions = resSuggestions.data;
      suggestions.sort((a, b) => {
        if (a.status === EntityEnums.Status.Discouraged) {
          return 1;
        } else {
          return -1;
        }
      });
      return (
        resSuggestions.data
          .filter((s) =>
            filterEditorRights && userRole !== UserEnums.Role.Admin
              ? s.right === UserEnums.RoleMode.Write
              : s
          )
          .filter((s) =>
            excludedActantIds.length ? !excludedActantIds.includes(s.id) : s
          )
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
              )
          )
          .filter((s) => categoryTypes.includes(s.class))
          .map((entity: IEntity) => {
            const icons: React.ReactNode[] = [];

            if (territoryActants?.includes(entity.id)) {
              icons.push(<FaHome key={entity.id} color="" />);
            }

            return {
              entity: entity,
              icons: icons,
            };
          })
      );
    },
    {
      enabled:
        debouncedTyped.length > 1 &&
        !!selectedCategory &&
        !excludedEntities
          .map((key) => key.valueOf())
          .includes(selectedCategory?.value) &&
        api.isLoggedIn(),
    }
  );

  const handleClean = () => {
    setTyped("");
    onTyped && onTyped("");
  };

  // initial load of categories
  useEffect(() => {
    const categories: DropdownItem[] = [];
    categoryTypes.forEach((category) => {
      categories.push({
        label: category.valueOf(),
        value: category.valueOf(),
      });
    });
    if (categories.length > 1 && !disableWildCard) {
      categories.unshift({
        label: EntityEnums.Extension.Any,
        value: DropdownAny,
      });
    }
    if (categories.length) {
      setAllCategories(categories);
      setSelectedCategory(categories[0]);
    }
  }, [categoryTypes]);

  const queryClient = useQueryClient();

  const entityCreateMutation = useMutation(
    async (newActant: IEntity | IStatement | ITerritory) =>
      await api.entityCreate(newActant),
    {
      onSuccess: (data, variables) => {
        onSelected(variables.id);
        onPicked(variables);
        handleClean();
        if (openDetailOnCreate && variables.class !== EntityEnums.Class.Value) {
          appendDetailId(variables.id);
        }
        if (variables.class === EntityEnums.Class.Territory) {
          queryClient.invalidateQueries(["tree"]);
        }
      },
    }
  );

  const handleCreate = (newCreated: {
    label: string;
    entityClass: EntityEnums.Class;
    detail?: string;
    language?: EntityEnums.Language;
    territoryId?: string;
  }) => {
    if (user) {
      if (
        newCreated.entityClass === EntityEnums.Class.Statement &&
        newCreated.territoryId
      ) {
        const newStatement = CStatement(
          localStorage.getItem("userrole") as UserEnums.Role,
          {
            ...user.options,
            defaultLanguage:
              newCreated.language || user.options.defaultLanguage,
          },
          newCreated.label,
          newCreated.detail,
          newCreated.territoryId
        );
        entityCreateMutation.mutate(newStatement);
      } else if (newCreated.entityClass === EntityEnums.Class.Territory) {
        const newTerritory = CTerritory(
          localStorage.getItem("userrole") as UserEnums.Role,
          {
            ...user.options,
            defaultLanguage:
              newCreated.language || user.options.defaultLanguage,
          },
          newCreated.label,
          newCreated.detail || "",
          newCreated.territoryId ? newCreated.territoryId : rootTerritoryId,
          -1
        );
        entityCreateMutation.mutate(newTerritory);
      } else {
        const newEntity = CEntity(
          {
            ...user.options,
            defaultLanguage:
              newCreated.language || user.options.defaultLanguage,
          },
          newCreated.entityClass,
          newCreated.label,
          newCreated.detail
        );
        entityCreateMutation.mutate(newEntity);
      }
    }
  };

  const [showAddTerritoryModal, setShowAddTerritoryModal] = useState(false);
  const [tempTemplateToInstantiate, setTempTemplateToInstantiate] = useState<
    ITerritory | false
  >(false);

  const instantiateTerritory = async (
    territoryToInst: ITerritory,
    territoryParentId?: string
  ): Promise<string | false> => {
    return await InstTemplate(
      territoryToInst,
      localStorage.getItem("userrole") as UserEnums.Role,
      territoryParentId
    );
  };

  const handleInstantiateTemplate = async (
    templateToDuplicate: IEntity | IStatement | ITerritory
  ) => {
    let newEntityId: string | false;
    if (templateToDuplicate.class === EntityEnums.Class.Territory) {
      if (territoryParentId) {
        newEntityId = await instantiateTerritory(
          templateToDuplicate as ITerritory,
          territoryParentId
        );
      } else {
        setTempTemplateToInstantiate(templateToDuplicate as ITerritory);
        setShowAddTerritoryModal(true);
        return;
      }
    } else {
      newEntityId = await InstTemplate(
        templateToDuplicate,
        localStorage.getItem("userrole") as UserEnums.Role
      );
    }
    if (newEntityId) {
      onSelected(newEntityId);
      handleClean();
      if (
        openDetailOnCreate &&
        templateToDuplicate.class !== EntityEnums.Class.Value
      ) {
        appendDetailId(newEntityId);
      }
      if (templateToDuplicate.class === EntityEnums.Class.Territory) {
        queryClient.invalidateQueries(["tree"]);
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

  const handleDropped = (
    newDropped: EntityDragItem,
    instantiateTemplate?: boolean
  ) => {
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
      !categoryTypes.includes(hoverredCategory) ||
      (disableTemplatesAccept && newHoverred.isTemplate) ||
      newHoverred.isDiscouraged ||
      excludedActantIds.includes(newHoverred.id) ||
      excludedEntities.includes(newHoverred.entityClass) ||
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

  return selectedCategory && allCategories && user ? (
    <>
      <Suggester
        isFetching={isFetchingStatement}
        marginTop={false}
        suggestions={suggestions || []}
        placeholder={placeholder}
        typed={typed} // input value
        category={selectedCategory} // selected category
        categories={allCategories} // all possible categories
        suggestionListPosition={""} // todo not implemented yet
        onCancel={() => {
          handleClean();
        }}
        onType={(newType: string) => {
          setTyped(newType);
          onTyped && onTyped(newType);
        }}
        onChangeCategory={(option) => {
          setSelectedCategory(option);
          onChangeCategory && onChangeCategory(option as DropdownItem);
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
        isInsideTemplate={isInsideTemplate}
        territoryParentId={territoryParentId}
        userOptions={user.options}
        autoFocus={autoFocus}
        disabled={disabled}
      />
      {showAddTerritoryModal && (
        <AddTerritoryModal
          onSubmit={async (territoryId: string) => {
            setShowAddTerritoryModal(false);
            const newEntityId = await instantiateTerritory(
              tempTemplateToInstantiate as ITerritory,
              territoryId
            );
            if (newEntityId) {
              onSelected(newEntityId);
              handleClean();
              if (openDetailOnCreate) {
                appendDetailId(newEntityId);
              }
              queryClient.invalidateQueries(["tree"]);
            }
            setTempTemplateToInstantiate(false);
          }}
          onClose={() => setShowAddTerritoryModal(false)}
        />
      )}
    </>
  ) : (
    <div />
  );
};
