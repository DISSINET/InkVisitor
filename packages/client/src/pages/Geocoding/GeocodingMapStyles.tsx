import styled, { DefaultTheme } from "styled-components";

/*
 * The map's top-right corner stacks the renderer's zoom control under the layers
 * toggle, and the layers panel drops from beneath it. Both clear the toggle by
 * the inset it sits in, its height, and that inset again as the gap, so a
 * resized toggle carries them with it.
 */
const TOGGLE_SIZE = "2.6rem";
const belowToggle = ({ theme }: { theme: DefaultTheme }) =>
  `calc(${theme.space[2]} + ${TOGGLE_SIZE} + ${theme.space[2]})`;

/**
 * The element the renderer draws into.
 *
 * It sizes itself from this box, so the box has to carry a real height rather
 * than one it works out from its contents. Stated as a percentage rather than
 * by pinning the edges: the renderer's own stylesheet positions this element,
 * and an offset written here is overruled, leaving a box of no height at all.
 *
 * The background shows while tiles are in flight, and on a basemap that never
 * arrives it is all there is behind the marks — which is why it is a surface
 * colour rather than nothing.
 */
export const StyledMapCanvas = styled.div`
  height: 100%;
  width: 100%;
  background-color: ${({ theme }) => theme.color["gray"][200]};
`;

export const StyledMapPanel = styled.div`
  position: relative;
  height: 100%;
  min-width: 0;
  /* nothing inside the map may reach a scrollbar on an ancestor: the controls
     are positioned against this box and the canvas is sized from it, so an
     overflow here would resize the very thing that caused it */
  overflow: hidden;

  .maplibregl-map {
    font-family: inherit;
  }

  /* the hover name for a mark. The renderer's own popup is a white card with a
     tail, sized for a wide map; here it names the place a decision is about, on
     a panel that shares the window with two others */
  .maplibregl-popup-content {
    padding: ${({ theme }) => theme.space[1]} ${({ theme }) => theme.space[2]};
    font-size: ${({ theme }) => theme.fontSize.sm};
    font-family: inherit;
    color: ${({ theme }) => theme.color["black"]};
    background-color: ${({ theme }) => theme.color["white"]};
    border: 1px solid ${({ theme }) => theme.color["gray"][500]};
    border-radius: ${({ theme }) => theme.borderRadius["sm"]};
    box-shadow: ${({ theme }) => theme.boxShadow["normal"]};
  }

  .maplibregl-popup-tip {
    display: none;
  }

  /* the zoom sits under the layers toggle rather than at the top left, which is
     where the search field is - the renderer's default corner is the same one */
  .maplibregl-ctrl-top-right {
    top: ${belowToggle};
    right: 0;
  }

  .maplibregl-ctrl-top-right .maplibregl-ctrl {
    margin-right: ${({ theme }) => theme.space[2]};
  }

  /* the renderer draws its own buttons: a white group with a soft shadow and a
     4px radius, beside a panel whose every other control is drawn from the theme */
  .maplibregl-ctrl-group {
    border: none;
    border-radius: ${({ theme }) => theme.borderRadius["sm"]};
    background: none;
    box-shadow: none;
  }

  .maplibregl-ctrl-group button {
    width: ${TOGGLE_SIZE};
    height: ${TOGGLE_SIZE};
    border: 1px solid ${({ theme }) => theme.color["gray"][500]};
    background-color: ${({ theme }) => theme.color["white"]};
    color: ${({ theme }) => theme.color["black"]};
  }

  .maplibregl-ctrl-group button:first-child {
    border-radius: ${({ theme }) => theme.borderRadius["sm"]}
      ${({ theme }) => theme.borderRadius["sm"]} 0 0;
  }

  .maplibregl-ctrl-group button:last-child {
    border-radius: 0 0 ${({ theme }) => theme.borderRadius["sm"]}
      ${({ theme }) => theme.borderRadius["sm"]};
    border-top: none;
  }

  .maplibregl-ctrl-group button:hover {
    border-color: ${({ theme }) => theme.color["primary"]};
    background-color: ${({ theme }) => theme.color["white"]};
  }

  /* the attribution the tile and data licences require, kept legible without
     taking a corner the page uses */
  .maplibregl-ctrl-attrib {
    font-size: ${({ theme }) => theme.fontSize.xxs};
    background-color: ${({ theme }) => theme.color["white"]};
  }

  .maplibregl-ctrl-attrib a {
    color: ${({ theme }) => theme.color["greyer"]};
  }
`;

