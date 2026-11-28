import { Tooltip } from "components";
import React, { useEffect, useRef, useState } from "react";
import { useTheme } from "styled-components";
import { GazetteerCard } from "./GazetteerCard";
import { GazetteerMark } from "./GazetteerMark";
import { StyledGazetteerAnchor, StyledGazetteerFace } from "./GazetteerCardStyles";
import { sourceColor } from "./MatchTagStyles";
import { useGazetteer } from "../../hooks/useGazetteerCatalogue";

/**
 * A gazetteer's name.
 *
 * `GazetteerHover` wraps a face the caller already draws and, on hover or focus,
 * shows what the engine says about the source — what it is, what it is good
 * for, its limitations and on what terms its data may be used. It is used only
 * in the gazetteer tables of the settings, where a source is being chosen. Next
 * to a result the card would cover the answer being judged, so there a source is
 * a name and nothing more: `GazetteerTag` draws that name in the source's colour.
 *
 * Where the engine has not been reached, or does not know the source, the face
 * is shown without a card rather than with an empty one.
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
        tabIndex={0}
        onMouseEnter={show}
        onMouseLeave={hide}
        onFocus={show}
        onBlur={hide}
      >
        <GazetteerMark />
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
  return <StyledGazetteerFace $color={sourceColor(theme, source)}>{source}</StyledGazetteerFace>;
};
