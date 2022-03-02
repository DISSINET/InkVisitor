import { IProp } from "@shared/types";
import update from "immutability-helper";
import React, { useCallback, useEffect, useState } from "react";

interface FirstLevelPropGroup {
  props: IProp[];
  renderFirsLevelPropRow: (
    prop1: IProp,
    pi1: number,
    moveProp: (dragIndex: number, hoverIndex: number) => void
  ) => JSX.Element;
}
export const FirstLevelPropGroup: React.FC<FirstLevelPropGroup> = ({
  props,
  renderFirsLevelPropRow,
}) => {
  useEffect(() => {
    // update jen po fetch ze serveru
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
      {firstLevelProps.map((prop1: IProp, pi1: number) =>
        renderFirsLevelPropRow(prop1, pi1, moveProp)
      )}
    </>
  );
};