/**
 * Moving the map by name.
 *
 * The card is the whole control: the field it holds and the hits that drop out
 * of it share one outline, because the field draws its own and the two nested a
 * hairline apart read as a box inside a box. Bounded by the panel rather than
 * fixed at 26rem, which is wider than the map when the other two panels are
 * dragged open.
 */
/*
 * Everything drawn over the map sits at 2.
 *
 * High enough to clear the canvas and the renderer's own controls, which is all
 * these have to do — and low enough to stay under a modal's overlay, which is at
 * 500. A control that outranks the overlay is a control still offering to be
 * pressed while the page has been dimmed behind a dialogue.
 */
export const StyledMapSearch = styled.div`
  position: absolute;
  top: ${({ theme }) => theme.space[2]};
  left: ${({ theme }) => theme.space[2]};
  z-index: 2;
  width: 26rem;
  max-width: calc(100% - ${({ theme }) => theme.space[8]});
  background-color: ${({ theme }) => theme.color["white"]};
  border: 1px solid ${({ theme }) => theme.color["gray"][500]};
  border-radius: ${({ theme }) => theme.borderRadius["sm"]};
  box-shadow: ${({ theme }) => theme.boxShadow["normal"]};
  overflow: hidden;

  input {
    border: none;
    border-radius: 0;
    height: 2.6rem;
  }

  &:focus-within {
    border-color: ${({ theme }) => theme.color["primary"]};
  }
`;

export const StyledSearchHits = styled.div`
  max-height: 22rem;
  overflow-y: auto;
`;

export const StyledSearchHit = styled.button`
  display: block;
  width: 100%;
  text-align: left;
  cursor: pointer;
  border: none;
  border-top: 1px solid ${({ theme }) => theme.color["gray"][200]};
  background-color: transparent;
  padding: ${({ theme }) => theme.space[1]} ${({ theme }) => theme.space[2]};
  font-size: ${({ theme }) => theme.fontSize.xs};
  color: ${({ theme }) => theme.color["black"]};

  &:hover {
    background-color: ${({ theme }) => theme.color["gray"][100]};
  }
`;

export const StyledSearchHitMeta = styled.div`
  font-family: monospace;
  font-size: ${({ theme }) => theme.fontSize.xxs};
  color: ${({ theme }) => theme.color["greyer"]};
`;

/**
 * Setting a coordinate, in one place.
 *
 * The two ways of doing it — clicking the map and typing the pair — sat at
 * opposite bottom corners, so the sentence naming the act was as far from the
 * fields that perform it as the map is wide. Left-anchored rather than
 * full-width: the right corner belongs to the renderer's attribution.
 */
export const StyledMapFooter = styled.div`
  position: absolute;
  bottom: ${({ theme }) => theme.space[2]};
  left: ${({ theme }) => theme.space[2]};
  z-index: 2;
  display: flex;
  flex-wrap: wrap;
  align-items: center;
  gap: ${({ theme }) => theme.space[1]} ${({ theme }) => theme.space[2]};
  max-width: calc(100% - ${({ theme }) => theme.space[8]});
  padding: ${({ theme }) => theme.space[1]} ${({ theme }) => theme.space[2]};
  background-color: ${({ theme }) => theme.color["white"]};
  border: 1px solid ${({ theme }) => theme.color["gray"][400]};
  border-radius: ${({ theme }) => theme.borderRadius["sm"]};
  box-shadow: ${({ theme }) => theme.boxShadow["normal"]};
`;

/**
 * Names the act the fields beside it perform.
 *
 * Whole, never truncated: the panel is draggable to a third of its width and a
 * sentence cut to "click the …" says less than nothing. The strip wraps instead,
 * so a narrow map gets two short lines rather than one unreadable one.
 */
export const StyledMapHint = styled.div`
  font-size: ${({ theme }) => theme.fontSize.xxs};
  color: ${({ theme }) => theme.color["greyer"]};
`;

/** A keyboard path to the same act the map click performs. */
export const StyledManualEntry = styled.form`
  flex: 0 0 auto;
  display: flex;
  align-items: center;
  gap: ${({ theme }) => theme.space[1]};
`;

/**
 * The map's own controls, folded away by default.
 *
 * Everything behind it changes what is drawn and nothing else, so it is not a
 * setting the project shares — the researcher who wants only the place in front
 * of them is not making a decision anybody else has to live with.
 */
