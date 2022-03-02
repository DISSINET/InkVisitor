import { IProp } from "@shared/types";
import update from "immutability-helper";
import React, { useCallback, useEffect, useState } from "react";

interface SecondLevelPropGroup {
  prop1: IProp;
  renderSecondLevelPropRow: (
    prop2: IProp,
    pi2: number,
    prop1: IProp,
    moveProp: (dragIndex: number, hoverIndex: number) => void
  ) => JSX.Element;
  secondLevelProps: IProp[];
}
export const SecondLevelPropGroup: React.FC<SecondLevelPropGroup> = ({
  prop1,
  renderSecondLevelPropRow,
  secondLevelProps,
}) => {
  const [props, setProps] = useState<IProp[]>([]);

  useEffect(() => {
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

  return (
    <>
      {props.map((prop2: IProp, pi2: number) =>
        renderSecondLevelPropRow(prop2, pi2, prop1, moveProp)
      )}
    </>
  );
};
