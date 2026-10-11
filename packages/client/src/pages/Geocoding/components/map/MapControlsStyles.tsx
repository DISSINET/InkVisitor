import styled, { DefaultTheme } from "styled-components";

/*
 * The map's top-right corner stacks the renderer's zoom control under the layers
 * toggle, and the layers panel drops from beneath it. Both clear the toggle by
 * the inset it sits in, its height, and that inset again as the gap, so a
 * resized toggle carries them with it.
 */
export const TOGGLE_SIZE = "2.6rem";
const LAYER_LINE = "1.4rem";
export const belowToggle = ({ theme }: { theme: DefaultTheme }) =>
  `calc(${theme.space[2]} + ${TOGGLE_SIZE} + ${theme.space[2]})`;

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

export type MapToggleTone = "idle" | "open" | "set" | "armed";

/**
 * The square buttons down the map's right edge: layers, a drawn region, a drawn
 * shape.
 *
 * One definition for all three, so they are the same size, hold the same gap and
 * answer a pointer the same way. `$slot` is the place down the edge; `$tone` is
 * what the button is saying — idle, its panel open, a value set, or a mode armed
 * for the next gesture.
 */
export const StyledMapToggle = styled.button<{ $slot: number; $tone: MapToggleTone }>`
  position: absolute;
  top: calc(${({ theme }) => theme.space[2]} + (${TOGGLE_SIZE} + ${({ theme }) => theme.space[2]}) * ${({ $slot }) => $slot});
  right: ${({ theme }) => theme.space[2]};
  z-index: 2;
  display: flex;
  align-items: center;
  justify-content: center;
  width: ${TOGGLE_SIZE};
  height: ${TOGGLE_SIZE};
  cursor: pointer;
  border: 1px solid
    ${({ theme, $tone }) =>
      $tone === "armed" || $tone === "set" ? theme.color["primary"] : theme.color["gray"][500]};
  border-radius: ${({ theme }) => theme.borderRadius["sm"]};
  background-color: ${({ theme, $tone }) =>
    $tone === "armed"
      ? theme.color["primary"]
      : $tone === "open" || $tone === "set"
        ? theme.color["gray"][200]
        : theme.color["white"]};
  color: ${({ theme, $tone }) =>
    $tone === "armed"
      ? theme.color["white"]
      : $tone === "set"
        ? theme.color["primary"]
        : theme.color["black"]};
  font-size: ${({ theme }) => theme.fontSize.lg};

  &:hover:not(:disabled) {
    border-color: ${({ theme }) => theme.color["primary"]};
  }

  &:disabled {
    cursor: not-allowed;
    opacity: 0.5;
  }
`;

/**
 * The map's own controls, folded away by default.
 *
 * Everything behind it changes what is drawn and nothing else, so it is not a
 * setting the project shares — the researcher who wants only the place in front
 * of them is not making a decision anybody else has to live with.
 */
export const StyledLayersToggle = styled(StyledMapToggle).attrs<{ $open: boolean }>(({ $open }) => ({
  $slot: 0,
  $tone: $open ? "open" : "idle",
}))<{ $open: boolean }>``;

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

  &:not(:first-child) {
    margin-top: ${({ theme }) => theme.space[2]};
  }

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
  line-height: ${LAYER_LINE};
  color: ${({ theme }) => theme.color["black"]};

  /* a checkbox's own margins push it off the first line of its label; sized to
     that line and stripped of them, every box sits level with its title */
  input[type="checkbox"] {
    flex: none;
    width: ${LAYER_LINE};
    height: ${LAYER_LINE};
    margin: 0;
  }
`;

export const StyledLayerCount = styled.span`
  display: block;
  line-height: 1.3;
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

