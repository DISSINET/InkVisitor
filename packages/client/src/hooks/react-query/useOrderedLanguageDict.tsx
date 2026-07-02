// language dictionary reordered so the current user's working languages come first
import { orderLanguageDict } from "@inkvisitor/shared/dictionaries";
import { useMemo } from "react";
import { useUserQuery } from "./useUserQuery";

export function useOrderedLanguageDict() {
  const { data: user } = useUserQuery(true);

  const workingLanguages = user?.options.workingLanguages ?? [];

  return useMemo(
    () => orderLanguageDict(workingLanguages),
    [JSON.stringify(workingLanguages)],
  );
}
