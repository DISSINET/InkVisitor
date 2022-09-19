export const getRandomInt = () => {
  return Math.floor(Math.random() * 1_000_000_000_000);
};

/**
 * Simple object check.
 * @param item
 * @returns {boolean}
 */
export function isObject(item: any) {
  return item && typeof item === "object" && !Array.isArray(item);
}

/**
 * Deep merge two objects.
 * @param target
 * @param ...sources
 */
export function mergeDeep(target: any, ...sources: any): any {
  if (!sources.length) return target;
  const source = sources.shift();

  if (isObject(target) && isObject(source)) {
    for (const key in source) {
      if (isObject(source[key])) {
        if (!target[key]) Object.assign(target, { [key]: {} });
        mergeDeep(target[key], source[key]);
      } else {
        Object.assign(target, { [key]: source[key] });
      }
    }
  }

  return mergeDeep(target, ...sources);
}

export function timeout(mseconds: number): Promise<void> {
  return new Promise((resolve: Function) => {
    setTimeout(resolve, mseconds);
  });
}

export function regExpEscape(literal: string) {
  return literal.replace(/[-[\]{}()*+!<=:?.\/\\^$|#,]/g, "\\$&");
}

/**
 * Function returns readable domain name
 * @returns
 */
export function domainName(): string {
  if (!process.env.DOMAIN) {
    throw new Error("env variable DOMAIN is required");
  }

  return process.env.DOMAIN;
}

/**
 * Function returns DOMAIN env variable prefixed with schema
 * @returns
 */
export function hostUrl(): string {
  if (!process.env.DOMAIN) {
    throw new Error("env variable DOMAIN is required");
  }

  return `https://${process.env.DOMAIN}`;
}
