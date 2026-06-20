import React from "react";
import { Button } from "components";
import { BiHide, BiShow } from "react-icons/bi";
import { setFourthPanelBoxesOpened } from "redux/features/layout/mainPage/fourthPanelBoxesOpenedSlice";
import { useAppDispatch, useAppSelector } from "redux/hooks";

type FourthPanelBoxes = "search" | "bookmarks" | "templates";

interface ToggleFourthPanelBoxButton {
  boxToHide: FourthPanelBoxes;
}

export const ToggleFourthPanelBoxButton: React.FC<ToggleFourthPanelBoxButton> = ({ boxToHide }) => {
  const dispatch = useAppDispatch();
  const fourthPanelExpanded = useAppSelector((state) => state.layout.mainPage.fourthPanelExpanded);
  const fourthPanelBoxesOpened = useAppSelector(
    (state) => state.layout.mainPage.fourthPanelBoxesOpened,
  );

  if (!fourthPanelExpanded) return null;

  const isThisBoxHidden = !fourthPanelBoxesOpened[boxToHide];

  return (
    <Button
      key={boxToHide}
      inverted
      icon={isThisBoxHidden ? <BiShow /> : <BiHide />}
      onClick={() => {
        dispatch(
          setFourthPanelBoxesOpened({
            ...fourthPanelBoxesOpened,
            [boxToHide]: isThisBoxHidden,
          }),
        );
      }}
    />
  );
};
