import { FloatingPortal, autoUpdate, flip, offset, useFloating } from "@floating-ui/react";
import { dropdownWildCard } from "@inkvisitor/shared/dictionaries/entity";
import { EntityEnums } from "@inkvisitor/shared/enums";
import { IEntity, IUserOptions } from "@inkvisitor/shared/types";
import { MIN_LABEL_LENGTH_MESSAGE, scrollOverscanCount } from "Theme/constants";
import { ThemeColor } from "Theme/theme";
import { IconButton, Input, Loader, TemplateActionModal, TypeBar } from "components";
import Dropdown from "components/advanced";
import { useTheme } from "hooks";
import useKeypress from "hooks/useKeyPress";
import React, { useEffect, useRef, useState } from "react";
import { DropTargetMonitor, useDrop } from "react-dnd";
import { FaPlus } from "react-icons/fa";
import { toast } from "react-toastify";
import { List } from "react-window";
import {
  EntityColors,
  EntityDragItem,
  EntitySingleDropdownItem,
  EntitySuggestion,
  ItemTypes,
  SuggesterItemToCreate,
} from "types";
import { SuggesterKeyPress } from "./SuggesterKeyPress";
import {
  StyledAiOutlineWarning,
  StyledInputWrapper,
  StyledRelativePosition,
  StyledSuggester,
  StyledSuggesterList,
  SuggesterHidden,
} from "./SuggesterStyles";
import { SuggestionRowEntityItemData, SuggestionRowEntityRow } from "./SuggestionRow/SuggestionRow";

interface Suggester {
  marginTop?: boolean;
  suggestions: EntitySuggestion[];
  placeholder?: string; // text to display when typed === ""
  typed: string; // input value
  category: EntityEnums.Class | EntityEnums.Extension.Any; // selected category
  categories: EntitySingleDropdownItem[]; // all possible categories
  disabled?: boolean; // todo not implemented yet
  inputWidth?: number | "full";
  disableCreate?: boolean;
  disableButtons?: boolean;
  isFetching?: boolean;

  preSuggestions?: EntitySuggestion[];

  // events
  onType: (newType: string) => void;
  onChangeCategory: (selectedOption: EntityEnums.Class | EntityEnums.Extension.Any) => void;
  onCreate: (item: SuggesterItemToCreate) => void;
  onPick: (entity: IEntity, instantiateTemplate?: boolean) => void;
  onDrop: (item: EntityDragItem, instantiateTemplate?: boolean) => void;
  onHover: (item: EntityDragItem) => void;
  onCancel: () => void;
  cleanOnSelect?: boolean;
  isWrongDropCategory?: boolean;
  isInsideTemplate: boolean;
  territoryParentId?: string;
  userOptions?: IUserOptions;
  autoFocus?: boolean;
  autoFocusInput?: boolean;
  disableEnter?: boolean;
  disableWildCard?: boolean;

  showCreateModal: boolean;
  setShowCreateModal: React.Dispatch<React.SetStateAction<boolean>>;
  alwaysShowCreateModal?: boolean;
  button?: React.ReactNode;
  disableTemplateInstantiation?: boolean;
  isHidden?: boolean;
  // Optional: allow parent to inject a dropped item (e.g., from a minified wrapper)
  externalDroppedItem?: EntityDragItem | null;
  onConsumeExternalDrop?: () => void;
  onEmptyAddButtonClick?: () => void;
  clearableInput?: boolean;
}

