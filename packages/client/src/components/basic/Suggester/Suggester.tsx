import {
  FloatingPortal,
  autoUpdate,
  flip,
  useFloating,
} from "@floating-ui/react";
import { entitiesDictKeys } from "@shared/dictionaries";
import { EntityEnums } from "@shared/enums";
import { IEntity, IUserOptions } from "@shared/types";
import { DropdownAny, scrollOverscanCount } from "Theme/constants";
import theme from "Theme/theme";
import {
  Button,
  Dropdown,
  Input,
  Loader,
  TemplateActionModal,
  TypeBar,
} from "components";
import useKeypress from "hooks/useKeyPress";
import React, { useState } from "react";
import { DropTargetMonitor, useDrop } from "react-dnd";
import { FaPlus } from "react-icons/fa";
import { MdCancel } from "react-icons/md";
import { toast } from "react-toastify";
import { FixedSizeList as List } from "react-window";
import {
  DropdownItem,
  EntityDragItem,
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
  StyledSuggesterButton,
  StyledSuggesterList,
  StyledSuggestionCancelButton,
} from "./SuggesterStyles";
import {
  MemoizedEntityRow,
  SuggestionRowEntityItemData,
  createItemData,
} from "./SuggestionRow/SuggestionRow";

interface Suggester {
  marginTop?: boolean;
  suggestions: EntitySuggestion[];
  placeholder?: string; // text to display when typed === ""
  typed: string; // input value
  category: DropdownItem; // selected category
  categories: DropdownItem[]; // all possible categories
  disabled?: boolean; // todo not implemented yet
  inputWidth?: number | "full";
  disableCreate?: boolean;
  disableButtons?: boolean;
  isFetching?: boolean;

  // events
  onType: (newType: string) => void;
  onChangeCategory: (selectedOption: DropdownItem[]) => void;
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
  disableEnter?: boolean;

  showCreateModal: boolean;
  setShowCreateModal: React.Dispatch<React.SetStateAction<boolean>>;
}

