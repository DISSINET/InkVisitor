import React, {
  createContext,
  ReactElement,
  useContext,
  useEffect,
  useState,
} from "react";
import { useHistory, useLocation } from "react-router-dom";
import { toast } from "react-toastify";
import { maxTabCount } from "Theme/constants";

const UNINITIALISED = (): void => {
  throw `function uninitialised`;
};
const INITIAL_CONTEXT = {
  territoryId: "",
  setTerritoryId: UNINITIALISED,
  statementId: "",
  setStatementId: UNINITIALISED,
  detailIdArray: [],
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
  detailIdArray: string[];
  selectedDetailId: string;
  setSelectedDetailId: (id: string) => void;
  appendDetailId: (id: string) => void;
  removeDetailId: (id: string) => void;
  clearAllDetailIds: () => void;
}
const SearchParamsContext = createContext<SearchParamsContext>(INITIAL_CONTEXT);

const arrJoinChar = ",";

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

  const [detailId, setDetailId] = useState<string>(
    typeof parsedParams.detail === "string" ? parsedParams.detail : ""
  );

  const [disablePush, setDisablePush] = useState(false);

  const getDetailIdArray = () => {
    return detailId.length > 0 ? detailId.split(arrJoinChar) : [];
  };

  const appendDetailId = (id: string) => {
    const detailIdArray = getDetailIdArray();
    if (!detailIdArray.includes(id)) {
      if (detailIdArray.length < maxTabCount) {
        const newDetailIdArray = [...detailIdArray, id];
        setDetailId(newDetailIdArray.join(arrJoinChar));
        setSelectedDetailId(id);
      } else {
        toast.info("Maximum tab count reached");
      }
    } else {
      setSelectedDetailId(id);
    }
  };

  const removeDetailId = (id: string) => {
    const detailIdArray = getDetailIdArray();
    const index = detailIdArray.indexOf(id);

    if (selectedDetailId === id) {
      if (index + 1 === detailIdArray.length) {
        if (detailIdArray.length > 1) {
          setSelectedDetailId(detailIdArray[detailIdArray.length - 2]);
        } else {
          clearAllDetailIds();
        }
      } else {
        setSelectedDetailId(detailIdArray[index + 1]);
      }
    }

    const newIds = detailIdArray.filter((detailId) => detailId !== id);
    setDetailId(newIds.join(arrJoinChar));
  };

  const clearAllDetailIds = () => {
    setDetailId("");
    setSelectedDetailId("");
  };

  const handleHistoryPush = () => {
    if (!disablePush) {
      history.push({
        hash: `${params}`,
      });
    }
  };

  // useEffect(() => {
  //   setDisableHistoryListener(true);
  //   params.delete("detail");
  //   detailIdArray.forEach((id) => params.append("detail", id));

  //   handleHistoryPush();
  //   setDisableHistoryListener(false);
  // }, [detailIdArray]);

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

    detailId ? params.set("detail", detailId) : params.delete("detail");

    handleHistoryPush();
  }, [territoryId, statementId, selectedDetailId, detailId]);

  const handleLocationChange = (location: any) => {
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

    parsedParamsTemp.detail
      ? setDetailId(parsedParamsTemp.detail)
      : setDetailId("");
  };

  useEffect(() => {
    // Should be only change from the url => add state to switch of listener
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
        detailIdArray: getDetailIdArray(),
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
