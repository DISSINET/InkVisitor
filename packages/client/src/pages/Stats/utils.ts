export const getNonEmptyUsers = (
  userKeyMap: Record<string, string>,
  values: Record<string, Record<string, number>>
) => {
  const nonEmptyUsers: string[] = [];
  Object.keys(userKeyMap).forEach((userKey) => {
    const userValue = userKeyMap[userKey];
    if (
      Object.values(values).some(
        (value) =>
          Object.keys(value).includes(userKey) &&
          value[userKey] !== 0 &&
          value[userKey] !== null
      )
    ) {
      nonEmptyUsers.push(userValue);
    }
  });
  return nonEmptyUsers;
};
