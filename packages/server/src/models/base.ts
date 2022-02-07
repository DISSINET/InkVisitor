export default class Base {
  static publicFields: string[];

  getPublicFields(): string[] {
    return (this.constructor as any).publicFields;
  }

  toJSON(): object {
    const obj = this;
    const strippedObject: object = this.getPublicFields().reduce(
      (acc, curr) => {
        acc[curr] = (obj as Record<string, unknown>)[curr];
        return acc;
      },
      {} as any
    );

    return strippedObject;
  }
}
