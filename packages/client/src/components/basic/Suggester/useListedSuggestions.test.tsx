import { IEntity } from "@inkvisitor/shared/types";
import { render, Rendered } from "pages/Geocoding/utils/test/renderForTest";
import React from "react";
import { EntitySuggestion } from "types";
import { afterEach, describe, expect, it } from "vitest";
import { useListedSuggestions } from "./useListedSuggestions";

// the icon tells a priority row from the search hit of the same entity
const home = (id: string): EntitySuggestion => ({ entity: { id } as IEntity, icons: ["home"] });
const hit = (id: string): EntitySuggestion => ({ entity: { id } as IEntity, icons: [] });

const Probe = ({
  priority,
  hits,
  open,
}: {
  priority: EntitySuggestion[];
  hits: EntitySuggestion[];
  open: boolean;
}) => {
  const { listedSuggestions, listedPriorityCount } = useListedSuggestions(priority, hits, open);
  return (
    <ol data-priority-count={listedPriorityCount}>
      {listedSuggestions.map((s) => (
        <li key={s.entity.id}>{`${s.entity.id}${s.icons?.length ? " home" : ""}`}</li>
      ))}
    </ol>
  );
};

let view: Rendered | null = null;

const rows = () => view?.texts("li");
const priorityCount = () => Number(view?.one("ol")?.dataset.priorityCount);

afterEach(() => {
  view?.unmount();
  view = null;
});

describe("useListedSuggestions", () => {
  it("lists the priority rows first and leaves them out of the search hits", () => {
    view = render(<Probe priority={[home("a")]} hits={[hit("a"), hit("x")]} open={false} />);
    expect(rows()).toEqual(["a home", "x"]);
    expect(priorityCount()).toBe(1);
  });

  it("holds a row arriving under listed search hits until the list opens again", () => {
    view = render(<Probe priority={[]} hits={[hit("x")]} open={false} />);
    view.update(<Probe priority={[]} hits={[hit("x")]} open />);
    view.update(<Probe priority={[home("a")]} hits={[hit("x")]} open />);
    expect(rows()).toEqual(["x"]);
    expect(priorityCount()).toBe(0);

    view.update(<Probe priority={[home("a")]} hits={[hit("x")]} open={false} />);
    view.update(<Probe priority={[home("a")]} hits={[hit("x")]} open />);
    expect(rows()).toEqual(["a home", "x"]);
  });

  it("keeps a held row among the search hits while it waits", () => {
    view = render(<Probe priority={[]} hits={[hit("x"), hit("a")]} open={false} />);
    view.update(<Probe priority={[]} hits={[hit("x"), hit("a")]} open />);
    view.update(<Probe priority={[home("a")]} hits={[hit("x"), hit("a")]} open />);
    expect(rows()).toEqual(["x", "a"]);
  });

  it("lets a held row in once the search hits go away", () => {
    view = render(<Probe priority={[]} hits={[hit("x")]} open={false} />);
    view.update(<Probe priority={[]} hits={[hit("x")]} open />);
    view.update(<Probe priority={[home("a")]} hits={[hit("x")]} open />);
    view.update(<Probe priority={[home("a")]} hits={[]} open />);
    expect(rows()).toEqual(["a home"]);

    view.update(<Probe priority={[home("a")]} hits={[hit("y")]} open />);
    expect(rows()).toEqual(["a home", "y"]);
  });

  it("drops a row that leaves the priority rows at once", () => {
    view = render(<Probe priority={[home("a"), home("b")]} hits={[hit("x")]} open={false} />);
    view.update(<Probe priority={[home("a"), home("b")]} hits={[hit("x")]} open />);
    view.update(<Probe priority={[home("b")]} hits={[hit("x")]} open />);
    expect(rows()).toEqual(["b home", "x"]);
  });
});
