import { Operator } from "../enums";

export const operatorDict = [
  { label: "and", value: Operator.And },
  { label: "xor", value: Operator.Xor },
  { label: "or", value: Operator.Or },
  { label: ">", value: Operator.Greater },
  { label: ">=", value: Operator.GreaterOrEqual },
  { label: "=", value: Operator.Equal },
  { label: "<=", value: Operator.LessOrEqual },
  { label: "<", value: Operator.Less },
];
