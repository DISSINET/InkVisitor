import api from "api";
import React, {
  createContext,
  ReactElement,
  useContext,
  useEffect,
  useMemo,
  useState,
} from "react";
import { useQuery } from "@tanstack/react-query";
import { useNavigate, useLocation } from "react-router-dom";
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
  appendMultipleDetailIds: UNINITIALISED,
  replaceDetailIds: UNINITIALISED,
  removeDetailId: UNINITIALISED,
  clearAllDetailIds: UNINITIALISED,
  cleanAllParams: UNINITIALISED,
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
  appendMultipleDetailIds: (ids: string[]) => void;
  replaceDetailIds: (ids: string[]) => void;
  removeDetailId: (id: string) => void;
  clearAllDetailIds: () => void;
  cleanAllParams: () => void;
}
const SearchParamsContext = createContext<SearchParamsContext>(INITIAL_CONTEXT);

const arrJoinChar = ",";

export const useSearchParams = () => useContext(SearchParamsContext);

export const SearchParamsProvider = ({
  children,
}: {
  children: ReactElement;
}) => {
  const navigate = useNavigate();
  const location = useLocation();
  const params = new URLSearchParams(location.hash.substring(1));
  const parsedParams = Object.fromEntries(params);

  const paramsSearch = new URLSearchParams(location.search);
  const parsedParamsSearch = Object.fromEntries(paramsSearch);

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

  const { data } = useQuery({
    queryKey: ["detail-tab-entities", getDetailIdArray()],
    queryFn: async () => {
      const res = await api.entitiesSearch({ entityIds: getDetailIdArray() });
      return res.data;
    },
    enabled: api.isLoggedIn() && getDetailIdArray().length > 9,
  });

  const appendDetailId = (id: string) => {
    const detailIdArray = getDetailIdArray();
    if (!detailIdArray.includes(id)) {
      const newDetailIdArray = [];
      if (detailIdArray.length < maxTabCount) {
        newDetailIdArray.push([...detailIdArray, id]);
      } else {
        newDetailIdArray.push([
          ...detailIdArray.splice(1, detailIdArray.length),
          id,
        ]);
        // toast.info(
        //   `Tab [${
        //     data ? getEntityLabel(data[0]) : detailIdArray
        //   }] canceled from detail`
        // );
      }
      setDetailId(newDetailIdArray.join(arrJoinChar));
    }
    setTimeout(() => setSelectedDetailId(id), 100);
  };

  const appendMultipleDetailIds = (ids: string[]) => {
    const detailIdArray = getDetailIdArray();
    let newDetailIdArray: string[] = [];

    if (ids.length === 10) {
      // use as it is
      newDetailIdArray = ids;
    } else if (ids.length > 10) {
      // cut and use the first 10
      newDetailIdArray = ids.slice(0, maxTabCount);
    } else {
      // merge with existing
      // remove already added ids and add them at the end
      const filteredArray: string[] = detailIdArray.filter(
        (id) => !ids.includes(id)
      );
      newDetailIdArray = filteredArray.concat(ids);
      if (newDetailIdArray.length > maxTabCount) {
        newDetailIdArray = newDetailIdArray.slice(
          newDetailIdArray.length - maxTabCount
        );
      }
    }

    setDetailId(newDetailIdArray.join(arrJoinChar));
    setTimeout(() => setSelectedDetailId(ids[0]), 100);
  };

  const replaceDetailIds = (ids: string[]) => {
    setDetailId(ids.join(arrJoinChar));
  };

  const removeDetailId = (id: string) => {
    const detailIdArray = getDetailIdArray();
    const index = detailIdArray.indexOf(id);

    const newIds = detailIdArray
      .filter((detailId) => detailId !== id)
      .join(arrJoinChar);

    if (selectedDetailId === id) {
      if (index + 1 === detailIdArray.length) {
        // ID to remove is the last one
        if (detailIdArray.length > 1) {
          // More than one tab opened
          setSelectedDetailId(detailIdArray[detailIdArray.length - 2]);
          setDetailId(newIds);
        } else {
          // Only one tab opened
          clearAllDetailIds();
        }
      } else {
        // ID to remove is NOT the last one
        setSelectedDetailId(detailIdArray[index + 1]);
        setDetailId(newIds);
      }
    } else {
      setDetailId(newIds);
    }
  };

  const clearAllDetailIds = () => {
    setSelectedDetailId("");
    setDetailId("");
  };

  const handleHistoryPush = () => {
    if (!disablePush) {
      navigate({
        hash: `${params}`,
      });
    }
  };

  const cleanAllParams = () => {
    clearAllDetailIds();
    setStatementId("");
    setTerritoryId("");
  };

  const hasSearchParams = useMemo(
    () => parsedParamsSearch?.hash?.length > 0,
    [parsedParamsSearch]
  );

  useEffect(() => {
    // Change from the inside of the app to this state
    if (!hasSearchParams) {
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
    }
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

  // useEffect(() => {
  // Should be only change from the url => add state to switch of listener
  // this condition is for redirect - don't use our lifecycle when params are set by search query (?)
  // if (!hasSearchParams) {
  //   setDisablePush(true);
  //   handleLocationChange(location);
  //   setDisablePush(false);
  // }
  // }),
  // [location];

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
        appendMultipleDetailIds,
        replaceDetailIds,
        removeDetailId,
        clearAllDetailIds,
        cleanAllParams,
      }}
    >
      {children}
    </SearchParamsContext.Provider>
  );
};
