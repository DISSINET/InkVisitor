import { GeoJsonGeometry } from "@inkvisitor/shared/types/geometry";
import { Button, IconWithTooltip } from "components";
import React, { useState } from "react";
import { IcoDrawShape } from "Theme/icons";
import { kindOfGeometry } from "../../utils/map/geometryDraft";
import {
  StyledShapeError,
  StyledShapeHint,
  StyledShapePanel,
  StyledShapeRow,
  StyledShapeToggle,
} from "./GeometryDrawStyles";
import { DrawTool, UseGeometryDraw } from "../../hooks/useGeometryDraw";

/**
 * Drawing a point, a line or a polygon for the selected Location.
 *
 * The shapes live in the drawing tool; this only arms it, says what to do next,
 * and hands the one geometry they make to whoever asks the accuracy and kind of
 * place. Several shapes of one kind are saved together as one Multi geometry.
 */

interface GeometryDrawPanel {
  open: boolean;
  onToggle: () => void;
  /** Nothing to draw for until a Location is selected. */
  disabled: boolean;
  draw: UseGeometryDraw;
  /** The geometry the selected Location already carries, to be edited. */
  stored: GeoJsonGeometry | null;
  onSave: (geometry: GeoJsonGeometry) => void;
}

const TOOLS: { tool: DrawTool; label: string; hint: string }[] = [
  { tool: "point", label: "point", hint: "click the map to place a point" },
  {
    tool: "linestring",
    label: "line",
    hint: "click to add corners, double-click or click the last corner to finish",
  },
  {
    tool: "polygon",
    label: "polygon",
    hint: "click to add corners, double-click or click the first corner to finish",
  },
  {
    tool: "select",
    label: "edit",
    hint: "click a shape to move it or its corners, Delete removes the selected corner or shape",
  },
];

export const GeometryDrawPanel: React.FC<GeometryDrawPanel> = ({
  open,
  onToggle,
  disabled,
  draw,
  stored,
  onSave,
}) => {
  const [error, setError] = useState<string | null>(null);
  const current = TOOLS.find((one) => one.tool === draw.tool);

  return (
    <>
      <StyledShapeToggle
        type="button"
        aria-label="draw a geometry for the selected location"
        aria-pressed={open}
        $armed={open}
        disabled={disabled}
        onClick={() => {
          setError(null);
          onToggle();
        }}
      >
        {/* the hint is withheld while the panel is open: both sit to the left of
            the toggle, and the hint would cover the tools it describes */}
        {open ? (
          <IcoDrawShape />
        ) : (
          <IconWithTooltip
            icon={<IcoDrawShape />}
            tooltipText="draw a point, line or polygon for the selected location"
            tooltipPosition="left"
          />
        )}
      </StyledShapeToggle>
      {open ? (
        <StyledShapePanel data-geometry-panel>
          <StyledShapeRow>
            {TOOLS.map(({ tool, label }) => (
              <Button
                key={tool}
                label={label}
                color="primary"
                inverted={draw.tool !== tool}
                // choosing another kind with shapes of a kind already drawn is
                // allowed, because the shapes can still be removed; the refusal
                // comes at save, where the mix is actually a problem
                onClick={() => {
                  setError(null);
                  draw.setTool(draw.tool === tool ? null : tool);
                }}
              />
            ))}
          </StyledShapeRow>
          <StyledShapeHint>
            {current?.hint ?? "choose what to draw"}
            {draw.count ? ` · ${draw.count} drawn` : ""}
          </StyledShapeHint>
          {error ? <StyledShapeError role="alert">{error}</StyledShapeError> : null}
          <StyledShapeRow>
            <Button
              label="save shape"
              color="success"
              disabled={!draw.count}
              onClick={() => {
                const result = draw.build();
                if ("error" in result) {
                  setError(result.error);
                  return;
                }
                setError(null);
                onSave(result.geometry);
              }}
            />
            {stored ? (
              <Button
                label={`edit current ${kindOfGeometry(stored) === "point" ? "point" : "shape"}`}
                color="greyer"
                inverted
                onClick={() => {
                  setError(
                    draw.load(stored)
                      ? null
                      : "The drawing tool cannot edit this shape — a polygon with holes. Draw a new one.",
                  );
                }}
              />
            ) : null}
            <Button
              label="clear"
              color="danger"
              inverted
              disabled={!draw.count}
              onClick={() => {
                setError(null);
                draw.clear();
              }}
            />
          </StyledShapeRow>
        </StyledShapePanel>
      ) : null}
    </>
  );
};
