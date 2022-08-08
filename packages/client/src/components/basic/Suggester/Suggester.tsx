import { entitiesDictKeys } from "@shared/dictionaries";
import { EntityClass } from "@shared/enums";
import { IEntity, IOption } from "@shared/types";
import { Button, Dropdown, Input, Loader, TypeBar } from "components";
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
  EntityItemData,
  MemoizedEntityRow,
} from "./SuggestionRow/SuggestionRow";

interface Suggester {
  marginTop?: boolean;
  suggestions: EntitySuggestion[];
  placeholder?: string; // text to display when typed === ""
  typed: string; // input value
  category: IOption; // selected category
  categories: IOption[]; // all possible categories
  suggestionListPosition?: string; // todo not implemented yet
  disabled?: boolean; // todo not implemented yet
  inputWidth?: number | "full";
  disableCreate?: boolean;
  allowDrop?: boolean;
  isFetching?: boolean;

  // events
  onType: (newType: string) => void;
  onChangeCategory: (selectedOption: ValueType<OptionTypeBase, any>) => void;
  onCreate?: (item: SuggesterItemToCreate) => void;
  onPick: (entity: IEntity) => void;
  onDrop?: (item: EntityDragItem) => void;
  onHover?: (item: EntityDragItem) => void;
  onCancel?: () => void;
  cleanOnSelect?: boolean;
  isWrongDropCategory?: boolean;
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
  inputWidth = 100,
  disableCreate = false,
  allowDrop = false,

  // events
  onType,
  onChangeCategory,
  onCreate = () => {},
  onPick,
  onDrop = () => {},
  onHover,
  onCancel = () => {},
  isFetching,
  isWrongDropCategory,
}) => {
  const [{ isOver }, dropRef] = useDrop({
    accept: ItemTypes.TAG,
    drop: (item: EntityDragItem) => {
      onDrop(item);
    },
    hover: (item: EntityDragItem) => {
      onHover && onHover(item);
    },
    collect: (monitor: DropTargetMonitor) => ({
      isOver: !!monitor.isOver(),
    }),
  });
  const [selected, setSelected] = useState(-1);
  const [isFocused, setIsFocused] = useState(false);
  const [isHovered, setIsHovered] = useState(false);
  const [showModal, setShowModal] = useState(false);

  useKeypress(
    "Escape",
    () => {
      if (!showModal && isFocused) onCancel();
    },
    [showModal, isFocused]
  );

  const onTypeFn = (newType: string) => {
    setSelected(-1);
    onType(newType);
  };

  const handleEnterPress = () => {
    if (selected === -1 && typed.length > 0) {
      if (
        category.value === DropdownAny ||
        category.value === EntityClass.Statement ||
        category.value === EntityClass.Territory
      ) {
        setShowModal(true);
      } else {
        onCreate({
          label: typed,
          entityClass: entitiesDictKeys[category.value as EntityClass].value,
        });
      }
    } else if (selected > -1) {
      onPick(suggestions[selected].entity);
    } else {
      toast.info("Fill at least 1 character");
    }
    setSelected(-1);
  };

  const handleAddBtnClick = () => {
    if (typed.length > 0) {
      if (
        category.value === DropdownAny ||
        category.value === EntityClass.Statement ||
        category.value === EntityClass.Territory
      ) {
        setShowModal(true);
      } else {
        onCreate({
          label: typed,
          entityClass: entitiesDictKeys[category.value as EntityClass].value,
        });
      }
    } else {
      toast.info("Fill at least 1 character");
    }
    setSelected(-1);
  };

  const renderEntitySuggestions = () => {
    const itemData = createItemData(
      suggestions as EntitySuggestion[],
      onPick,
      selected
    );
    return (
      <List
        itemData={itemData as EntityItemData}
        height={suggestions.length > 7 ? 200 : suggestions.length * 25}
        itemCount={suggestions.length}
        itemSize={25}
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
        >
          <Dropdown
            value={{ label: category.label, value: category.value }}
            options={categories}
            onChange={onChangeCategory}
            width={36}
            entityDropdown
            onFocus={() => {
              setSelected(-1);
              // setIsFocused(true);
            }}
            onBlur={() => setIsFocused(false)}
            disableTyping
            suggester
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
              setIsFocused(false);
              setSelected(-1);
            }}
            onEnterPressFn={() => {
              handleEnterPress();
            }}
          />
          {typed.length > 0 && (
            <StyledSuggestionCancelButton hasButton={!disableCreate}>
              <MdCancel onClick={() => onCancel()} />
            </StyledSuggestionCancelButton>
          )}

          {!disableCreate && (
            <StyledSuggesterButton>
              <Button
                icon={<FaPlus style={{ fontSize: "16px", padding: "2px" }} />}
                tooltip="create new actant"
                color="primary"
                inverted={selected !== -1}
                onClick={() => {
                  handleAddBtnClick();
                }}
              />
            </StyledSuggesterButton>
          )}
        </StyledInputWrapper>

        {isWrongDropCategory && isOver && (
          <StyledAiOutlineWarning size={22} color={theme.color["warning"]} />
        )}

        {((isFocused || isHovered) && suggestions.length) || isFetching ? (
          <StyledSuggesterList
            onMouseOver={() => setIsHovered(true)}
            onMouseOut={() => setIsHovered(false)}
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

      {showModal && (
        <SuggesterCreateModal
          show={true}
          typed={typed}
          category={category}
          categories={categories.slice(1)}
          onCreate={onCreate}
          closeModal={() => setShowModal(false)}
        />
      )}
    </>
  );
};
