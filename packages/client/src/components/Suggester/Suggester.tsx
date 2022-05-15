import { EntityClass, EntityStatus } from "@shared/enums";
import { IOption } from "@shared/types";
import { Button, Dropdown, Input, Loader, Tag } from "components";
import useKeypress from "hooks/useKeyPress";
import React, { useState } from "react";
import { DragObjectWithType, DropTargetMonitor, useDrop } from "react-dnd";
import { FaPlayCircle, FaPlus } from "react-icons/fa";
import { MdCancel } from "react-icons/md";
import { OptionTypeBase, ValueType } from "react-select";
import { toast } from "react-toastify";
import { DropdownAny } from "Theme/constants";
import theme from "Theme/theme";
import { ItemTypes } from "types";
import { SuggesterKeyPress } from "./SuggesterKeyPress";
import { SuggesterModal } from "./SuggesterModal";
import {
  StyledAiOutlineWarning,
  StyledInputWrapper,
  StyledRelativePosition,
  StyledSuggester,
  StyledSuggesterButton,
  StyledSuggesterList,
  StyledSuggestionCancelButton,
  StyledSuggestionLineActions,
  StyledSuggestionLineIcons,
  StyledSuggestionLineTag,
  StyledTagWrapper,
  StyledTypeBar,
} from "./SuggesterStyles";

export interface EntitySuggestionI {
  id: string;
  label: string;
  detail: string;
  ltype: string;
  status: EntityStatus;
  category: string;
  color: string;
  icons?: React.ReactNode[];
}
export interface UserSuggestionI {
  id: string;
  label: string;
  icons?: React.ReactNode[];
}

interface Suggester {
  marginTop?: boolean;
  suggesterType?: "entity" | "user";
  suggestions: EntitySuggestionI[] | UserSuggestionI[];
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
  onCreate?: Function;
  onPick: Function;
  onDrop?: Function;
  onHover?: Function;
  onCancel?: Function;
  cleanOnSelect?: boolean;
  isWrongDropCategory?: boolean;
}

const MAXSUGGESTIONDISPLAYED = 10;

export const Suggester: React.FC<Suggester> = ({
  marginTop,
  suggesterType = "entity",
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
    drop: (item: DragObjectWithType) => {
      onDrop(item);
    },
    hover: (item: DragObjectWithType) => {
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
        onCreate({ label: typed, category: category.value });
      }
    } else if (selected > -1) {
      onPick(suggestions[selected]);
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
        onCreate({ label: typed, category: category.value });
      }
    } else {
      toast.info("Fill at least 1 character");
    }
    setSelected(-1);
  };

  const renderEntitySuggestions = () => {
    return (
      <>
        {(suggestions as EntitySuggestionI[])
          .filter((s, si) => si < MAXSUGGESTIONDISPLAYED)
          .map((suggestion, si) => (
            <React.Fragment key={si}>
              <StyledSuggestionLineActions isSelected={selected === si}>
                {suggestion.status !== EntityStatus.Discouraged && (
                  <FaPlayCircle
                    color={theme.color["black"]}
                    onClick={() => {
                      onPick(suggestion);
                    }}
                  />
                )}
              </StyledSuggestionLineActions>
              <StyledSuggestionLineTag isSelected={selected === si}>
                <StyledTagWrapper>
                  <Tag
                    fullWidth
                    propId={suggestion.id}
                    label={suggestion.label}
                    status={suggestion.status}
                    ltype={suggestion.ltype}
                    tooltipDetail={suggestion.detail}
                    category={suggestion.category}
                  />
                </StyledTagWrapper>
              </StyledSuggestionLineTag>
              <StyledSuggestionLineIcons isSelected={selected === si}>
                {suggestion.icons}
              </StyledSuggestionLineIcons>
            </React.Fragment>
          ))}
      </>
    );
  };

  const renderUserSuggestions = () => {
    return (
      <>
        {(suggestions as UserSuggestionI[])
          .filter((s, si) => si < MAXSUGGESTIONDISPLAYED)
          .map((suggestion, si) => (
            <React.Fragment key={si}>
              <StyledSuggestionLineActions isSelected={selected === si}>
                <FaPlayCircle
                  color={theme.color["black"]}
                  onClick={() => {
                    onPick(suggestion);
                  }}
                />
              </StyledSuggestionLineActions>
              <StyledSuggestionLineTag isSelected={selected === si}>
                <StyledTagWrapper>
                  <Tag
                    fullWidth
                    propId={suggestion.id}
                    label={suggestion.label}
                    category={"U"}
                  />
                </StyledTagWrapper>
              </StyledSuggestionLineTag>
              <StyledSuggestionLineIcons isSelected={selected === si}>
                {suggestion.icons}
              </StyledSuggestionLineIcons>
            </React.Fragment>
          ))}
      </>
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
          <StyledTypeBar entity={`entity${category.value}`}></StyledTypeBar>
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
              {suggesterType === "entity" && <>{renderEntitySuggestions()}</>}
              {suggesterType === "user" && <>{renderUserSuggestions()}</>}
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
        <SuggesterModal
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
