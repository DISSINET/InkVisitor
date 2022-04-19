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

  const [disablePush, setDisablePush] = useState(false);

  useEffect(() => {
    territoryId
      ? params.set("territory", territoryId)
      : params.delete("territory");
    statementId
      ? params.set("statement", statementId)
      : params.delete("statement");
    detailId ? params.set("detail", detailId) : params.delete("detail");

    if (!disablePush) {
      history.push({
        hash: `${params}`,
      });
    }
  }, [territoryId, statementId, detailId]);

  const handleLocationChange = (location: any) => {
    const paramsTemp = new URLSearchParams(location.hash.substring(1));
    const parsedParamsTemp = Object.fromEntries(paramsTemp);
    if (parsedParamsTemp.territory) {
      setTerritoryId(parsedParamsTemp.territory);
    }
    if (parsedParamsTemp.statement) {
      setStatementId(parsedParamsTemp.statement);
    }
    if (parsedParamsTemp.detail) {
      setDetailId(parsedParamsTemp.detail);
    }
  };

  useEffect(() => {
    return history.listen((location: any) => {
      setDisablePush(true);
      handleLocationChange(location);
      setDisablePush(false);
    });
  }, [history]);

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
