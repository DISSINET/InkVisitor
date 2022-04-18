import { Listener } from "@storybook/addons";
import React, {
  createContext,
  ReactElement,
  useContext,
  useEffect,
  useState,
} from "react";
import { RouteComponentProps, useHistory, useLocation } from "react-router-dom";

const UNINITIALISED = (): void => {
  throw `function uninitialised`;
};
const INITIAL_CONTEXT = {
  territoryId: "",
  setTerritoryId: UNINITIALISED,
  statementId: "",
  setStatementId: UNINITIALISED,
  detailId: "",
  setDetailId: UNINITIALISED,
};
interface SearchParamsContext {
  territoryId: string;
  setTerritoryId: (territory: string) => void;
  statementId: string;
  setStatementId: (statement: string) => void;
  detailId: string;
  setDetailId: (detail: string) => void;
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
  const [detailId, setDetailId] = useState<string>(
    typeof parsedParams.detail === "string" ? parsedParams.detail : ""
  );

  useEffect(() => {
    territoryId
      ? params.set("territory", territoryId)
      : params.delete("territory");
    statementId
      ? params.set("statement", statementId)
      : params.delete("statement");
    detailId ? params.set("detail", detailId) : params.delete("detail");
    history.push({
      hash: `${params}`,
    });
  }, [territoryId, statementId, detailId]);

  const handleHistoryChange = (history: any) => {
    const params = new URLSearchParams(history.location.hash.substring(1));
    const parsedParams = Object.fromEntries(params);
    if (parsedParams.territory) {
      setTerritoryId(parsedParams.territory);
    }
    if (parsedParams.statement) {
      setStatementId(parsedParams.statement);
    }
    if (parsedParams.detail) {
      setDetailId(parsedParams.detail);
    }
  };

  const [locationKeys, setLocationKeys] = useState<any>([]);

  useEffect(() => {
    return history.listen((location: any) => {
      if (history.action === "PUSH") {
        setLocationKeys([location.key]);
      }

      if (history.action === "POP") {
        if (locationKeys[1] === location.key) {
          setLocationKeys(([_, ...keys]: any) => keys);
          // Handle forward event
          handleHistoryChange(history);
        } else {
          setLocationKeys((keys: any) => [location.key, ...keys]);
          // Handle back event
          handleHistoryChange(history);
        }
      }
    });
  }, [locationKeys]);

  return (
    <SearchParamsContext.Provider
      value={{
        territoryId,
        setTerritoryId,
        statementId,
        setStatementId,
        detailId: detailId,
        setDetailId: setDetailId,
      }}
    >
      {children}
    </SearchParamsContext.Provider>
  );
};
