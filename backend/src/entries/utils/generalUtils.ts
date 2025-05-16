export const camelizeKeys = <T extends Record<string, unknown>>(
  input: T | T[],
): T | T[] => {
  const camelize = (obj: T): T => {
    const camelCaseObj = {} as T;

    Object.entries(obj).forEach(([key, value]) => {
      const camelCaseKey = key.replace(
        /_([a-z])/g,
        (_: string, letter: string) => letter.toUpperCase(),
      );
      (camelCaseObj as Record<string, any>)[camelCaseKey] = value;
    });

    return camelCaseObj;
  };

  if (Array.isArray(input)) {
    return input.map(camelize);
  }

  return camelize(input);
};
