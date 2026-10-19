import styled from "styled-components";
import { COLLAPSED_PANEL_WIDTH } from "Theme/constants";
import { panelWidthVar } from "utils/layoutUtils";
import { StyledMapToggle } from "../../components/map/MapControlsStyles";
import { belowToggle, TOGGLE_SIZE } from "../../components/map/MapControlsStyles";

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
/**
 * Holds the canvas at one place on screen, whatever the panels beside it do.
 *
 * As wide as the map can ever be, from the folded list's strip to the folded
 * suggestions' strip, and pulled left by the list's live width. The panels
 * slide over it during a fold or a drag, and the renderer never redraws for a
 * size change, which it would on every frame of one.
 */
export const StyledMapStage = styled.div<{ $width: number }>`
  position: absolute;
  top: 0;
  bottom: 0;
  left: calc(${COLLAPSED_PANEL_WIDTH / 10}rem - var(${panelWidthVar(0)}));
  width: ${({ $width }) => $width / 10}rem;
`;

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

  /* the zoom sits at the foot of the right edge, above the attribution: the
     toggles above it are a column of their own, and a zoom control sharing that
     column ends up under whichever of them is drawn */
  .maplibregl-ctrl-bottom-right {
    bottom: ${({ theme }) => theme.space[1]};
  }

  /* the renderer pins its controls to the canvas corners, and the canvas runs
     under both side panels: each corner is moved in by what covers it */
  .maplibregl-ctrl-top-left,
  .maplibregl-ctrl-bottom-left {
    left: calc(var(${panelWidthVar(0)}) - ${COLLAPSED_PANEL_WIDTH / 10}rem);
  }

  .maplibregl-ctrl-top-right,
  .maplibregl-ctrl-bottom-right {
    right: calc(var(${panelWidthVar(2)}) - ${COLLAPSED_PANEL_WIDTH / 10}rem);
  }

  .maplibregl-ctrl-bottom-right .maplibregl-ctrl {
    margin: 0 ${({ theme }) => theme.space[2]} ${({ theme }) => theme.space[2]} 0;
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
/**
 * Arming the drawing of a region.
 *
 * Under the layers switch and shaped like it, because both are controls the map
 * owns rather than statements about a place. Held down while armed: drawing is
 * a mode — the next drag makes a rectangle instead of moving the map — and a
 * mode the reader cannot see they are in is a map that has stopped working.
 */
export const StyledDrawToggle = styled(StyledMapToggle).attrs<{ $armed: boolean; $set: boolean }>(
  ({ $armed, $set }) => ({
    $slot: 1,
    $tone: $armed ? "armed" : $set ? "set" : "idle",
  }),
)<{ $armed: boolean; $set: boolean }>``;

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

  /* the gap to the toggle is part of the note, so moving the pointer from one
     to the other does not leave both */
  &::after {
    content: "";
    position: absolute;
    top: 0;
    bottom: 0;
    left: 100%;
    width: ${({ theme }) => theme.space[2]};
  }
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
