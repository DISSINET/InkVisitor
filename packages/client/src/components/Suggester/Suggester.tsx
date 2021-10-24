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

export interface SuggestionI {
  id: string;
  label: string;
  detail: string;
  ltype: string;
  status: string;
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

  const onTypeFn = (newType: string) => {
    setSelected(-1);
    onType(newType);
  };

  const handleCreateActant = () => {
    onCreate({
      label: typed,
      category: category,
    });
  };

  const handleEnterPress = () => {
    if (selected === -1 && typed.length > 1) {
      if (category === "*") {
        setShowModal(true);
      } else {
        handleCreateActant();
      }
    } else if (selected > -1) {
      onPick(suggestions[selected]);
    } else {
      toast.info("Min label length is 2 characters");
    }
  };

  const handleAddBtnClick = () => {
    if (typed.length > 1) {
      if (category === "*") {
        setShowModal(true);
      } else {
        handleCreateActant();
      }
    } else {
      toast.info("Min label length is 2 characters");
    }
  };

  return (
    <>
      <StyledSuggester marginTop={marginTop}>
        <StyledInputWrapper
          ref={dropRef}
          hasButton={allowCreate}
          isOver={isOver}
        >
          <StyledTypeBar entity={`entity${category}`}></StyledTypeBar>
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
          <Input
            type="text"
            value={typed}
            onChangeFn={(newType: string) => onTypeFn(newType)}
            placeholder={placeholder}
            suggester
            changeOnType={true}
            width={inputWidth}
            onFocus={() => {
              setSelected(-1);
              setIsFocused(true);
            }}
            onBlur={() => setIsFocused(false)}
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

      <Modal showModal={showModal}>
        <ModalHeader title="Create actant" />
        <ModalContent>
          <Input
            type="select"
            value={category}
            options={categories}
            inverted
            suggester
            onChangeFn={onChangeCategory}
          />
          <Input
            label="Label: "
            value={typed}
            onChangeFn={(newType: string) => onTypeFn(newType)}
            changeOnType
            autoFocus
          />
        </ModalContent>
        <ModalFooter>
          <ButtonGroup>
            <Button
              key="cancel"
              label="Cancel"
              color="warning"
              onClick={() => {
                setShowModal(false);
              }}
            />
            <Button
              key="submit"
              label="Submit"
              color="primary"
              onClick={() => {
                handleCreateActant();
                setShowModal(false);
              }}
            />
          </ButtonGroup>
        </ModalFooter>
      </Modal>
    </>
  );
};
