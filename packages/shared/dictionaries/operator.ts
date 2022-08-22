import { EntityEnums } from "../enums";

export const operatorDict = [
  { label: "and", value: EntityEnums.Operator.And },
  { label: "xor", value: EntityEnums.Operator.Xor },
  { label: "or", value: EntityEnums.Operator.Or },
  { label: ">", value: EntityEnums.Operator.Greater },
  { label: ">=", value: EntityEnums.Operator.GreaterOrEqual },
  { label: "=", value: EntityEnums.Operator.Equal },
  { label: "<=", value: EntityEnums.Operator.LessOrEqual },
  { label: "<", value: EntityEnums.Operator.Less },
];
