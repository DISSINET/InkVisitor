import { Operator } from "../enums";

export const operatorDict = [
  { label: "and", value: Operator.OperatorA },
  { label: "xor", value: Operator.OperatorX },
  { label: "or", value: Operator.OperatorO },
  { label: ">", value: Operator.OperatorGt },
  { label: ">=", value: Operator.OperatorGeq },
  { label: "=", value: Operator.OperatorEq },
  { label: "<=", value: Operator.OperatorLeq },
  { label: "<", value: Operator.OperatorLt },
];
