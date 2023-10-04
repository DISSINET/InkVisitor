export function getNextId(): string {
  return Math.random().toString(); //fix with uuid
}

export function getRandomElements<T>(arr: T[], numberOfItems: number): T[] {
  if (arr.length < 2) {
    throw new Error("Array must contain at least two elements");
  }

  const randomIndexes: any[] = [];
  while (randomIndexes.length < numberOfItems) {
    const randomIndex = Math.floor(Math.random() * arr.length);
    if (!randomIndexes.includes(randomIndex)) {
      randomIndexes.push(randomIndex);
    }
  }

  return [arr[randomIndexes[0]], arr[randomIndexes[1]]].filter(t => !!t);
}

export function getRandomNumber(min: number, max: number): number {
  return Math.ceil(Math.random() * max )  + min
}
