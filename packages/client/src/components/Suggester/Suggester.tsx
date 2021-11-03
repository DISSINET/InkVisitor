import React, { useEffect, useState } from "react";
import { DragObjectWithType, DropTargetMonitor, useDrop } from "react-dnd";
import { FaPlus, FaPlayCircle } from "react-icons/fa";
import { MdCancel } from "react-icons/md";

import {
  Button,
  ButtonGroup,
  Input,
  Loader,
  Modal,
  ModalContent,
  ModalFooter,
  ModalHeader,
  Tag,
} from "components";
import { IOption } from "@shared/types";
import { ItemTypes } from "types";
import {
  StyledSuggester,
  StyledInputWrapper,
  StyledSuggesterButton,
  StyledSuggesterList,
  StyledSuggestionLineIcons,
  StyledSuggestionLineTag,
  StyledSuggestionLineActions,
  StyledSuggestionCancelButton,
  StyledRelativePosition,
  StyledTypeBar,
  StyledTagWrapper,
} from "./SuggesterStyles";
import { SuggesterKeyPress } from "./SuggesterKeyPress";
import { toast } from "react-toastify";
import { SuggesterModal } from "./SuggesterModal";
import { ActantStatus } from "@shared/enums";
import useKeypress from "hooks/useKeyPress";

export interface SuggestionI {
  id: string;
  label: string;
  detail: string;
  ltype: string;
  status: ActantStatus;
  category: string;
  color: string;
  icons?: React.ReactNode[];
}

interface SuggesterProps {
  marginTop?: boolean;
  suggestions: SuggestionI[];
  placeholder?: string; // text to display when typed === ""
  typed: string; // input value
  category: string; // selected category
  categories: IOption[]; // all possible categories
  suggestionListPosition?: string; // todo not implemented yet
  disabled?: boolean; // todo not implemented yet
  inputWidth?: number;
  displayCancelButton?: boolean;
  allowCreate?: boolean;
  allowDrop?: boolean;
  isFetching?: boolean;

  // events
  onType: (newType: string) => void;
  onChangeCategory: Function;
  onCreate: Function;
  onPick: Function;
  onDrop: Function;
  onCancel?: Function;
  cleanOnSelect?: boolean;
}

const MAXSUGGESTIONDISPLAYED = 10;

export const Suggester: React.FC<SuggesterProps> = ({
  marginTop,
  suggestions = [],
  placeholder = "",
  typed,
  category,
  categories,
  suggestionListPosition,
  disabled,
  inputWidth = 100,
  displayCancelButton = false,
  allowCreate = true,
  allowDrop = false,

  // events
  onType,
  onChangeCategory,
  onCreate,
  onPick,
  onDrop,
  onCancel = () => {},
  isFetching,
}) => {
  const [{ isOver }, dropRef] = useDrop({
    accept: ItemTypes.TAG,
    drop: (item: DragObjectWithType) => {
      onDrop(item);
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
      if (!showModal) onCancel();
    },
    [showModal]
  );

  const onTypeFn = (newType: string) => {
    setSelected(-1);
    onType(newType);
  };

  const handleEnterPress = () => {
    if (selected === -1 && typed.length > 0) {
      if (category === "*") {
        setShowModal(true);
      } else {
        onCreate({ label: typed, category: category });
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
      if (category === "*") {
        setShowModal(true);
      } else {
        onCreate({ label: typed, category: category });
      }
    } else {
      toast.info("Fill at least 1 character");
    }
    setSelected(-1);
  };

  return (
    <>
      <StyledSuggester marginTop={marginTop}>
        <StyledInputWrapper
          ref={dropRef}
          hasButton={allowCreate}
          isOver={isOver}
        >
          <Input
            type="select"
            value={category}
            options={categories}
            inverted
            suggester
            onChangeFn={onChangeCategory}
            onFocus={() => {
              setSelected(-1);
              setIsFocused(true);
            }}
            onBlur={() => setIsFocused(false)}
          />
          <StyledTypeBar entity={`entity${category}`}></StyledTypeBar>
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
          {displayCancelButton && (
            <StyledSuggestionCancelButton>
              <MdCancel onClick={() => onCancel()} />
            </StyledSuggestionCancelButton>
          )}

          {allowCreate && (
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
        {((isFocused || isHovered) && suggestions.length) || isFetching ? (
          <StyledSuggesterList
            onMouseOver={() => setIsHovered(true)}
            onMouseOut={() => setIsHovered(false)}
          >
            <StyledRelativePosition>
              {suggestions
                .filter((s, si) => si < MAXSUGGESTIONDISPLAYED)
                .map((suggestion, si) => (
                  <React.Fragment key={si}>
                    <StyledSuggestionLineActions isSelected={selected === si}>
                      <FaPlayCircle
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
