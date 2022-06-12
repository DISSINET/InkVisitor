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
  detailId: [],
  setDetailId: UNINITIALISED,
  appendDetailId: UNINITIALISED,
  removeDetailId: UNINITIALISED,
};
interface SearchParamsContext {
  territoryId: string;
  setTerritoryId: (territory: string) => void;
  statementId: string;
  setStatementId: (statement: string) => void;
  detailId: string[];
  setDetailId: (detail: string[]) => void;
  appendDetailId: (id: string) => void;
  removeDetailId: (id: string) => void;
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
  const [detailId, setDetailId] = useState<string[]>(params.getAll("detail"));

  useEffect(() => {
    console.log(params.getAll("detail"));
  }, []);

  const [disablePush, setDisablePush] = useState(false);

  const appendDetailId = (id: string) => {
    console.log(id);
  };

  const removeDetailId = (id: string) => {
    console.log(id);
  };

  useEffect(() => {
    territoryId
      ? params.set("territory", territoryId)
      : params.delete("territory");

    statementId
      ? params.set("statement", statementId)
      : params.delete("statement");

    // TODO: discover ID to delete
    // if (!params.getAll("detail").includes(detailId)) {
    //   detailId ? params.append("detail", detailId) : params.delete("detail");
    // } else if (params.getAll("detail").includes(detailId)) {
    //   const allDetailIds = params.getAll("detail");
    //   console.log(allDetailIds);
    // }

    if (!disablePush) {
      history.push({
        hash: `${params}`,
      });
    }
  }, [territoryId, statementId, detailId]);

  const handleLocationChange = (location: any) => {
    const paramsTemp = new URLSearchParams(location.hash.substring(1));
    const parsedParamsTemp = Object.fromEntries(paramsTemp);

    parsedParamsTemp.territory
      ? setTerritoryId(parsedParamsTemp.territory)
      : setTerritoryId("");

    parsedParamsTemp.statement
      ? setStatementId(parsedParamsTemp.statement)
      : setStatementId("");

    // parsedParamsTemp.detail
    //   ? setDetailId(parsedParamsTemp.detail)
    //   : setDetailId("");
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
        appendDetailId,
        removeDetailId,
      }}
    >
      {children}
    </SearchParamsContext.Provider>
  );
};
