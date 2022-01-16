export default class Base {
  static publicFields: string[];

  getPublicFields(): string[] {
    return (this.constructor as any).publicFields;
  }
}
