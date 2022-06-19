import React, {
  createContext,
  ReactElement,
  useContext,
  useEffect,
  useState,
} from "react";
import { useHistory, useLocation } from "react-router-dom";
import { setSelectedDetailId } from "redux/features/entityDetail/selectedDetailIdSlice";
import { useAppDispatch } from "redux/hooks";

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
  clearAllDetailIds: UNINITIALISED,
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
  clearAllDetailIds: () => void;
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

  const [disablePush, setDisablePush] = useState(false);

  const dispatch = useAppDispatch();

  const appendDetailId = (id: string) => {
    if (!params.getAll("detail").includes(id)) {
      setDetailId([...detailId, id]);
    }
    dispatch(setSelectedDetailId(id));
  };

  const removeDetailId = (id: string) => {
    const detailIds = params.getAll("detail");
    const newIds = detailIds.filter((detailId) => detailId !== id);
    setDetailId(newIds);
  };

  const clearAllDetailIds = () => {
    setDetailId([]);
  };

  const handleHistoryPush = () => {
    if (!disablePush) {
      history.push({
        hash: `${params}`,
      });
    }
  };

  useEffect(() => {
    params.delete("detail");
    detailId.forEach((id) => params.append("detail", id));

    handleHistoryPush();
  }, [detailId]);

  useEffect(() => {
    territoryId
      ? params.set("territory", territoryId)
      : params.delete("territory");

    statementId
      ? params.set("statement", statementId)
      : params.delete("statement");

    handleHistoryPush();
  }, [territoryId, statementId]);

  const handleLocationChange = (location: any) => {
    const paramsTemp = new URLSearchParams(location.hash.substring(1));
    const parsedParamsTemp = Object.fromEntries(paramsTemp);

    parsedParamsTemp.territory
      ? setTerritoryId(parsedParamsTemp.territory)
      : setTerritoryId("");

    parsedParamsTemp.statement
      ? setStatementId(parsedParamsTemp.statement)
      : setStatementId("");

    console.log("params context", paramsTemp.getAll("detail"));

    // setDetailId(paramsTemp.getAll("detail"));
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
        clearAllDetailIds,
      }}
    >
      {children}
    </SearchParamsContext.Provider>
  );
};