export const StyledLayersToggle = styled.button<{ $open: boolean }>`
  position: absolute;
  top: ${({ theme }) => theme.space[2]};
  right: ${({ theme }) => theme.space[2]};
  z-index: 2;
  display: flex;
  align-items: center;
  justify-content: center;
  width: ${TOGGLE_SIZE};
  height: ${TOGGLE_SIZE};
  cursor: pointer;
  border: 1px solid ${({ theme }) => theme.color["gray"][500]};
  border-radius: ${({ theme }) => theme.borderRadius["sm"]};
  background-color: ${({ theme, $open }) =>
    $open ? theme.color["gray"][200] : theme.color["white"]};
  color: ${({ theme }) => theme.color["black"]};
  font-size: ${({ theme }) => theme.fontSize.lg};

  &:hover {
    border-color: ${({ theme }) => theme.color["primary"]};
  }
`;

/**
 * Arming the drawing of a region.
 *
 * Under the layers switch and shaped like it, because both are controls the map
 * owns rather than statements about a place. Held down while armed: drawing is
 * a mode — the next drag makes a rectangle instead of moving the map — and a
 * mode the reader cannot see they are in is a map that has stopped working.
 */
export const StyledDrawToggle = styled.button<{ $armed: boolean }>`
  position: absolute;
  top: ${belowToggle};
  right: ${({ theme }) => theme.space[2]};
  z-index: 2;
  display: flex;
  align-items: center;
  justify-content: center;
  width: ${TOGGLE_SIZE};
  height: ${TOGGLE_SIZE};
  cursor: pointer;
  border: 1px solid
    ${({ theme, $armed }) => ($armed ? theme.color["primary"] : theme.color["gray"][500])};
  border-radius: ${({ theme }) => theme.borderRadius["sm"]};
  background-color: ${({ theme, $armed }) =>
    $armed ? theme.color["primary"] : theme.color["white"]};
  color: ${({ theme, $armed }) => ($armed ? theme.color["white"] : theme.color["black"])};
  font-size: ${({ theme }) => theme.fontSize.lg};

  &:hover {
    border-color: ${({ theme }) => theme.color["primary"]};
  }
`;

/**
 * What the drawn region is, and the way out of it.
 *
 * Beside its own control rather than on the context panel, because the shape it
 * names is on the map: a box removed from a dropdown on the other side of the
 * screen leaves the reader to work out which rectangle went.
 */
export const StyledDrawNote = styled.div`
  position: absolute;
  top: ${belowToggle};
  right: calc(${({ theme }) => theme.space[2]} + ${TOGGLE_SIZE} + ${({ theme }) => theme.space[2]});
  z-index: 2;
  display: flex;
  align-items: center;
  gap: ${({ theme }) => theme.space[2]};
  padding: ${({ theme }) => theme.space[1]} ${({ theme }) => theme.space[2]};
  border: 1px solid ${({ theme }) => theme.color["gray"][500]};
  border-radius: ${({ theme }) => theme.borderRadius["sm"]};
  background-color: ${({ theme }) => theme.color["white"]};
  box-shadow: ${({ theme }) => theme.boxShadow["normal"]};
  font-family: monospace;
  font-size: ${({ theme }) => theme.fontSize.xxs};
  color: ${({ theme }) => theme.color["black"]};
  white-space: nowrap;
`;

/** Says what a bad drag was refused for, in the place the drag happened. */
export const StyledDrawRefusal = styled.span`
  font-family: inherit;
  color: ${({ theme }) => theme.color["danger"]};
`;

export const StyledDrawClear = styled.button`
  border: none;
  background: none;
  padding: 0;
  cursor: pointer;
  text-decoration: underline;
  font-size: ${({ theme }) => theme.fontSize.xxs};
  color: ${({ theme }) => theme.color["greyer"]};

  &:hover {
    color: ${({ theme }) => theme.color["danger"]};
  }
`;

export const StyledLayersPanel = styled.div`
  position: absolute;
  top: ${belowToggle};
  right: ${({ theme }) => theme.space[2]};
  z-index: 2;
  width: 22rem;
  padding: ${({ theme }) => theme.space[2]};
  border: 1px solid ${({ theme }) => theme.color["gray"][500]};
  border-radius: ${({ theme }) => theme.borderRadius["sm"]};
  background-color: ${({ theme }) => theme.color["white"]};
  box-shadow: ${({ theme }) => theme.boxShadow["high"]};
`;

