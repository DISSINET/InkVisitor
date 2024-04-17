import { Annotator, Highlighted, Mode } from "@inkvisitor/annotator/src/lib";
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
import theme from "Theme/theme";

interface TextAnnotatorProps {
  width: number;
  height: number;
  displayLineNumbers: boolean;
  initialText: string;
}

export const TextAnnotator = ({
  width = 400,
  height = 500,
  displayLineNumbers = true,
  initialText,
}: TextAnnotatorProps) => {
  const { annotator, setAnnotator } = useAnnotator();

  const wLineNumbers = displayLineNumbers ? 50 : 0;
  const wScroll = 20;
  const wTextArea = width - wLineNumbers - wScroll;

  const mainCanvas = useRef(null);
  const scroller = useRef(null);
  const lines = useRef(null);
  const [highlighted, setSelected] = useState<Highlighted>();

  const [annotatorMode, setAnnotatorMode] = useState<Mode>("highlight");

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

    const annotator = new Annotator(mainCanvas.current, initialText);
    annotator.setMode("highlight");
    annotator.addScroller(scroller.current);

    annotator.cursor.setFillColor(theme.color.success);

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
          color: theme.color.danger,
        },
      };
    });

    annotator.text;
    annotator.draw();
    setAnnotator(annotator);
  }, [initialText]);

  const topBottomSelection = useMemo<boolean>(() => {
    const selectedText = annotator?.cursor?.getSelected();

    return (selectedText?.[0]?.yLine ?? 0) > (selectedText?.[1]?.yLine ?? 0);
  }, [annotator?.cursor?.yLine]);

  const menuPositionY = useMemo<number>(() => {
    const yLine = annotator?.cursor?.yLine ?? 0;
    const lineHeight = annotator?.lineHeight ?? 0;

    return yLine * lineHeight + (topBottomSelection ? 50 : -30);
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
          <StyledLinesCanvas ref={lines} width={wLineNumbers} height={height} />
        )}
        <StyledMainCanvas
          tabIndex={0}
          ref={mainCanvas}
          width={wTextArea}
          height={height}
        />
        <StyledScrollerViewport
          ref={scroller}
          style={{
            background: theme.color.success,
          }}
        >
          <StyledScrollerCursor
            style={{ backgroundColor: theme.color.primary }}
          />
        </StyledScrollerViewport>
      </StyledCanvasWrapper>
      {annotator && (
        <ButtonGroup>
          <Button
            key="hl"
            icon={<FaPen size={11} />}
            label="highlight"
            color="success"
            inverted={annotatorMode !== "highlight"}
            onClick={() => {
              annotator.setMode("highlight");
              setAnnotatorMode("highlight");
              annotator.draw();
            }}
            tooltipLabel="activate syntax higlighting mode"
          />
          <Button
            key="raw"
            icon={<FaMarker size={11} />}
            color="success"
            label="edit"
            inverted={annotatorMode !== "raw"}
            onClick={() => {
              annotator.setMode("raw");
              setAnnotatorMode("raw");
              annotator.draw();
            }}
            tooltipLabel="activate edit mode"
          />
        </ButtonGroup>
      )}
    </div>
  );
};

export default TextAnnotator;
