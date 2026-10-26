import { createContext, useContext } from "react";

// A page that lays out the Detail and Editor boxes itself provides this, so a
// statement or an entity the user opens from anywhere inside the page shows up
// even while its box is collapsed or squeezed. Callers invoke it from the click
// handler, not from effects: only a user's open moves the layout. Without a
// provider both calls do nothing.
interface DetailPanelReveal {
  revealEditor: () => void;
  revealDetail: () => void;
}

const noop = () => {};

const DetailPanelRevealContext = createContext<DetailPanelReveal>({
  revealEditor: noop,
  revealDetail: noop,
});

export const DetailPanelRevealProvider = DetailPanelRevealContext.Provider;

export const useDetailPanelReveal = () => useContext(DetailPanelRevealContext);
