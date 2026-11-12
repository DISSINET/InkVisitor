import { useUsersSimplifiedQuery } from "hooks/react-query/useUsersSimplifiedQuery";
import { useMemo } from "react";

/**
 * The users a created by / updated by / edited by filter picks from: `single`
 * leads with an "any" option, `multi` has none, since an empty pick means any.
 */
export const useUserFilterOptions = () => {
  const { data: users } = useUsersSimplifiedQuery();

  return useMemo(() => {
    const multi =
      users
        ?.filter((user) => user?.id && user?.name)
        .map((user) => ({ label: user.name, value: user.id })) ?? [];
    return { single: [{ label: "any", value: "" }].concat(multi), multi };
  }, [users]);
};
