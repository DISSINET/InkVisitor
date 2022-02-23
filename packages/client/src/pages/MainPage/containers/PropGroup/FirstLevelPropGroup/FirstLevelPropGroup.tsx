import { IProp } from "@shared/types";
import update from "immutability-helper";
import React, { useCallback, useEffect, useState } from "react";
import { ItemTypes } from "types";
import { PropGroupRowDndWrapper } from "../PropGroupRowDndWrapper/PropGroupRowDndWrapper";

interface FirstLevelPropGroup {
  props: IProp[];
  renderFirsLevelPropRow: (prop1: IProp, pi1: number) => JSX.Element;
}
export const FirstLevelPropGroup: React.FC<FirstLevelPropGroup> = ({
  props,
  renderFirsLevelPropRow,
}) => {
  useEffect(() => {
    setFirstLevelProps(props);
  }, [props]);

  const [firstLevelProps, setFirstLevelProps] = useState<IProp[]>([]);

  const moveProp = useCallback((dragIndex: number, hoverIndex: number) => {
    setFirstLevelProps((prevCards) =>
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
      {firstLevelProps.map((prop1: IProp, pi1: number) => (
        <PropGroupRowDndWrapper
          key={prop1.id}
          index={pi1}
          id={prop1.id}
          lvl={1}
          itemType={ItemTypes.PROP_ROW1}
          moveProp={moveProp}
          parentId={""}
          renderPropRow={renderFirsLevelPropRow(prop1, pi1)}
        />
      ))}
    </>
  );
};
