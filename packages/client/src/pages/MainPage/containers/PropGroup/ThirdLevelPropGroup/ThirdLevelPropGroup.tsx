import { IProp } from "@shared/types";
import update from "immutability-helper";
import React, { useCallback, useEffect, useState } from "react";

interface ThirdLevelPropGroup {
  prop1: IProp;
  pi2: number;
  renderThirdLevelPropRow: (
    prop3: IProp,
    pi3: number,
    prop1: IProp,
    pi2: number,
    moveProp: (dragIndex: number, hoverIndex: number) => void
  ) => JSX.Element;
}
export const ThirdLevelPropGroup: React.FC<ThirdLevelPropGroup> = ({
  prop1,
  pi2,
  renderThirdLevelPropRow,
}) => {
  const [thirdLevelProps, setThirdLevelProps] = useState<IProp[]>([]);

  useEffect(() => {
    setThirdLevelProps(prop1.children[pi2].children);
  }, [prop1.children[pi2].children]);

  const moveProp = useCallback((dragIndex: number, hoverIndex: number) => {
    setThirdLevelProps((prevCards) =>
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
      {thirdLevelProps.map((prop3: IProp, pi3: number) =>
        renderThirdLevelPropRow(prop3, pi3, prop1, pi2, moveProp)
      )}
    </>
  );
};
