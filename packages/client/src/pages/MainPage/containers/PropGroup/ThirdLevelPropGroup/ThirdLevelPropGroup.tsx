import { IProp } from "@shared/types";
import update from "immutability-helper";
import React, { useCallback, useEffect, useState } from "react";
import { useAppSelector } from "redux/hooks";
import { DraggedPropRowItem } from "types";

interface ThirdLevelPropGroup {
  prop1: IProp;
  prop2: IProp;
  pi2: number;
  renderThirdLevelPropRow: (
    prop3: IProp,
    pi3: number,
    prop1: IProp,
    prop2: IProp,
    pi2: number,
    moveProp: (dragIndex: number, hoverIndex: number) => void
  ) => JSX.Element;
  thirdLevelProps: IProp[];
}
export const ThirdLevelPropGroup: React.FC<ThirdLevelPropGroup> = ({
  prop1,
  prop2,
  pi2,
  renderThirdLevelPropRow,
  thirdLevelProps,
}) => {
  const [props, setProps] = useState<IProp[]>([]);

  useEffect(() => {
    // update jen po fetch ze serveru
    setProps(thirdLevelProps);
  }, [thirdLevelProps]);

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
    (state) => state.propGroup.draggedPropRow
  );

  const [hideChildren, setHideChildren] = useState(false);

  useEffect(() => {
    if (draggedPropRow && draggedPropRow.lvl === 2) {
      setHideChildren(true);
    } else {
      setHideChildren(false);
    }
  }, [draggedPropRow]);

  return (
    <>
      {!hideChildren &&
        props.map((prop3: IProp, pi3: number) =>
          renderThirdLevelPropRow(prop3, pi3, prop1, prop2, pi2, moveProp)
        )}
    </>
  );
};
