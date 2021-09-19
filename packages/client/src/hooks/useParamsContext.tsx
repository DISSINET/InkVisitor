import React, {
  createContext,
  useState,
  useEffect,
  useContext,
  ReactElement,
} from "react";
import { useLocation, useHistory } from "react-router-dom";

const UNINITIALISED = (): void => {
  throw `function uninitialised`;
};
const INITIAL_CONTEXT = {
  territory: "",
  setTerritory: UNINITIALISED,
  statement: "",
  setStatement: UNINITIALISED,
  actant: "",
  setActant: UNINITIALISED,
};
interface SearchParamsContext {
  territory: string;
  setTerritory: (territory: string) => void;
  statement: string;
  setStatement: (statement: string) => void;
  actant: string;
  setActant: (actant: string) => void;
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

  const [territory, setTerritory] = useState<string>(
    typeof parsedParams.territory === "string" ? parsedParams.territory : ""
  );
  const [statement, setStatement] = useState<string>(
    typeof parsedParams.statement === "string" ? parsedParams.statement : ""
  );
  const [actant, setActant] = useState<string>(
    typeof parsedParams.actant === "string" ? parsedParams.actant : ""
  );

  useEffect(() => {
    territory ? params.set("territory", territory) : params.delete("territory");
    statement ? params.set("statement", statement) : params.delete("statement");
    actant ? params.set("actant", actant) : params.delete("actant");
    history.push({
      hash: `${params}`,
    });
  }, [territory, statement, actant]);

  return (
    <SearchParamsContext.Provider
      value={{
        territory,
        setTerritory,
        statement,
        setStatement,
        actant,
        setActant,
      }}
    >
      {children}
    </SearchParamsContext.Provider>
  );
};
