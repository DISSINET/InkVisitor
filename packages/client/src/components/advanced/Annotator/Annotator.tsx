import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import React, { useContext, useEffect, useMemo, useRef, useState } from "react";
import { FaPen, FaRegSave, FaTrash } from "react-icons/fa";
import { toast } from "react-toastify";
import { v4 as uuidv4 } from "uuid";

import { Annotator, Modes } from "@inkvisitor/annotator/src/lib";
import { IDocument, IEntity } from "@shared/types";
import api from "api";
import { Button } from "components/basic/Button/Button";
import { ButtonGroup } from "components/basic/ButtonGroup/ButtonGroup";
import { BsFileTextFill } from "react-icons/bs";
import { HiCodeBracket } from "react-icons/hi2";
import { ThemeContext } from "styled-components";
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
  const theme = useContext(ThemeContext);

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
      setAnnotatorMode(Modes.HIGHLIGHT);
    },
  });

  const { annotator, setAnnotator } = useAnnotator();

  const wLineNumbers = displayLineNumbers ? 50 : 0;
  const wScroll = 20;
  const wTextArea = width - wLineNumbers - wScroll;

  const mainCanvas = useRef(null);
  const scroller = useRef(null);
  const lines = useRef(null);

  const [annotatorMode, setAnnotatorMode] = useState<Modes>(Modes.HIGHLIGHT);

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
    if (annotatorMode === Modes.HIGHLIGHT) {
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
    annotator?.addAnchor(entityId);
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

    annotator.setMode(Modes.HIGHLIGHT);
    annotator.addScroller(scroller.current);

    annotator.cursor.setFillColor(theme?.color.success);

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
        const color = theme?.color[colorName] as string;

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

    annotator.onTextChanged((text) => {});

    annotator.draw();
    setAnnotator(annotator);
  };

  useEffect(() => {
    refreshAnnotator();
  }, [document, theme]);

  const topBottomSelection = useMemo<boolean>(() => {
    const selectedText = annotator?.cursor?.getSelected();

    return (selectedText?.[0]?.yLine ?? 0) < (selectedText?.[1]?.yLine ?? 0);
  }, [annotator?.cursor?.yLine]);

  const menuPositionY = useMemo<number>(() => {
    const yLine = annotator?.cursor?.yLine ?? 0;
    const lineHeight = annotator?.lineHeight ?? 0;

    return yLine * lineHeight + (topBottomSelection ? -50 : 50);
  }, [annotator?.cursor?.yLine, annotator?.lineHeight, topBottomSelection]);

  const madeAnyChanges = useMemo<boolean>(() => {
    return annotator?.text?.value !== document?.content;
  }, [annotator?.text?.value, document?.content]);

  return (
    <div style={{ width: width }}>
      <StyledCanvasWrapper>
        {document && annotatorMode === Modes.HIGHLIGHT && selectedText && (
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
            handleRemoveAnchor={(anchor: string) => {
              annotator?.removeAnchorFromSelection(anchor);
              handleSaveNewContent();
            }}
          />
        )}
        {displayLineNumbers && (
          <StyledLinesCanvas
            ref={lines}
            width={wLineNumbers}
            height={height}
            style={{
              backgroundColor: theme?.color.white,
              color: theme?.color.plain,
            }}
          />
        )}
        <StyledMainCanvas
          tabIndex={0}
          ref={mainCanvas}
          width={wTextArea}
          height={height}
          style={{
            backgroundColor: theme?.color.white,
            color: theme?.color.text,
          }}
        />
        <StyledScrollerViewport
          ref={scroller}
          style={{
            background: theme?.color.success,
          }}
        >
          <StyledScrollerCursor
            style={{ backgroundColor: theme?.color.primary }}
          />
        </StyledScrollerViewport>
      </StyledCanvasWrapper>

      {annotator && (
        <ButtonGroup>
          <Button
            key={Modes.HIGHLIGHT}
            icon={<FaPen size={11} />}
            label={Modes.HIGHLIGHT}
            color="success"
            inverted={annotatorMode !== Modes.HIGHLIGHT}
            onClick={() => {
              annotator.setMode(Modes.HIGHLIGHT);
              setAnnotatorMode(Modes.HIGHLIGHT);
              annotator.draw();
            }}
            tooltipLabel="activate syntax higlighting mode"
          />
          <Button
            key={Modes.SEMI}
            icon={<BsFileTextFill size={11} />}
            color="success"
            label="text edit"
            inverted={annotatorMode !== Modes.SEMI}
            onClick={() => {
              annotator.setMode(Modes.SEMI);
              setAnnotatorMode(Modes.SEMI);
              annotator.draw();
            }}
            tooltipLabel="activate semi mode"
          />
          <Button
            key={Modes.RAW}
            icon={<HiCodeBracket size={11} />}
            color="success"
            label="XML"
            inverted={annotatorMode !== Modes.RAW}
            onClick={() => {
              annotator.setMode(Modes.RAW);
              setAnnotatorMode(Modes.RAW);
              annotator.draw();
            }}
            tooltipLabel="activate edit mode"
          />

          <Button
            label="save"
            color="primary"
            icon={<FaRegSave />}
            disabled={!madeAnyChanges}
            onClick={() => {
              handleSaveNewContent();
            }}
          />
          <Button
            label="discard changes"
            color="warning"
            icon={<FaTrash />}
            disabled={!madeAnyChanges}
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
