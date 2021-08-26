import React, { useState } from "react";

const testData = [
  { id: 0, text: "dasdasdads" },
  { id: 1, text: "Asda DKLlkd Podowi Qewieo qiuda" },
  { id: 2, text: "X V F skdjl aksjl fsa kljf opwi qp" },
];
interface MultiInput {}
export const MultiInput: React.FC<MultiInput> = ({}) => {
  const [data, setData] = useState(testData || []);

  const handleChange =
    (key: string, value: string) =>
    (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
      setData({
        ...data,
        [key]: value,
      });
    };

  return <div></div>;
};
