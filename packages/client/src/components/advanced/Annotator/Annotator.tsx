import { Annotator, Highlighted, example } from "@inkvisitor/annotator/src/lib";
import { IEntity } from "@shared/types";
import api from "api";
import { Button } from "components/basic/Button/Button";
import { ButtonGroup } from "components/basic/ButtonGroup/ButtonGroup";
import React, { useEffect, useMemo, useRef, useState } from "react";
import { FaMarker, FaPen } from "react-icons/fa";
import { useAnnotator } from "./AnnotatorContext";
import TextAnnotatorMenu from "./AnnotatorMenu";
import {
  StyledCanvasWrapper,
  StyledHightlightedText,
  StyledLinesCanvas,
  StyledMainCanvas,
  StyledScrollerCursor,
  StyledScrollerViewport,
} from "./AnnotatorStyles";

export const TextAnnotator = () => {
  const { annotator, setAnnotator } = useAnnotator();

  const mainCanvas = useRef(null);
  const scroller = useRef(null);
  const lines = useRef(null);
  const [highlighted, setSelected] = useState<Highlighted>();

  const [selectedText, setSelectedText] = useState<string>("");
  const [selectedAnchors, setSelectedAnchors] = useState<string[]>([]);
  const [entities, setEntities] = useState<Record<string, IEntity | false>>({});

  const fetchEntity = async (anchor: string) => {
    const entity = await api.entitiesGet(anchor);
    return entity;
  };

  const addEntityToStore = (eid: string, entity: IEntity | false) => {
    setEntities((prevEntities) => ({
      ...prevEntities,
      [eid]: entity,
    }));
  };

  const handleTextSelection = async (text: string, anchors: string[]) => {
    setSelectedText(text);
    setSelectedAnchors(anchors);

    for (const anchorI in anchors) {
      const anchor = anchors[anchorI];
      if (!entities[anchor]) {
        try {
          const entityRes = await fetchEntity(anchor);
          if (entityRes && entityRes.data) {
            addEntityToStore(anchor, entityRes.data);
          }
        } catch (error) {
          addEntityToStore(anchor, false);
        }
      }
    }
  };

  const handleAddAnchor = (entityId: string) => {
    annotator.addAnchor(entityId);
  };

  useEffect(() => {
    if (!mainCanvas.current || !scroller.current || !lines.current) {
      return;
    }

    const annotator = new Annotator(mainCanvas.current, example);
    annotator.setMode("raw");
    annotator.addScroller(scroller.current);
    annotator.addLines(lines.current);
    annotator.onSelectText(({ text, anchors }) => {
      handleTextSelection(text, anchors);
    });
    annotator.onHighlight((entity: string) => {
      return {
        mode: "background",
        style: {
          color: "pink",
        },
      };
    });

    annotator.draw();
    setAnnotator(annotator);
  }, []);

  const menuPositionY = useMemo<number>(() => {
    const yLine = annotator?.cursor?.yLine ?? 0;
    const lineHeight = annotator?.lineHeight ?? 0;

    return yLine * lineHeight;
  }, [annotator?.cursor?.yLine, annotator?.lineHeight]);

  return (
    <div style={{ padding: "20px" }}>
      <StyledCanvasWrapper>
        <TextAnnotatorMenu
          anchors={selectedAnchors}
          text={selectedText}
          entities={entities}
          onAnchorAdd={handleAddAnchor}
          yPosition={menuPositionY}
        />
        <StyledLinesCanvas ref={lines} width="50px" height="400px" />
        <StyledMainCanvas
          tabIndex={0}
          ref={mainCanvas}
          width="400px"
          height="400px"
        />
        <StyledScrollerViewport ref={scroller}>
          <StyledScrollerCursor />
        </StyledScrollerViewport>
      </StyledCanvasWrapper>
      {highlighted && false && (
        <StyledHightlightedText>{highlighted?.text}</StyledHightlightedText>
      )}
      {annotator && (
        <ButtonGroup>
          <Button
            key="raw"
            icon={<FaMarker size={11} />}
            color={annotator.text.mode === "raw" ? "success" : "gray"}
            label="edit"
            inverted
            onClick={() => {
              annotator.setMode("raw");
              annotator.draw();
            }}
            tooltipLabel="activate edit mode"
          />
          <Button
            key="hl"
            icon={<FaPen size={11} />}
            label="highlight"
            color={annotator.text.mode === "highlight" ? "success" : "gray"}
            inverted
            onClick={() => {
              annotator.setMode("highlight");
              annotator.draw();
            }}
            tooltipLabel="activate syntax higlighting mode"
          />
        </ButtonGroup>
      )}
    </div>
  );
};

export default TextAnnotator;
