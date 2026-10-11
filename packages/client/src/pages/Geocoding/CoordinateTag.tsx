import { GeoJsonGeometry, pointGeometry } from "@inkvisitor/shared/types/geometry";
import { Tooltip } from "components";
import React, { useState } from "react";
import { toast } from "react-toastify";
import {
  StyledCoordinateAnchor,
  StyledCoordinateCard,
  StyledCoordinateExtent,
  StyledCoordinateKind,
  StyledCoordinateNote,
  StyledCoordinateTag,
  StyledCoordinateText,
} from "./CoordinateTagStyles";
import { describeGeometry, GEOMETRY_KIND } from "./geometryKind";
import { MiniGeoMap } from "./MiniGeoMap";

/**
 * What a geometry's position is, said when asked: the numbers, and a small map
 * of where in the world they are.
 *
 * Wraps whatever is to be hovered, so the same card answers the tag, a status
 * dot on a list row, or anything else that stands for a place.
 */
interface CoordinateHover {
  /** A geometry, or the point `lat`/`lon` stand for when there is only a pair. */
  geometry?: GeoJsonGeometry;
  lat?: number;
  lon?: number;
  /** Said beside the kind on the card, where there is a claim about precision. */
  accuracy?: string;
  children: React.ReactNode;
}

const shapeOf = ({
  geometry,
  lat,
  lon,
}: Pick<CoordinateHover, "geometry" | "lat" | "lon">): GeoJsonGeometry | undefined =>
  geometry ?? (lat !== undefined && lon !== undefined ? pointGeometry(lon, lat) : undefined);

export const CoordinateHover: React.FC<CoordinateHover> = ({
  geometry,
  lat,
  lon,
  accuracy,
  children,
}) => {
  const [anchor, setAnchor] = useState<HTMLSpanElement | null>(null);
  const [open, setOpen] = useState(false);
  const shape = shapeOf({ geometry, lat, lon });
  if (!shape) {
    return <>{children}</>;
  }
  const kind = GEOMETRY_KIND[shape.type];
  const Icon = kind.icon;
  const { anchor: where, extent } = describeGeometry(shape);

  return (
    <>
      <StyledCoordinateAnchor
        ref={setAnchor}
        onMouseEnter={() => setOpen(true)}
        onMouseLeave={() => setOpen(false)}
        onFocus={() => setOpen(true)}
        onBlur={() => setOpen(false)}
      >
        {children}
      </StyledCoordinateAnchor>
      <Tooltip
        visible={open}
        referenceElement={anchor}
        position="right"
        fallbackPlacements={["left", "bottom", "top"]}
        portalId="page"
        content={
          <StyledCoordinateCard>
            <StyledCoordinateKind>
              <Icon />
              {kind.label}
              {accuracy ? ` · ${accuracy}` : ""}
            </StyledCoordinateKind>
            <StyledCoordinateText>{where}</StyledCoordinateText>
            {extent ? <StyledCoordinateExtent>{extent}</StyledCoordinateExtent> : null}
            <MiniGeoMap geometry={shape} />
            <StyledCoordinateNote>
              {shape.type === "Point" ? "" : "centre of the shape · "}
              © OpenStreetMap contributors
            </StyledCoordinateNote>
          </StyledCoordinateCard>
        }
      />
    </>
  );
};

/**
 * Where a place is, as a mark that says what kind of geometry it is.
 *
 * Most readers of this page do not need the numbers on every row, and a column
 * of them hides the thing each row is for. The tag is only the mark — a point, a
 * line, an area, or several of them — and the numbers come on hover or focus.
 * Choosing the tag copies the position, which is the one thing the numbers are
 * usually wanted for.
 */
interface CoordinateTag {
  geometry?: GeoJsonGeometry;
  lat?: number;
  lon?: number;
  accuracy?: string;
}

export const CoordinateTag: React.FC<CoordinateTag> = (props) => {
  const shape = shapeOf(props);
  if (!shape) {
    return null;
  }
  const kind = GEOMETRY_KIND[shape.type];
  const Icon = kind.icon;
  const { anchor: where } = describeGeometry(shape);
  return (
    <CoordinateHover {...props}>
      <StyledCoordinateTag
        role="button"
        tabIndex={0}
        aria-label={`${kind.label} at ${where}. Press to copy.`}
        onClick={(event) => {
          event.stopPropagation();
          navigator.clipboard?.writeText(where).then(
            () => toast.info(`Copied ${where}`),
            () => undefined,
          );
        }}
        onKeyDown={(event) => {
          if (event.key === "Enter" || event.key === " ") {
            event.preventDefault();
            event.currentTarget.click();
          }
        }}
      >
        <Icon />
      </StyledCoordinateTag>
    </CoordinateHover>
  );
};