export const Suggester: React.FC<Suggester> = ({
  marginTop,
  suggestions = [],
  placeholder = "",
  typed,
  category,
  categories,
  disabled,
  inputWidth = 80,
  disableCreate = false,
  disableButtons = false,

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
  disableEnter,

  showCreateModal,
  setShowCreateModal,
}) => {
  const [selected, setSelected] = useState(-1);
  const [isFocused, setIsFocused] = useState(false);
  const [isHovered, setIsHovered] = useState(false);

  const [showTemplateModal, setShowTemplateModal] = useState(false);
  const [tempDropItem, setTempDropItem] = useState<EntityDragItem | false>(
    false
  );

  useKeypress(
    "Escape",
    () => {
      if (!showCreateModal && isFocused) onCancel();
    },
    [showCreateModal, isFocused]
  );

  const onTypeFn = (newType: string) => {
    setSelected(-1);
    onType(newType);
  };

  const [{ isOver }, dropRef] = useDrop({
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

  const handleEnterPress = () => {
    if (selected === -1 && typed.length > 0) {
      if (
        category.value === DropdownAny ||
        category.value === EntityEnums.Class.Statement ||
        category.value === EntityEnums.Class.Territory
      ) {
        setShowCreateModal(true);
      } else {
        onCreate({
          label: typed,
          entityClass:
            entitiesDictKeys[category.value as EntityEnums.Class].value,
          language: false,
        });
      }
    } else if (selected > -1) {
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
    } else {
      toast.info("Fill at least 1 character");
    }
    setSelected(-1);
  };

  const handleAddBtnClick = () => {
    if (typed.length > 0) {
      if (
        category.value === DropdownAny ||
        category.value === EntityEnums.Class.Statement ||
        category.value === EntityEnums.Class.Territory
      ) {
        setShowCreateModal(true);
      } else {
        onCreate({
          label: typed,
          entityClass:
            entitiesDictKeys[category.value as EntityEnums.Class].value,
          language: false,
        });
      }
    } else {
      toast.info("Fill at least 1 character");
    }
    setSelected(-1);
  };

  const renderEntitySuggestions = () => {
    const itemData: SuggestionRowEntityItemData = createItemData(
      suggestions as EntitySuggestion[],
      onPick,
      selected,
      isInsideTemplate,
      territoryParentId,
      disableButtons
    );
    const rowHeight = 25;
    return (
      <List
        itemData={itemData as SuggestionRowEntityItemData}
        height={
          suggestions.length > 7
            ? rowHeight * 8
            : rowHeight * suggestions.length
        }
        itemCount={suggestions.length}
        itemSize={rowHeight}
        width="100%"
        overscanCount={scrollOverscanCount}
      >
        {MemoizedEntityRow}
      </List>
    );
  };

  const { refs, floatingStyles, middlewareData } = useFloating({
    placement: "bottom-start",
    whileElementsMounted: autoUpdate,
    middleware: [flip({ padding: 10 })],
  });

  return (
    // div is necessary for flex to work and render the clear button properly
    <div>
      <StyledSuggester marginTop={marginTop}>
        <StyledInputWrapper
          ref={dropRef}
          hasButton={!disableCreate}
          isOver={isOver}
          hasText={typed.length > 0}
        >
          <Dropdown
            value={{ label: category.label, value: category.value }}
            options={categories}
            onChange={onChangeCategory}
            width={36}
            entityDropdown
            onFocus={() => {
              setSelected(-1);
              setIsFocused(true);
            }}
            onBlur={() => setIsFocused(false)}
            disableTyping
            suggester
            disabled={disabled}
            autoFocus={categories.length > 1 && autoFocus}
          />
          <TypeBar entityLetter={category.value} />

          <div ref={refs.setReference}>
            <Input
              type="text"
              value={typed}
              onChangeFn={(newType: string) => onTypeFn(newType)}
              placeholder={placeholder}
              suggester
              changeOnType={true}
              width={inputWidth}
              onFocus={() => {
                setIsFocused(true);
              }}
              onBlur={() => {
                // Comment this for debug
                setIsFocused(false);
                setSelected(-1);
              }}
              onEnterPressFn={() => {
                if (!disableEnter) {
                  handleEnterPress();
                }
              }}
              autoFocus={categories.length === 1 && autoFocus}
              disabled={disabled}
            />
          </div>
          {typed.length > 0 && (
            <StyledSuggestionCancelButton hasButton={!disableCreate}>
              <MdCancel size={16} onClick={() => onCancel()} />
            </StyledSuggestionCancelButton>
          )}

          {!disableCreate && (
            <StyledSuggesterButton>
              <Button
                icon={<FaPlus style={{ fontSize: "16px", padding: "2px" }} />}
                tooltipLabel="create new entity"
                color="primary"
                inverted={selected !== -1}
                onClick={() => {
                  handleAddBtnClick();
                }}
                disabled={disabled}
              />
            </StyledSuggesterButton>
          )}
        </StyledInputWrapper>

        {isWrongDropCategory && isOver && (
          <StyledAiOutlineWarning size={22} color={theme.color["warning"]} />
        )}

        {((isFocused || isHovered) &&
          suggestions.length &&
          !middlewareData.hide?.referenceHidden) ||
        (isFetching && isFocused) ? (
          <>
            <FloatingPortal id="page">
              <StyledSuggesterList
                ref={refs.setFloating}
                noLeftMargin={categories.length === 1}
                onMouseEnter={() => setIsHovered(true)}
                onMouseLeave={() => setIsHovered(false)}
                style={{
                  ...floatingStyles,
                }}
              >
                <StyledRelativePosition>
                  {renderEntitySuggestions()}
                  <Loader size={30} show={isFetching} />
                </StyledRelativePosition>
                {!disableEnter && (
                  <SuggesterKeyPress
                    onArrowDown={() => {
                      if (selected < suggestions.length - 1)
                        setSelected(selected + 1);
                    }}
                    onArrowUp={() => {
                      if (selected > -1) setSelected(selected - 1);
                    }}
                    dependencyArr={[selected]}
                  />
                )}
              </StyledSuggesterList>
            </FloatingPortal>
          </>
        ) : null}
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
