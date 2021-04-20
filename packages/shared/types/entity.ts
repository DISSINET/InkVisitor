import { IActant } from "./";
import {EntityActantType} from '../enums'
import { entityLogicalTypeDict } from "./../dictionaries";

const entityLogicalTypeValues = entityLogicalTypeDict.map((i) => i.value);
export interface IEntity extends IActant {
  class: EntityActantType;
  data: {
    logicalType: typeof entityLogicalTypeValues[number];
  };
}
