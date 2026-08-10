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
  StyledEmptyCategory,
  StyledInputWrapper,
  StyledRelativePosition,
  StyledRightContentDivider,
  StyledSuggester,
  StyledSuggesterList,
  SuggesterHidden,
} from "./SuggesterStyles";
import { SuggestionRowEntityItemData, SuggestionRowEntityRow } from "./SuggestionRow/SuggestionRow";
import { IcoMinus, IcoPlusBold } from "Theme/icons";

interface Suggester {
  marginTop?: boolean;
  suggestions: EntitySuggestion[];
  placeholder?: string; // text to display when typed === ""
  typed: string; // input value
  category: EntityEnums.Class | EntityEnums.Extension.Any; // selected category
  categories: EntitySingleDropdownItem[]; // all possible categories
  disabled?: boolean; // todo not implemented yet
  inputWidth?: number | "full";
  // Explicit width for the suggestions dropdown. When unset the list matches the
  // measured input width; set it to intentionally show a wider results list.
  suggestionListWidth?: number;
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
  // rendered inside the input's trailing slot (only when disableCreate is set,
  // where the create button would otherwise sit)
  rightContent?: React.ReactNode;
  // notifies the parent when the input gains/loses focus (e.g. the annotator
  // highlights the elvl group while the suggester is focused)
  onFocusChange?: (isFocused: boolean) => void;
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
  suggestionListWidth,
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
  rightContent,
  onFocusChange,
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

  // Explicit override wins over the measured input width so the results list can
  // intentionally be wider than the input.
  const effectiveResultWidth = suggestionListWidth ?? resultWidth;

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
    // Statements are created without a label, so allow triggering create with an
    // empty input; other classes still require at least one character.
    if (selected === -1 && (typed.length > 0 || category === EntityEnums.Class.Statement)) {
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
    // Statements are created without a label, so allow triggering create with an
    // empty input; other classes still require at least one character.
    if (typed.length > 0 || category === EntityEnums.Class.Statement) {
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
  // The category dropdown is narrower when only one class is available (26 vs 33,
  // see its width prop below), so single-class suggesters would end up narrower
  // overall than multi-class ones for the same inputWidth. Add this back to the
  // input width in the single-class case so the overall width stays consistent
  // regardless of class count. Finetune this value.
  const SINGLE_CLASS_WIDTH_COMPENSATION = 7;
  const effectiveInputWidth =
    typeof inputWidth === "number"
      ? inputWidth +
        (disableCreate ? 0 : CREATE_BUTTON_WIDTH) +
        (categories.length > 1 ? 0 : SINGLE_CLASS_WIDTH_COMPENSATION)
      : inputWidth;

  const dropdownOptions = disableWildCard ? [...categories] : [dropdownWildCard, ...categories];
  const categoryBoxWidth = categories.length > 1 ? 33 : 26;
  // an edge that constrains the target to no class at all leaves the caller with
  // nothing real to pass as the category, so it falls back to a placeholder
  // class; naming that class in the control or the type bar would claim a
  // choice the user cannot make here
  const categoryIsOffered = dropdownOptions.some((option) => option.value === category);

  // The input draws the slot (and its divider next to the clear button) for any
  // rightContent it is handed, so the slot is only worth handing over when the
  // create button, the caller's own content or the fallback button fills it.
  const hasRightContent = !disableCreate || !!rightContent || !!button;

  return (
    // div is necessary for flex to work and render the clear button properly
    <div style={{ width: inputWidth === "full" ? "100%" : undefined }}>
      {/* the drop ref covers the warning icon too - a pointer crossing onto it
          would otherwise leave the target, hide the icon, and land back on the
          target, flickering for as long as it hovers there */}
      <StyledSuggester
        ref={dropRef}
        $marginTop={marginTop}
        $fullWidth={inputWidth === "full"}
        $isFocused={isFocused}
      >
        <StyledInputWrapper
          $hasButton={!disableCreate}
          $isOver={isOver}
          $isFocused={isFocused}
          $accentColor={accentColorKey}
          $disabled={disabled}
        >
          {categoryIsOffered ? (
            <Dropdown.Single.Entity
              value={category}
              options={dropdownOptions}
              onChange={onChangeCategory}
              width={categoryBoxWidth}
              // the control is only wide enough for a single class letter, so a
              // worded fallback would spill over the type bar and the input
              placeholder=""
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
          ) : (
            <StyledEmptyCategory $width={categoryBoxWidth}>
              <IcoMinus size={9} />
            </StyledEmptyCategory>
          )}
          <TypeBar
            entityLetter={category}
            color={categoryIsOffered ? undefined : "grey"}
            noMargin
            width={5}
            dimColor={disabled}
          />

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
                onFocusChange && onFocusChange(true);
              }}
              onBlur={() => {
                // Comment this for debug
                setIsFocused(false);
                onFocusChange && onFocusChange(false);
                setSelected(-1);
              }}
              onEnterPressFn={handleEnterPress}
              autoFocus={(categories.length === 1 || autoFocusInput) && autoFocus}
              disabled={disabled}
              fullHeight
              clearable={clearableInput}
              rightContent={
                hasRightContent ? (
                  <>
                    {/* rightContent renders alongside the create button (e.g. the
                        annotator's elvl group); the button fallback only applies
                        when create is disabled and no rightContent is provided. */}
                    {rightContent ? rightContent : disableCreate ? button && button : null}
                    {!disableCreate && (
                      <>
                        {rightContent && <StyledRightContentDivider />}
                        <IconButton
                          icon={<IcoPlusBold />}
                          tooltipLabel="create new entity"
                          color={buttonColorKey}
                          noBackground
                          noBorder
                          onClick={() => {
                            handleAddBtnClick();
                          }}
                          disabled={disabled}
                        />
                      </>
                    )}
                  </>
                ) : undefined
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
                  <StyledRelativePosition $width={effectiveResultWidth}>
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
                  <StyledRelativePosition $width={effectiveResultWidth}>
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
