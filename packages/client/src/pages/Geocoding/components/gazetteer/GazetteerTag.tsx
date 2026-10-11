import { Tooltip } from "components";
import React, { useEffect, useRef, useState } from "react";
import { useTheme } from "styled-components";
import { GazetteerCard } from "./GazetteerCard";
import { GazetteerMark } from "./GazetteerMark";
import { StyledGazetteerAnchor, StyledGazetteerFace } from "./GazetteerCardStyles";
import { sourceColor } from "./MatchTagStyles";
import { useGazetteer } from "../../hooks/useGazetteerCatalogue";

/**
 * A gazetteer, wherever the page names one.
 *
 * Hovering or focusing it shows what the engine says about the source — what it
 * is, what it is good for, what it cannot do and on what terms its data may be
 * used. It is one component so the answer is the same in the settings table, on
 * a match, in the progress strip and on the map, and so a source added to the
 * engine is explained everywhere at once.
 *
 * `GazetteerHover` wraps a face the caller already draws; `GazetteerTag` draws
 * the standard one. Where the engine has not been reached, or does not know the
 * source, the face is shown without a card rather than with an empty one.
 */

/** How long the card waits after the pointer leaves, so the pointer can cross onto it. */
const LEAVE_DELAY_MS = 150;

interface GazetteerHover {
  source: string;
  children: React.ReactNode;
}

export const GazetteerHover: React.FC<GazetteerHover> = ({ source, children }) => {
  const suggester = useGazetteer(source);
  const [anchor, setAnchor] = useState<HTMLSpanElement | null>(null);
  const [open, setOpen] = useState(false);
  const timer = useRef<ReturnType<typeof setTimeout>>(undefined);
  useEffect(() => () => clearTimeout(timer.current), []);

  if (!suggester) {
    return <>{children}</>;
  }
  const show = () => {
    clearTimeout(timer.current);
    setOpen(true);
  };
  const hide = () => {
    clearTimeout(timer.current);
    timer.current = setTimeout(() => setOpen(false), LEAVE_DELAY_MS);
  };

  return (
    <>
      <StyledGazetteerAnchor
        ref={setAnchor}
        onMouseEnter={show}
        onMouseLeave={hide}
        onFocus={show}
        onBlur={hide}
      >
        <GazetteerMark source={source} category={suggester.category} />
        {children}
      </StyledGazetteerAnchor>
      <Tooltip
        visible={open}
        referenceElement={anchor}
        position="bottom"
        fallbackPlacements={["top", "right", "left"]}
        portalId="page"
        onMouseLeave={() => setOpen(false)}
        content={<GazetteerCard suggester={suggester} />}
      />
    </>
  );
};

interface GazetteerTag {
  source: string;
}

export const GazetteerTag: React.FC<GazetteerTag> = ({ source }) => {
  const theme = useTheme();
  return (
    <GazetteerHover source={source}>
      <StyledGazetteerFace $color={sourceColor(theme, source)} tabIndex={0}>
        {source}
      </StyledGazetteerFace>
    </GazetteerHover>
  );
};
