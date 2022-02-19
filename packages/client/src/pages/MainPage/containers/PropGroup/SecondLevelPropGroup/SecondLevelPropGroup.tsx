import { IProp } from "@shared/types";
import React, { useCallback, useEffect, useState } from "react";
import update from "immutability-helper";

interface SecondLevelPropGroup {
  prop1: IProp;
  renderSecondLevelPropRow: (
    prop2: IProp,
    pi2: number,
    prop1: IProp,
    moveProp: (dragIndex: number, hoverIndex: number) => void
  ) => JSX.Element;
}
export const SecondLevelPropGroup: React.FC<SecondLevelPropGroup> = ({
  prop1,
  renderSecondLevelPropRow,
}) => {
  const [secondLevelProps, setSecondLevelProps] = useState<IProp[]>([]);

  useEffect(() => {
    setSecondLevelProps(prop1.children);
  }, [prop1.children]);

  const moveProp = useCallback((dragIndex: number, hoverIndex: number) => {
    setSecondLevelProps((prevCards) =>
      update(prevCards, {
        $splice: [
          [dragIndex, 1],
          [hoverIndex, 0, prevCards[dragIndex]],
        ],
      })
    );
  }, []);

  return (
    <>
      {secondLevelProps.map((prop2: IProp, pi2: number) =>
        renderSecondLevelPropRow(prop2, pi2, prop1, moveProp)
      )}
    </>
  );
};
