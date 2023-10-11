export const useDebouncedFunction = <T extends unknown[]>(
  callback: (...args: T) => void,
  delay: number
) => {
  let timeoutId: ReturnType<typeof setTimeout> | null;

  return (...args: T) => {
    if (timeoutId) {
      clearTimeout(timeoutId);
    }

    timeoutId = setTimeout(() => {
      callback(...args);
    }, delay);
  };
};
