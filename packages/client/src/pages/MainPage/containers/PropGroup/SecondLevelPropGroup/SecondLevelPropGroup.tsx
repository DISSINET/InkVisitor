import { IProp } from "@shared/types";
import update from "immutability-helper";
import React, { useCallback, useEffect, useState } from "react";
import { ItemTypes } from "types";
import { PropGroupRowDndWrapper } from "../PropGroupRowDndWrapper/PropGroupRowDndWrapper";

interface SecondLevelPropGroup {
  prop1: IProp;
  renderSecondLevelPropRow: (
    prop2: IProp,
    pi2: number,
    prop1: IProp
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
      {secondLevelProps.map((prop2: IProp, pi2: number) => (
        <PropGroupRowDndWrapper
          key={prop1.id + "|" + pi2}
          id={prop2.id}
          lvl={2}
          parentId={prop1.id}
          index={pi2}
          itemType={ItemTypes.PROP_ROW2}
          moveProp={moveProp}
          renderPropRow={renderSecondLevelPropRow(prop2, pi2, prop1)}
        />
      ))}
    </>
  );
};
