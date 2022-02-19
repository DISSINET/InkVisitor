import { IProp } from "@shared/types";
import React, { useEffect, useState } from "react";

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

  return (
    <>
      {secondLevelProps.map((prop2: IProp, pi2: number) =>
        renderSecondLevelPropRow(prop2, pi2, prop1)
      )}
    </>
  );
};
