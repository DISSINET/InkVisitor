export default class Base {
  static publicFields: string[];

  getPublicFields(): string[] {
    return (this.constructor as any).publicFields;
  }

  toJSON(): object {
    const actant = this;
    const strippedObject: object = this.getPublicFields().reduce(
      (acc, curr) => {
        acc[curr] = (actant as Record<string, unknown>)[curr];
        return acc;
      },
      {} as any
    );

    return strippedObject;
  }
}
