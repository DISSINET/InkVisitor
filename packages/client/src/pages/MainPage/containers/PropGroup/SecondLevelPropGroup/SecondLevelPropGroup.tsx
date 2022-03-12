import { IProp } from "@shared/types";
import update from "immutability-helper";
import React, { useCallback, useEffect, useState } from "react";
import { useAppSelector } from "redux/hooks";
import { DraggedPropRowCategory, DraggedPropRowItem } from "types";

interface SecondLevelPropGroup {
  prop1: IProp;
  renderSecondLevelPropRow: (
    prop2: IProp,
    pi2: number,
    prop1: IProp,
    moveProp: (dragIndex: number, hoverIndex: number) => void
  ) => JSX.Element;
  secondLevelProps: IProp[];
  category: DraggedPropRowCategory;
}
export const SecondLevelPropGroup: React.FC<SecondLevelPropGroup> = ({
  prop1,
  renderSecondLevelPropRow,
  secondLevelProps,
  category,
}) => {
  const [props, setProps] = useState<IProp[]>([]);

  useEffect(() => {
    // update jen po fetch ze serveru
    setProps(secondLevelProps);
  }, [secondLevelProps]);

  const moveProp = useCallback((dragIndex: number, hoverIndex: number) => {
    setProps((prevCards) =>
      update(prevCards, {
        $splice: [
          [dragIndex, 1],
          [hoverIndex, 0, prevCards[dragIndex]],
        ],
      })
    );
  }, []);

  const draggedPropRow: DraggedPropRowItem = useAppSelector(
    (state) => state.rowDnd.draggedPropRow
  );

  const [hideChildren, setHideChildren] = useState(false);

  useEffect(() => {
    if (
      draggedPropRow &&
      draggedPropRow.category === category &&
      draggedPropRow.lvl === 1
    ) {
      setHideChildren(true);
    } else {
      setHideChildren(false);
    }
  }, [draggedPropRow]);

  return (
    <>
      {!hideChildren &&
        props.map((prop2: IProp, pi2: number) =>
          renderSecondLevelPropRow(prop2, pi2, prop1, moveProp)
        )}
    </>
  );
};
