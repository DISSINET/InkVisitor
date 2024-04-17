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

interface TextAnnotatorProps {
  width: number;
  height: number;
  displayLineNumbers: boolean;
}

export const TextAnnotator = ({
  width = 400,
  height = 500,
  displayLineNumbers = true,
}: TextAnnotatorProps) => {
  const { annotator, setAnnotator } = useAnnotator();

  const wLineNumbers = displayLineNumbers ? 50 : 0;
  const wScroll = 20;
  const wTextArea = width - wLineNumbers - wScroll;

  const mainCanvas = useRef(null);
  const scroller = useRef(null);
  const lines = useRef(null);
  const [highlighted, setSelected] = useState<Highlighted>();

  const [selectedText, setSelectedText] = useState<string>("");
  const [selectedAnchors, setSelectedAnchors] = useState<string[]>([]);
  const storedEntities = useRef<Record<string, IEntity | false>>({});

  const fetchEntity = async (anchor: string) => {
    const entity = await api.entitiesGet(anchor);
    return entity;
  };

  const addEntityToStore = (eid: string, entity: IEntity | false) => {
    storedEntities.current[eid] = entity;
  };

  const handleTextSelection = async (text: string, anchors: string[]) => {
    setSelectedText(text);
    setSelectedAnchors(anchors);

    for (const anchorI in anchors) {
      const anchor = anchors[anchorI];
      if (!Object.keys(storedEntities.current).includes(anchor)) {
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
    if (!mainCanvas.current || !scroller.current) {
      return;
    }

    const annotator = new Annotator(mainCanvas.current, example);
    annotator.setMode("highlight");
    annotator.addScroller(scroller.current);

    if (displayLineNumbers && lines.current) {
      annotator.addLines(lines.current);
    }
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

  const topBottomSelection = useMemo<boolean>(() => {
    const selectedText = annotator?.cursor?.getSelected();

    return (selectedText?.[0]?.yLine ?? 0) < (selectedText?.[1]?.yLine ?? 0);
  }, [annotator?.cursor?.yLine]);

  const menuPositionY = useMemo<number>(() => {
    const yLine = annotator?.cursor?.yLine ?? 0;
    const lineHeight = annotator?.lineHeight ?? 0;

    return yLine * lineHeight + (topBottomSelection ? 30 : -30);
  }, [annotator?.cursor?.yLine, annotator?.lineHeight, topBottomSelection]);

  return (
    <div style={{ width: width }}>
      <StyledCanvasWrapper>
        <TextAnnotatorMenu
          anchors={selectedAnchors}
          text={selectedText}
          entities={storedEntities.current}
          onAnchorAdd={handleAddAnchor}
          yPosition={menuPositionY}
          topBottomSelection={topBottomSelection}
        />
        {displayLineNumbers && (
          <StyledLinesCanvas ref={lines} width={wLineNumbers} height="400px" />
        )}
        <StyledMainCanvas
          tabIndex={0}
          ref={mainCanvas}
          width={wTextArea}
          height="400px"
        />
        <StyledScrollerViewport ref={scroller}>
          <StyledScrollerCursor />
        </StyledScrollerViewport>
      </StyledCanvasWrapper>
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
