import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import React, { useEffect, useMemo, useRef, useState } from "react";
import { FaMarker, FaPen, FaRegSave, FaTrash } from "react-icons/fa";
import { toast } from "react-toastify";
import { v4 as uuidv4 } from "uuid";

import {
  Annotator,
  HighlightSchema,
  Mode,
} from "@inkvisitor/annotator/src/lib";
import { IDocument, IEntity } from "@shared/types";
import theme from "Theme/theme";
import api from "api";
import { Button } from "components/basic/Button/Button";
import { ButtonGroup } from "components/basic/ButtonGroup/ButtonGroup";
import { EntityColors } from "types";
import { useAnnotator } from "./AnnotatorContext";
import TextAnnotatorMenu from "./AnnotatorMenu";
import {
  StyledCanvasWrapper,
  StyledLinesCanvas,
  StyledMainCanvas,
  StyledScrollerCursor,
  StyledScrollerViewport,
} from "./AnnotatorStyles";
import { HiCodeBracket } from "react-icons/hi2";
import { BsFileTextFill } from "react-icons/bs";

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
      setAnnotatorMode("highlight");
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

  const obtainEntity = async (eid: string) => {
    if (Object.keys(storedEntities.current).includes(eid)) {
      return storedEntities.current[eid];
    } else {
      try {
        const entityRes = await fetchEntity(eid);
        if (entityRes && entityRes.data) {
          addEntityToStore(eid, entityRes.data);
          return entityRes.data;
        }
      } catch (error) {
        addEntityToStore(eid, false);
      }
    }
  };

  const handleTextSelection = async (text: string, anchors: string[]) => {
    if (annotatorMode === "highlight") {
      setSelectedText(text);
      setSelectedAnchors(anchors);

      for (const anchorI in anchors) {
        await obtainEntity(anchors[anchorI]);
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

  const refreshAnnotator = () => {
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
      // console.log("select", text, anchors);
      handleTextSelection(text, anchors);
    });

    annotator.onHighlight((entityId: string) => {
      const entity = storedEntities.current[entityId];
      if (entity) {
        const classItem = EntityColors[entity.class];
        const colorName = classItem?.color ?? "transparent";
        const color = theme.color[colorName] as string;

        return {
          mode: "background",
          style: {
            fillColor: color,
            fillOpacity: 0.2,
          },
        };
      } else {
        return {
          mode: "background",
          style: {
            fillColor: "transparent",
            fillOpacity: 0,
          },
        };
      }
    });

    annotator.onTextChanged((text) => {
      // console.log("text changed", text);
      // setLocalText(text);
    });

    annotator.draw();
    setAnnotator(annotator);
  };

  useEffect(() => {
    refreshAnnotator();
  }, [document]);

  useEffect(() => {
    if (annotator) {
      console.log("resizing canvas", wTextArea, height);
      // annotator.resize(wTextArea, height);
      setTimeout(() => {
        annotator.draw();
      }, 1000);
    }
  }, [width, height]);

  const topBottomSelection = useMemo<boolean>(() => {
    const selectedText = annotator?.cursor?.getSelected();

    return (selectedText?.[0]?.yLine ?? 0) < (selectedText?.[1]?.yLine ?? 0);
  }, [annotator?.cursor?.yLine]);

  const menuPositionY = useMemo<number>(() => {
    const yLine = annotator?.cursor?.yLine ?? 0;
    const lineHeight = annotator?.lineHeight ?? 0;

    return yLine * lineHeight + (topBottomSelection ? -50 : 50);
  }, [annotator?.cursor?.yLine, annotator?.lineHeight, topBottomSelection]);

  return (
    <div style={{ width: width }}>
      <StyledCanvasWrapper>
        {document && annotatorMode === "highlight" && selectedText && (
          <TextAnnotatorMenu
            anchors={selectedAnchors}
            document={document}
            text={selectedText}
            entities={storedEntities.current}
            onAnchorAdd={handleAddAnchor}
            yPosition={menuPositionY}
            topBottomSelection={topBottomSelection}
            handleCreateTerritory={() => {
              if (handleCreateTerritory && selectedText) {
                const newTerritoryId = uuidv4();
                handleAddAnchor(newTerritoryId);
                handleCreateTerritory(newTerritoryId);
              }
            }}
            handleCreateStatement={() => {
              if (handleCreateStatement && selectedText) {
                const newStatementId = uuidv4();
                handleAddAnchor(newStatementId);
                // remove linebreaks from text
                const validatedText = selectedText.replace(/\n/g, " ");
                handleCreateStatement(validatedText, newStatementId);
              }
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
            key="semi"
            icon={<BsFileTextFill size={11} />}
            color="success"
            label="text edit"
            inverted={annotatorMode !== "semi"}
            onClick={() => {
              annotator.setMode("semi");
              setAnnotatorMode("semi");
              annotator.draw();
            }}
            tooltipLabel="activate semi mode"
          />
          <Button
            key="raw"
            icon={<HiCodeBracket size={11} />}
            color="success"
            label="XML"
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
            disabled={annotator.text.value === document?.content}
            onClick={() => {
              handleSaveNewContent();
            }}
          />
          <Button
            label="discard changes"
            color="warning"
            icon={<FaTrash />}
            disabled={annotator.text.value === document?.content}
            onClick={() => {
              refreshAnnotator();
            }}
          />
        </ButtonGroup>
      )}
    </div>
  );
};

export default TextAnnotator;
