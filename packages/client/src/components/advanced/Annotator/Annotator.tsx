import { Annotator, Highlighted, Mode } from "@inkvisitor/annotator/src/lib";
import { IDocument, IEntity } from "@shared/types";
import api from "api";
import { Button } from "components/basic/Button/Button";
import { ButtonGroup } from "components/basic/ButtonGroup/ButtonGroup";
import React, { useEffect, useMemo, useRef, useState } from "react";
import { FaMarker, FaPen, FaRegSave } from "react-icons/fa";
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
import { useDebounce } from "hooks";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { toast } from "react-toastify";

interface TextAnnotatorProps {
  width: number;
  height: number;
  displayLineNumbers: boolean;
  documentId: string;
  handleCreateStatement?: Function | false;
  handleCreateTerritory?: Function | false;
}

export const TextAnnotator = ({
  width = 400,
  height = 500,
  displayLineNumbers = true,
  documentId,
  handleCreateStatement = false,
  handleCreateTerritory = false,
}: TextAnnotatorProps) => {
  const queryClient = useQueryClient();

  const {
    data: document,
    error: documentError,
    isFetching: documentIsFetching,
  } = useQuery({
    queryKey: ["document", documentId],
    queryFn: async () => {
      const res = await api.documentGet(documentId);
      return res.data;
    },
    enabled: api.isLoggedIn(),
  });

  const updateDocumentMutation = useMutation({
    mutationFn: async (data: { id: string; doc: Partial<IDocument> }) =>
      api.documentUpdate(data.id, data.doc),
    onSuccess: (variables, data) => {
      queryClient.invalidateQueries({ queryKey: ["document"] });
      queryClient.invalidateQueries({ queryKey: ["documents"] });
      toast.info("Document content saved");
    },
  });

  const { annotator, setAnnotator } = useAnnotator();

  const wLineNumbers = displayLineNumbers ? 50 : 0;
  const wScroll = 20;
  const wTextArea = width - wLineNumbers - wScroll;

  const mainCanvas = useRef(null);
  const scroller = useRef(null);
  const lines = useRef(null);

  const [annotatorMode, setAnnotatorMode] = useState<Mode>("highlight");

  const [selectedText, setSelectedText] = useState<string>("");
  const [selectedAnchors, setSelectedAnchors] = useState<string[]>([]);
  const storedEntities = useRef<Record<string, IEntity | false>>({});

  const handleSaveNewContent = () => {
    if (annotator && document?.id) {
      updateDocumentMutation.mutate({
        id: document.id,
        doc: {
          ...document,
          ...{ content: annotator.text.value },
        },
      });
    }
  };

  const fetchEntity = async (anchor: string) => {
    const entity = await api.entitiesGet(anchor);
    return entity;
  };

  const addEntityToStore = (eid: string, entity: IEntity | false) => {
    storedEntities.current[eid] = entity;
  };

  const handleTextSelection = async (text: string, anchors: string[]) => {
    if (annotatorMode === "highlight") {
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
    }
  };

  const handleAddAnchor = (entityId: string) => {
    toast.info(
      `Anchor created ${entityId}. Do not forget to save the document.`
    );
    annotator.addAnchor(entityId);
    setSelectedText("");
  };

  useEffect(() => {
    if (!mainCanvas.current || !scroller.current) {
      return;
    }

    const annotator = new Annotator(
      mainCanvas.current,
      document?.content ?? "no text"
    );
    annotator.setMode("highlight");
    annotator.addScroller(scroller.current);

    annotator.cursor.setFillColor(theme.color.success);

    if (displayLineNumbers && lines.current) {
      annotator.addLines(lines.current);
    }
    annotator.onSelectText(({ text, anchors }) => {
      console.log("select", text, anchors);
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

    annotator.onTextChanged((text) => {
      // console.log("text changed", text);
      // setLocalText(text);
    });

    annotator.draw();
    setAnnotator(annotator);
  }, [document]);

  useEffect(() => {
    if (annotator) {
      console.log("resizing canvas", wTextArea, height);
      // annotator.resize(wTextArea, height);
      annotator.draw();
    }
  }, [width, height]);

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
        {annotatorMode === "highlight" && selectedText && (
          <TextAnnotatorMenu
            anchors={selectedAnchors}
            text={selectedText}
            entities={storedEntities.current}
            onAnchorAdd={handleAddAnchor}
            yPosition={menuPositionY}
            topBottomSelection={topBottomSelection}
            handleCreateTerritory={handleCreateTerritory}
            handleCreateStatement={() => {
              handleCreateStatement && handleCreateStatement(selectedText);
            }}
          />
        )}
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

          <Button
            label="save"
            color="primary"
            icon={<FaRegSave />}
            onClick={() => {
              handleSaveNewContent();
            }}
          />
        </ButtonGroup>
      )}
    </div>
  );
};

export default TextAnnotator;
