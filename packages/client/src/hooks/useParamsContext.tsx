import React, {
  createContext,
  useState,
  useEffect,
  useContext,
  ReactElement,
} from "react";
import { useLocation, useHistory } from "react-router-dom";
import queryString from "query-string";

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
  const { search } = useLocation();
  const params = queryString.parse(search, {
    parseNumbers: true,
    parseBooleans: true,
  });
  const history = useHistory();
  const [territory, setTerritory] = useState<string>(
    typeof params.territory === "string" ? params.territory : ""
  );
  const [statement, setStatement] = useState<string>(
    typeof params.statement === "string" ? params.statement : ""
  );
  const [actant, setActant] = useState<string>(
    typeof params.actant === "string" ? params.actant : ""
  );
  useEffect(() => {
    history.replace({
      search: `?${queryString.stringify({
        ...queryString.parse(history.location.search),
        territory: territory ? territory : undefined,
        statement: statement ? statement : undefined,
        actant: actant ? actant : undefined,
      })}`,
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