export const Suggester: React.FC<Suggester> = ({
  marginTop = false,
  suggestions = [],
  placeholder = "",
  typed,
  category,
  categories,
  disabled,
  inputWidth = 100,
  disableCreate = false,
  disableButtons = false,

  preSuggestions,

  // events
  onType,
  onChangeCategory,
  onCreate,
  onPick,
  onDrop,
  onHover,
  onCancel,
  isFetching,
  isWrongDropCategory,
  isInsideTemplate = false,
  territoryParentId,

  userOptions,
  autoFocus,
  autoFocusInput,
  disableEnter,
  disableWildCard,

  showCreateModal,
  setShowCreateModal,
  alwaysShowCreateModal,
  button,
  disableTemplateInstantiation = false,
  isHidden = false,
  externalDroppedItem,
  onConsumeExternalDrop,
  onEmptyAddButtonClick,
  clearableInput = true,
}) => {
  const [selected, setSelected] = useState(-1);
  const [isFocused, setIsFocused] = useState(false);
  const [isHovered, setIsHovered] = useState(false);

  const [showTemplateModal, setShowTemplateModal] = useState(false);
  const [tempDropItem, setTempDropItem] = useState<EntityDragItem | false>(false);

  useKeypress(
    "Escape",
    () => {
      if (!showCreateModal && isFocused) onCancel();
    },
    [showCreateModal, isFocused],
  );

  const inputRef = useRef<HTMLDivElement>(null);
  const [resultWidth, setResultWidth] = useState<number | undefined>(undefined);

  // measure the input width when focused
  useEffect(() => {
    if (isFocused && inputRef.current) {
      const width = inputRef.current.getBoundingClientRect().width;
      setResultWidth(width);
    }
  }, [isFocused]);

  const onTypeFn = (newType: string) => {
    setSelected(-1);
    onType(newType);
  };

  const dropRef = useRef<HTMLDivElement>(null);

  const [{ isOver }, drop] = useDrop({
    accept: ItemTypes.TAG,
    drop: (item: EntityDragItem) => {
      if (!isWrongDropCategory) {
        if (!item.isTemplate) {
          onDrop(item);
        } else if (item.isTemplate && !isInsideTemplate) {
          onDrop(item, true);
        } else if (item.isTemplate && isInsideTemplate) {
          if (item.entityClass === EntityEnums.Class.Territory) {
            // this option is now unused - not allowed to add T template to S template
            onDrop(item);
            // TODO: notification why not instantiated - used because of missing parent
          } else {
            setTempDropItem(item);
            setShowTemplateModal(true);
          }
        }
      }
    },
    hover: (item: EntityDragItem) => {
      onHover && onHover(item);
    },
    collect: (monitor: DropTargetMonitor) => ({
      isOver: !!monitor.isOver(),
    }),
  });

  drop(dropRef);

  // Handle externally injected drop (e.g., drop on minified button)
  useEffect(() => {
    if (!externalDroppedItem) return;
    // First notify hover so parent can compute isWrongDropCategory
    onHover && onHover(externalDroppedItem);
    const handle = requestAnimationFrame(() => {
      if (!isWrongDropCategory) {
        if (!externalDroppedItem.isTemplate) {
          onDrop(externalDroppedItem);
        } else if (externalDroppedItem.isTemplate && !isInsideTemplate) {
          onDrop(externalDroppedItem, true);
        } else if (externalDroppedItem.isTemplate && isInsideTemplate) {
          if (externalDroppedItem.entityClass === EntityEnums.Class.Territory) {
            onDrop(externalDroppedItem);
          } else {
            setTempDropItem(externalDroppedItem);
            setShowTemplateModal(true);
          }
        }
      }
      onConsumeExternalDrop && onConsumeExternalDrop();
    });
    return () => cancelAnimationFrame(handle);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [externalDroppedItem]);

  const handleEnterPress = () => {
    if (selected === -1 && typed.length > 0) {
      if (!disableCreate) {
        if (
          category === dropdownWildCard.value ||
          category === EntityEnums.Class.Statement ||
          category === EntityEnums.Class.Territory ||
          alwaysShowCreateModal
        ) {
          setShowCreateModal(true);
        } else {
          onCreate({
            label: typed.trim(),
            entityClass: category as EntityEnums.Class,
            language: false,
          });
        }
      }
    } else if (selected > -1) {
      if (!disableEnter) {
        const entity = suggestions[selected].entity;
        if (entity.status !== EntityEnums.Status.Discouraged) {
          if (!entity.isTemplate) {
            onPick(entity);
          } else if (entity.isTemplate && !isInsideTemplate) {
            onPick(entity, true);
          } else if (entity.isTemplate && isInsideTemplate) {
            // TODO: open modal to ask use / duplicate
            // setTempDropItem(entity);
            setShowTemplateModal(true);
          }
        }
      }
    } else {
      toast.info(MIN_LABEL_LENGTH_MESSAGE);
    }
    setSelected(-1);
  };

  const handleAddBtnClick = () => {
    if (typed.length > 0) {
      if (
        category === dropdownWildCard.value ||
        category === EntityEnums.Class.Statement ||
        category === EntityEnums.Class.Territory ||
        alwaysShowCreateModal
      ) {
        setShowCreateModal(true);
      } else {
        onCreate({
          label: typed.trim(),
          entityClass: category as EntityEnums.Class,
          language: false,
        });
      }
    } else {
      if (onEmptyAddButtonClick) {
        onEmptyAddButtonClick();
      } else {
        toast.info("Fill at least 1 character");
      }
    }
    setSelected(-1);
  };

  const renderEntitySuggestions = (suggestions: EntitySuggestion[]) => {
    const rowHeight = 25;

    return (
      <List<SuggestionRowEntityItemData>
        rowProps={{ items: suggestions }}
        rowCount={suggestions.length}
        rowHeight={rowHeight}
        style={{ maxHeight: "20rem" }}
        overscanCount={scrollOverscanCount}
        rowComponent={(props) => {
          return (
            <SuggestionRowEntityRow
              {...props}
              data={{ items: suggestions }}
              selected={selected}
              isInsideTemplate={isInsideTemplate}
              territoryParentId={territoryParentId}
              disableButtons={disableButtons}
              disableTemplateInstantiation={disableTemplateInstantiation}
              onPick={(entity, instantiate) => {
                setIsHovered(false);
                onPick(entity, instantiate);
              }}
            />
          );
        }}
      />
    );
  };

  const { refs, floatingStyles, middlewareData } = useFloating({
    placement: "bottom-start",
    whileElementsMounted: autoUpdate,
    middleware: [offset(1), flip({ padding: 10 })],
  });

  const theme = useTheme();

  // Entity class drives the control's identity: the selected class colour tints
  // the focus/hover ring and the create button, so the whole suggester announces
  // which class you are searching/creating. Falls back to info for the wildcard.
  const entityColorKey = EntityColors[category]?.color;
  const accentColorKey: keyof ThemeColor =
    entityColorKey && entityColorKey !== "white" ? entityColorKey : "info";
  const PALE_ENTITY_COLORS: string[] = ["white", "entityB"];
  const buttonColorKey: keyof ThemeColor =
    entityColorKey && !PALE_ENTITY_COLORS.includes(entityColorKey) ? entityColorKey : "primary";

  if (isHidden) {
    return <SuggesterHidden />;
  }

  // The create button now lives inside the input (as rightContent) instead of a
  // separate trailing segment. Reserve its footprint in the input width so the
  // typing area stays as roomy as before and the suggester keeps its overall size.
  const CREATE_BUTTON_WIDTH = 25;
  const effectiveInputWidth =
    typeof inputWidth === "number" && !disableCreate
      ? inputWidth + CREATE_BUTTON_WIDTH
      : inputWidth;

  return (
    // div is necessary for flex to work and render the clear button properly
    <div style={{ width: inputWidth === "full" ? "100%" : undefined }}>
      <StyledSuggester
        $marginTop={marginTop}
        $fullWidth={inputWidth === "full"}
        $isFocused={isFocused}
      >
        <StyledInputWrapper
          ref={dropRef}
          $hasButton={!disableCreate}
          $isOver={isOver}
          $isFocused={isFocused}
          $accentColor={accentColorKey}
        >
          <Dropdown.Single.Entity
            value={category}
            options={disableWildCard ? [...categories] : [dropdownWildCard, ...categories]}
            onChange={onChangeCategory}
            width={categories.length > 1 ? 33 : 26}
            onFocus={() => {
              setSelected(-1);
              setIsFocused(true);
            }}
            onBlur={() => setIsFocused(false)}
            disableTyping
            suggester
            disabled={disabled}
            autoFocus={categories.length > 1 && autoFocus && !autoFocusInput}
          />
          <TypeBar entityLetter={category} noMargin width={5} />

          <div
            ref={(node) => {
              refs.setReference(node);
              inputRef.current = node;
            }}
            style={{
              width: "100%",
            }}
          >
            <Input
              type="text"
              value={typed}
              onChangeFn={(newType: string) => onTypeFn(newType)}
              placeholder={placeholder}
              suggester
              changeOnType
              width={effectiveInputWidth}
              roundCorners={false}
              onFocus={() => {
                setIsFocused(true);
              }}
              onBlur={() => {
                // Comment this for debug
                setIsFocused(false);
                setSelected(-1);
              }}
              onEnterPressFn={handleEnterPress}
              autoFocus={(categories.length === 1 || autoFocusInput) && autoFocus}
              disabled={disabled}
              fullHeight
              clearable={clearableInput}
              rightContent={
                !disableCreate ? (
                  <IconButton
                    icon={<FaPlus />}
                    tooltipLabel="create new entity"
                    color={buttonColorKey}
                    noBackground
                    noBorder
                    onClick={() => {
                      handleAddBtnClick();
                    }}
                    disabled={disabled}
                  />
                ) : (
                  button && button
                )
              }
            />
          </div>
        </StyledInputWrapper>

        {isWrongDropCategory && isOver && (
          <StyledAiOutlineWarning size={22} color={theme.color.warning} />
        )}

        {(isFocused || isHovered) && !middlewareData.hide?.referenceHidden && (
          <FloatingPortal id="page-content">
            <StyledSuggesterList
              ref={refs.setFloating}
              data-suggester-portal="true"
              onMouseDown={(event) => {
                // Prevent annotator click-away handlers from closing while interacting
                // with the suggester dropdown rendered in a portal. (e.g. annotator highlight menu)
                event.stopPropagation();
              }}
              onMouseEnter={() => setIsHovered(true)}
              onMouseLeave={() => setIsHovered(false)}
              style={{
                ...floatingStyles,
              }}
            >
              {suggestions.length || (isFetching && isFocused) ? (
                <>
                  <StyledRelativePosition $width={resultWidth}>
                    {renderEntitySuggestions(suggestions)}
                    <Loader size={30} show={isFetching} />
                  </StyledRelativePosition>
                  <SuggesterKeyPress
                    onArrowDown={() => {
                      if (selected < suggestions.length - 1) setSelected(selected + 1);
                    }}
                    onArrowUp={() => {
                      if (selected > -1) setSelected(selected - 1);
                    }}
                    dependencyArr={[selected]}
                  />
                </>
              ) : null}

              {/* PRE-SUGGESTIONS */}
              {preSuggestions && preSuggestions.length > 0 && typed.length === 0 ? (
                <>
                  <StyledRelativePosition $width={resultWidth}>
                    {renderEntitySuggestions(preSuggestions)}
                    <Loader size={30} show={isFetching} />
                  </StyledRelativePosition>
                  <SuggesterKeyPress
                    onArrowDown={() => {
                      if (selected < preSuggestions.length - 1) setSelected(selected + 1);
                    }}
                    onArrowUp={() => {
                      if (selected > -1) setSelected(selected - 1);
                    }}
                    dependencyArr={[selected]}
                  />
                </>
              ) : null}
            </StyledSuggesterList>
          </FloatingPortal>
        )}
      </StyledSuggester>

      {showTemplateModal && (
        <TemplateActionModal
          onClose={() => {
            setTempDropItem(false);
            setShowTemplateModal(false);
          }}
          onUse={() => {
            {
              tempDropItem && onDrop(tempDropItem);
              setTempDropItem(false);
              setShowTemplateModal(false);
            }
          }}
          onInstantiate={() => {
            tempDropItem && onDrop(tempDropItem, true);
            setTempDropItem(false);
            setShowTemplateModal(false);
          }}
        />
      )}
    </div>
  );
};
