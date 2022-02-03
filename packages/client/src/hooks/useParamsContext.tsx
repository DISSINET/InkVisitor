import React, {
  createContext,
  ReactElement,
  useContext,
  useEffect,
  useState,
} from "react";
import { useHistory, useLocation } from "react-router-dom";

const UNINITIALISED = (): void => {
  throw `function uninitialised`;
};
const INITIAL_CONTEXT = {
  territoryId: "",
  setTerritoryId: UNINITIALISED,
  statementId: "",
  setStatementId: UNINITIALISED,
  actantId: "",
  setActantId: UNINITIALISED,
};
interface SearchParamsContext {
  territoryId: string;
  setTerritoryId: (territory: string) => void;
  statementId: string;
  setStatementId: (statement: string) => void;
  actantId: string;
  setActantId: (actant: string) => void;
}
const SearchParamsContext = createContext<SearchParamsContext>(INITIAL_CONTEXT);

export const useSearchParams = () => useContext(SearchParamsContext);

export const SearchParamsProvider = ({
  children,
}: {
  children: ReactElement;
}) => {
  const history = useHistory();
  const { hash } = useLocation();
  const params = new URLSearchParams(hash.substring(1));
  const parsedParams = Object.fromEntries(params);

  const [territoryId, setTerritoryId] = useState<string>(
    typeof parsedParams.territory === "string" ? parsedParams.territory : ""
  );
  const [statementId, setStatementId] = useState<string>(
    typeof parsedParams.statement === "string" ? parsedParams.statement : ""
  );
  const [actantId, setActantId] = useState<string>(
    typeof parsedParams.detail === "string" ? parsedParams.detail : ""
  );

  useEffect(() => {
    territoryId
      ? params.set("territory", territoryId)
      : params.delete("territory");
    statementId
      ? params.set("statement", statementId)
      : params.delete("statement");
    actantId ? params.set("detail", actantId) : params.delete("detail");
    history.push({
      hash: `${params}`,
    });
  }, [territoryId, statementId, actantId]);

  return (
    <SearchParamsContext.Provider
      value={{
        territoryId,
        setTerritoryId,
        statementId,
        setStatementId,
        actantId,
        setActantId,
      }}
    >
      {children}
    </SearchParamsContext.Provider>
  );
};
