import { IReference } from "@shared/types";

export default class Reference implements IReference {
  id: string;
  resource: string;
  value: string;

  constructor(data: IReference) {
    this.id = data.id;
    this.resource = data.resource;
    this.value = data.value;
  }

  /**
   * predicate for valid data
   * @returns boolean result
   */
  isValid(): boolean {
    if (!this.id || !this.resource || !this.value) {
      return false;
    }

    return true;
  }
}