export const StyledLayersHead = styled.div`
  margin-bottom: ${({ theme }) => theme.space[1]};
  font-size: ${({ theme }) => theme.fontSize.xxs};
  font-weight: ${({ theme }) => theme.fontWeight["medium"]};
  color: ${({ theme }) => theme.color["greyer"]};
`;

export const StyledLayerRow = styled.label`
  display: flex;
  align-items: flex-start;
  gap: ${({ theme }) => theme.space[2]};
  padding: ${({ theme }) => theme.space[1]} 0;
  cursor: pointer;
  font-size: ${({ theme }) => theme.fontSize.xs};
  color: ${({ theme }) => theme.color["black"]};
`;

export const StyledLayerCount = styled.span`
  display: block;
  font-size: ${({ theme }) => theme.fontSize.xxs};
  color: ${({ theme }) => theme.color["greyer"]};
`;

export const StyledLayersNote = styled.div`
  margin-top: ${({ theme }) => theme.space[2]};
  padding-top: ${({ theme }) => theme.space[1]};
  border-top: 1px solid ${({ theme }) => theme.color["gray"][400]};
  font-size: ${({ theme }) => theme.fontSize.xxs};
  color: ${({ theme }) => theme.color["greyer"]};
`;

/**
 * Puts every switch in this panel back where it started.
 *
 * The panel now carries six of them and remembers each one, so a map that has
 * drifted somewhere unhelpful over several sessions has no other way back short
 * of reasoning about which switch did it.
 */
export const StyledLayersReset = styled.button`
  margin-top: ${({ theme }) => theme.space[2]};
  padding: 0;
  border: none;
  background: none;
  cursor: pointer;
  font-size: ${({ theme }) => theme.fontSize.xxs};
  color: ${({ theme }) => theme.color["primary"]};
  text-decoration: underline;

  &:disabled {
    cursor: default;
    color: ${({ theme }) => theme.color["gray"][600]};
    text-decoration: none;
  }
`;

/**
 * What a mark on the map is, shown where the pointer is.
 *
 * A Location this page holds is more than the coordinate its mark draws — it
 * has a name, a class, a kind of place and a claim about how precisely it is
 * known — and the map is where a reader decides which of several nearby marks
 * they meant.
 *
 * Placed against the viewport rather than inside the map panel, from the
 * pointer's own coordinates, and anchored by its bottom edge in the lower half
 * of the screen so a mark near the foot of the map is not described off the
 * bottom of it. Drawn through: this reports what is under the pointer, so it
 * must never become the thing under the pointer.
 *
 * The lowest of the things this page draws over its panels — the whole order is
 * the theme's `zIndex`, and all of it sits below a dialog.
 */
export const StyledMarkCard = styled.div<{ $left: number; $top: number; $up: boolean }>`
  position: fixed;
  left: ${({ $left }) => $left + 16}px;
  ${({ $top, $up }) =>
    $up ? `bottom: calc(100vh - ${$top - 16}px);` : `top: ${$top + 16}px;`}
  z-index: ${({ theme }) => theme.zIndex.mapCard};
  pointer-events: none;
  width: 26rem;
  max-width: calc(100vw - 2rem);
  display: flex;
  flex-direction: column;
  gap: ${({ theme }) => theme.space[1]};
  padding: ${({ theme }) => theme.space[2]};
  border: 1px solid ${({ theme }) => theme.color["gray"][500]};
  border-radius: ${({ theme }) => theme.borderRadius["sm"]};
  background-color: ${({ theme }) => theme.color["white"]};
  box-shadow: ${({ theme }) => theme.boxShadow["high"]};
`;

export const StyledMarkCardMeta = styled.div`
  display: flex;
  align-items: center;
  gap: ${({ theme }) => theme.space[2]};
  font-size: ${({ theme }) => theme.fontSize.xxs};
  color: ${({ theme }) => theme.color["greyer"]};

  svg {
    flex-shrink: 0;
  }
`;

/** The coordinate itself, set apart because it is read digit by digit. */
export const StyledMarkCardAt = styled.span`
  font-family: monospace;
  font-size: ${({ theme }) => theme.fontSize.xxs};
  color: ${({ theme }) => theme.color["greyer"]};
`;
