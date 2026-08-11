import React, {
  createContext,
  ReactElement,
  useContext,
  useEffect,
  useMemo,
  useState,
} from "react";
import { useLocation, useNavigate } from "react-router-dom";
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
  setLogoutState: UNINITIALISED,

  editorOpened: true,
  setEditorOpened: UNINITIALISED,
};
interface SearchParamsContext {
  territoryId: string;
  setTerritoryId: (territory: string) => void;
  statementId: string;
  setStatementId: (statement: string) => void;
  detailIdArray: string[];
  selectedDetailId: string;
  setSelectedDetailId: (id: string) => void;
  appendDetailId: (id: string, maxCount?: number) => void;
  appendMultipleDetailIds: (ids: string[], maxCount?: number) => void;
  replaceDetailIds: (ids: string[]) => void;
  removeDetailId: (id: string) => void;
  clearAllDetailIds: () => void;
  cleanAllParams: () => void;
  setLogoutState: (isLoggingOut: boolean) => void;

  editorOpened: boolean;
  setEditorOpened: (opened: boolean) => void;
}
const SearchParamsContext = createContext<SearchParamsContext>(INITIAL_CONTEXT);

const arrJoinChar = ",";

// Both sides go through URLSearchParams so encoding alone (the comma in a
// detail list) is not a difference
const normalizeHash = (hash: string) => new URLSearchParams(hash.replace(/^#/, "")).toString();

export const useSearchParams = () => useContext(SearchParamsContext);

export const SearchParamsProvider = ({ children }: { children: ReactElement }) => {
  const navigate = useNavigate();
  const location = useLocation();

  // Add error handling for URL parsing
  let params: URLSearchParams;
  let parsedParams: Record<string, string>;
  let paramsSearch: URLSearchParams;
  let parsedParamsSearch: Record<string, string>;

  try {
    params = new URLSearchParams(location.hash.substring(1));
    parsedParams = Object.fromEntries(params);
    paramsSearch = new URLSearchParams(location.search);
    parsedParamsSearch = Object.fromEntries(paramsSearch);
  } catch (error) {
    console.error("Error parsing URL parameters:", error);
    params = new URLSearchParams();
    parsedParams = {};
    paramsSearch = new URLSearchParams();
    parsedParamsSearch = {};
  }

  const [territoryId, setTerritoryId] = useState<string>(
    typeof parsedParams.territory === "string" ? parsedParams.territory : "",
  );
  const [statementId, setStatementId] = useState<string>(
    typeof parsedParams.statement === "string" ? parsedParams.statement : "",
  );
  const [selectedDetailId, setSelectedDetailId] = useState<string>(
    typeof parsedParams.selectedDetail === "string" ? parsedParams.selectedDetail : "",
  );

  const [detailId, setDetailId] = useState<string>(
    typeof parsedParams.detail === "string" ? parsedParams.detail : "",
  );

  // Editor is open by default; the URL only records the non-default (closed)
  // state via the `editorClosed` token.
  const [editorOpened, setEditorOpened] = useState<boolean>(
    "editorClosed" in parsedParams ? false : true,
  );

  const isLoggingOutRef = React.useRef(false);

  const getDetailIdArray = () => {
    return detailId.length > 0 ? detailId.split(arrJoinChar) : [];
  };

  // maxCount of Infinity appends without evicting anything - for callers that
  // must not cost the user a tab they already had open
  const appendDetailId = (id: string, maxCount: number = maxTabCount) => {
    const detailIdArray = getDetailIdArray();
    if (!detailIdArray.includes(id)) {
      // at the cap the oldest tab gives way, so the new one always lands last
      const newDetailIdArray =
        detailIdArray.length < maxCount
          ? [...detailIdArray, id]
          : [...detailIdArray.slice(1), id];
      setDetailId(newDetailIdArray.join(arrJoinChar));
    }
    setSelectedDetailId(id);
  };

  const appendMultipleDetailIds = (ids: string[], maxCount: number = maxTabCount) => {
    const detailIdArray = getDetailIdArray();
    let newDetailIdArray: string[] = [];

    if (ids.length === maxCount) {
      // use as it is
      newDetailIdArray = ids;
    } else if (ids.length > maxCount) {
      // cut and use the first maxCount
      newDetailIdArray = ids.slice(0, maxCount);
    } else {
      // merge with existing
      // remove already added ids and add them at the end
      const filteredArray: string[] = detailIdArray.filter((id) => !ids.includes(id));
      newDetailIdArray = filteredArray.concat(ids);
      if (newDetailIdArray.length > maxCount) {
        newDetailIdArray = newDetailIdArray.slice(newDetailIdArray.length - maxCount);
      }
    }

    setDetailId(newDetailIdArray.join(arrJoinChar));
    setSelectedDetailId(ids[0]);
  };

  const replaceDetailIds = (ids: string[]) => {
    setDetailId(ids.join(arrJoinChar));
  };

  const removeDetailId = (id: string) => {
    const detailIdArray = getDetailIdArray();
    const index = detailIdArray.indexOf(id);

    const newIds = detailIdArray.filter((detailId) => detailId !== id).join(arrJoinChar);

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
    if (!isLoggingOutRef.current) {
      const hashString = params.toString();
      // Remove the = symbol for editorClosed parameter
      const cleanHash = hashString
        .replace(/editorClosed=&/g, "editorClosed&")
        .replace(/&editorClosed=/g, "&editorClosed")
        .replace(/^editorClosed=$/g, "editorClosed");

      // The url can already say this: state that was read out of it in the
      // first place - a pasted link, back/forward. Navigating again would add a
      // history entry leading where the user already is, and a navigation that
      // only carries a hash keeps the pathname it finds, which is the wrong one
      // while a route change is still in flight.
      if (normalizeHash(cleanHash) === normalizeHash(location.hash)) {
        return;
      }

      navigate({
        hash: cleanHash,
      });
    }
  };

  const cleanAllParams = () => {
    clearAllDetailIds();
    setStatementId("");
    setTerritoryId("");
    setEditorOpened(true);
  };

  const setLogoutState = (isLoggingOut: boolean) => {
    isLoggingOutRef.current = isLoggingOut;
  };

  const hasSearchParams = useMemo(() => parsedParamsSearch?.hash?.length > 0, [parsedParamsSearch]);

  useEffect(() => {
    // Change from the inside of the app to this state
    if (!hasSearchParams) {
      territoryId ? params.set("territory", territoryId) : params.delete("territory");
      statementId ? params.set("statement", statementId) : params.delete("statement");

      selectedDetailId
        ? params.set("selectedDetail", selectedDetailId)
        : params.delete("selectedDetail");
      detailId ? params.set("detail", detailId) : params.delete("detail");

      editorOpened ? params.delete("editorClosed") : params.set("editorClosed", "");

      handleHistoryPush();
    }
  }, [territoryId, statementId, selectedDetailId, detailId, editorOpened]);

  // Puts the params a url carries into state.
  const applyParamsFromHash = (hash: string) => {
    try {
      const paramsTemp = new URLSearchParams(hash.replace(/^#/, ""));
      const parsedParamsTemp = Object.fromEntries(paramsTemp);

      parsedParamsTemp.territory ? setTerritoryId(parsedParamsTemp.territory) : setTerritoryId("");

      parsedParamsTemp.statement ? setStatementId(parsedParamsTemp.statement) : setStatementId("");

      parsedParamsTemp.selectedDetail
        ? setSelectedDetailId(parsedParamsTemp.selectedDetail)
        : setSelectedDetailId("");

      parsedParamsTemp.detail ? setDetailId(parsedParamsTemp.detail) : setDetailId("");

      // Handle editorClosed parameter (editor open unless explicitly closed)
      setEditorOpened(!("editorClosed" in parsedParamsTemp));
    } catch (error) {
      console.error("Error parsing location hash:", error);
    }
  };

  // A url the app did not come from itself - back/forward, a pasted link, the
  // redirect after login - is read while rendering rather than from an effect.
  // A page that mounts on this render then holds the params on its first
  // render, instead of mounting empty and receiving them a commit later: that
  // later arrival is what its own mount effects read as the user having just
  // picked this territory, and it holds back every query gated on the ids.
  // Skipped when params are passed by search query (activation, password
  // reset), whose url this provider leaves alone. A url the app wrote itself is
  // read back too: it says what the state it was composed from said, and where
  // a newer setter has since moved on, the write carrying that newer value is
  // already on its way to land after this one.
  const [appliedHash, setAppliedHash] = useState(location.hash);
  if (!hasSearchParams && location.hash !== appliedHash) {
    setAppliedHash(location.hash);
    applyParamsFromHash(location.hash);
  }

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
        setLogoutState,

        editorOpened,
        setEditorOpened,
      }}
    >
      {children}
    </SearchParamsContext.Provider>
  );
};
