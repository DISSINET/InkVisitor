import React, { act, useRef, useState } from "react";
import { createRoot, Root } from "react-dom/client";
import {
  BrowserRouter,
  Navigate,
  Route,
  Router,
  Routes,
  To,
} from "react-router-dom";
import { SearchParamsProvider, useSearchParams } from "./useSearchParamsContext";

const target = "/#territory=T1&statement=S1&detail=D1,D2&selectedDetail=D1";

interface ParamsSnapshot {
  territoryId: string;
  statementId: string;
  detailIdArray: string[];
  selectedDetailId: string;
}

// Records what the page it stands for was handed on the render it mounted on,
// which is when a page reads the params its queries and layout are keyed on.
const MainProbe = ({ onMount }: { onMount: (params: ParamsSnapshot) => void }) => {
  const { territoryId, statementId, detailIdArray, selectedDetailId } = useSearchParams();
  const mounted = useRef(false);

  if (!mounted.current) {
    mounted.current = true;
    onMount({ territoryId, statementId, detailIdArray, selectedDetailId });
  }

  return <div>main</div>;
};

// Stands for the login screen redirecting to the url the user asked for.
const LoginProbe = () => {
  const [loggedIn, setLoggedIn] = useState(false);
  return loggedIn ? (
    <Navigate to={target} replace />
  ) : (
    <button onClick={() => setLoggedIn(true)}>log in</button>
  );
};

interface SetterProbeApi {
  setTerritoryId: (id: string) => void;
  setStatementId: (id: string) => void;
}

const SetterProbe = ({ onRender }: { onRender: (api: SetterProbeApi) => void }) => {
  const { territoryId, statementId, setTerritoryId, setStatementId } = useSearchParams();
  onRender({ setTerritoryId, setStatementId });
  return (
    <div>
      {territoryId}|{statementId}
    </div>
  );
};

// Holds location updates from navigate() so a stale own-hash write can be
// delivered after a later param setter has already committed.
const createDelayedHashRouter = (initialHash: string) => {
  const pending: To[] = [];
  let commit: ((to: To) => void) | undefined;

  const navigator = {
    createHref(to: To) {
      if (typeof to === "string") {
        return to;
      }
      return `${to.pathname ?? ""}${to.search ?? ""}${to.hash ?? ""}`;
    },
    go() {},
    push(to: To) {
      pending.push(to);
    },
    replace(to: To) {
      pending.push(to);
    },
  };

  const Harness = ({ children }: { children: React.ReactNode }) => {
    const [location, setLocation] = useState({
      pathname: "/",
      search: "",
      hash: initialHash,
      state: null,
      key: "default",
    });

    commit = (to: To) => {
      setLocation((prev) => {
        if (typeof to === "string") {
          const url = new URL(to, "http://local");
          return {
            pathname: url.pathname,
            search: url.search,
            hash: url.hash,
            state: null,
            key: `${prev.key}-next`,
          };
        }
        return {
          pathname: to.pathname ?? prev.pathname,
          search: to.search ?? prev.search,
          hash: to.hash ?? prev.hash,
          state: null,
          key: `${prev.key}-next`,
        };
      });
    };

    return (
      <Router location={location} navigator={navigator}>
        {children}
      </Router>
    );
  };

  const flushNext = () => {
    const to = pending.shift();
    if (to === undefined || !commit) {
      return;
    }
    act(() => commit!(to));
  };

  return { Harness, flushNext, pending };
};

describe("SearchParamsProvider", () => {
  let container: HTMLDivElement;
  let root: Root;

  beforeEach(() => {
    (globalThis as { IS_REACT_ACT_ENVIRONMENT?: boolean }).IS_REACT_ACT_ENVIRONMENT = true;
    window.history.replaceState({}, "", "/login");
    container = document.createElement("div");
    document.body.appendChild(container);
  });

  afterEach(() => {
    act(() => root.unmount());
    container.remove();
  });

  const renderApp = (onMount: (params: ParamsSnapshot) => void) => {
    act(() => {
      root = createRoot(container);
      root.render(
        <BrowserRouter>
          <SearchParamsProvider>
            <Routes>
              <Route path="/login" element={<LoginProbe />} />
              <Route path="/" element={<MainProbe onMount={onMount} />} />
            </Routes>
          </SearchParamsProvider>
        </BrowserRouter>,
      );
    });
  };

  it("lands on the url it was sent to, params and all", () => {
    renderApp(() => {});

    act(() => container.querySelector("button")!.click());

    expect(window.location.pathname).toBe("/");
    expect(window.location.hash).toContain("territory=T1");
  });

  it("hands the params to the page on the render it mounts on", () => {
    const mountedWith: ParamsSnapshot[] = [];
    renderApp((params) => mountedWith.push(params));

    act(() => container.querySelector("button")!.click());

    expect(mountedWith).toEqual([
      {
        territoryId: "T1",
        statementId: "S1",
        detailIdArray: ["D1", "D2"],
        selectedDetailId: "D1",
      },
    ]);
  });

  it("does not navigate again to a url that already says what the params say", () => {
    renderApp(() => {});
    const entriesBefore = window.history.length;

    // the redirect itself replaces the login entry rather than adding one, so
    // any growth here is the provider writing back what it just read
    act(() => container.querySelector("button")!.click());

    expect(window.history.length).toBe(entriesBefore);
  });

  it("does not let its own hash write wipe a param set while that write lands", () => {
    const { Harness, flushNext, pending } = createDelayedHashRouter("#territory=T1");
    let api: SetterProbeApi | undefined;

    act(() => {
      root = createRoot(container);
      root.render(
        <Harness>
          <SearchParamsProvider>
            <SetterProbe
              onRender={(next) => {
                api = next;
              }}
            />
          </SearchParamsProvider>
        </Harness>,
      );
    });

    // territory-only hash write is queued, not delivered yet
    act(() => api!.setTerritoryId("T2"));
    expect(pending).toHaveLength(1);

    // statement lands in state while that write is still in flight
    act(() => api!.setStatementId("S1"));
    expect(pending.length).toBeGreaterThanOrEqual(1);

    // deliver only the stale territory-only write; re-applying it during
    // render would call setStatementId("") and discard S1
    flushNext();

    expect(container.textContent).toBe("T2|S1");
  });
});
