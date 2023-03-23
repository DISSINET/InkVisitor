import { entitiesDictKeys } from "@shared/dictionaries";
import { EntityEnums } from "@shared/enums";
import { IEntity, IUserOptions } from "@shared/types";
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
import { OptionTypeBase, ValueType } from "react-select";
import { toast } from "react-toastify";
import { FixedSizeList as List } from "react-window";
import { DropdownAny, scrollOverscanCount } from "Theme/constants";
import theme from "Theme/theme";
import {
  DropdownItem,
  EntityDragItem,
  EntitySuggestion,
  ItemTypes,
  SuggesterItemToCreate,
} from "types";
import { SuggesterCreateModal } from "./SuggesterCreateModal/SuggesterCreateModal";
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
  createItemData,
  MemoizedEntityRow,
  SuggestionRowEntityItemData,
} from "./SuggestionRow/SuggestionRow";

interface Suggester {
  marginTop?: boolean;
  suggestions: EntitySuggestion[];
  placeholder?: string; // text to display when typed === ""
  typed: string; // input value
  category: DropdownItem; // selected category
  categories: DropdownItem[]; // all possible categories
  suggestionListPosition?: string; // todo not implemented yet
  disabled?: boolean; // todo not implemented yet
  inputWidth?: number | "full";
  disableCreate?: boolean;
  disableButtons?: boolean;
  allowDrop?: boolean;
  isFetching?: boolean;

  // events
  onType: (newType: string) => void;
  onChangeCategory: (selectedOption: ValueType<OptionTypeBase, any>) => void;
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
}

export const Suggester: React.FC<Suggester> = ({
  marginTop,
  suggestions = [],
  placeholder = "",
  typed,
  category,
  categories,
  suggestionListPosition,
  disabled,
  inputWidth = 80,
  disableCreate = false,
  disableButtons = false,
  allowDrop = false,

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
}) => {
  const [selected, setSelected] = useState(-1);
  const [isFocused, setIsFocused] = useState(false);
  const [isHovered, setIsHovered] = useState(false);

  const [showCreateModal, setShowCreateModal] = useState(false);
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
          setTempDropItem(item);
          setShowTemplateModal(true);
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

  return (
    <>
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
            autoFocus={autoFocus}
          />
          <TypeBar entityLetter={category.value} />
          <Input
            type="text"
            value={typed}
            onChangeFn={(newType: string) => onTypeFn(newType)}
            placeholder={placeholder}
            suggester
            changeOnType={true}
            width={inputWidth}
            onFocus={() => setIsFocused(true)}
            onBlur={() => {
              // Comment this for debug
              setIsFocused(false);
              setSelected(-1);
            }}
            onEnterPressFn={() => {
              handleEnterPress();
            }}
            disabled={disabled}
          />
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

        {((isFocused || isHovered) && suggestions.length) || isFetching ? (
          <StyledSuggesterList
            noLeftMargin={categories.length === 1}
            onMouseEnter={() => setIsHovered(true)}
            onMouseLeave={() => setIsHovered(false)}
          >
            <StyledRelativePosition>
              {renderEntitySuggestions()}

              <Loader size={30} show={isFetching} />
            </StyledRelativePosition>
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
          </StyledSuggesterList>
        ) : null}
      </StyledSuggester>

      {showCreateModal && (
        <SuggesterCreateModal
          typed={typed}
          category={category}
          categories={categories.slice(1)}
          defaultLanguage={userOptions ? userOptions.defaultLanguage : false}
          onCreate={onCreate}
          closeModal={() => setShowCreateModal(false)}
        />
      )}
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
    </>
  );
};
