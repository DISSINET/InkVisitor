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

  const out = [];
  for (const index of randomIndexes) {
    out.push(arr[index])
  }

  return out;
}

export function getRandomNumber(min: number, max: number): number {
  return Math.ceil(Math.random() * max )  + min
}
