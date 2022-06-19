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
  selectedDetailId: "",
  setSelectedDetailId: UNINITIALISED,
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
  selectedDetailId: string;
  setSelectedDetailId: (id: string) => void;
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
  const [selectedDetailId, setSelectedDetailId] = useState<string>(
    typeof parsedParams.selectedDetail === "string"
      ? parsedParams.selectedDetail
      : ""
  );
  const [detailId, setDetailId] = useState<string[]>(params.getAll("detail"));

  const [disablePush, setDisablePush] = useState(false);

  const appendDetailId = (id: string) => {
    if (!params.getAll("detail").includes(id)) {
      setDetailId([...detailId, id]);
    }
    setSelectedDetailId(id);
  };

  const removeDetailId = (id: string) => {
    const detailIds = params.getAll("detail");
    const newIds = detailIds.filter((detailId) => detailId !== id);
    setDetailId(newIds);
  };

  const clearAllDetailIds = () => {
    setDetailId([]);
    setSelectedDetailId("");
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
    // Change from the inside of the app to this state
    territoryId
      ? params.set("territory", territoryId)
      : params.delete("territory");

    statementId
      ? params.set("statement", statementId)
      : params.delete("statement");

    selectedDetailId
      ? params.set("selectedDetail", selectedDetailId)
      : params.delete("selectedDetail");

    handleHistoryPush();
  }, [territoryId, statementId, selectedDetailId]);

  const handleLocationChange = (location: any) => {
    // console.log("handleLocationChange");
    const paramsTemp = new URLSearchParams(location.hash.substring(1));
    const parsedParamsTemp = Object.fromEntries(paramsTemp);

    parsedParamsTemp.territory
      ? setTerritoryId(parsedParamsTemp.territory)
      : setTerritoryId("");

    parsedParamsTemp.statement
      ? setStatementId(parsedParamsTemp.statement)
      : setStatementId("");

    parsedParamsTemp.selectedDetail
      ? setSelectedDetailId(parsedParamsTemp.selectedDetail)
      : setSelectedDetailId("");

    // TODO: follow url change!!!
    // paramsTemp.getAll("detail").length
    //   ? setDetailId(paramsTemp.getAll("detail"))
    //   : setDetailId([]);
  };

  useEffect(() => {
    // Should be only change from the url
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
        selectedDetailId,
        setSelectedDetailId,
        appendDetailId,
        removeDetailId,
        clearAllDetailIds,
      }}
    >
      {children}
    </SearchParamsContext.Provider>
  );
};
