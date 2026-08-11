import React, { act, useRef, useState } from "react";
import { createRoot, Root } from "react-dom/client";
import { BrowserRouter, Navigate, Route, Routes } from "react-router-dom";
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
});
