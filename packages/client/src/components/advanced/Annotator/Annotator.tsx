import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import React, {
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react";
import { FaPen, FaRegSave, FaTrash } from "react-icons/fa";
import { toast } from "react-toastify";
import { v4 as uuidv4 } from "uuid";
import api from "api";

import { Annotator, Modes } from "@inkvisitor/annotator/src/lib";
import { IDocument, IEntity } from "@shared/types";
import { Button } from "components/basic/Button/Button";
import { ButtonGroup } from "components/basic/ButtonGroup/ButtonGroup";
import { BsFileTextFill } from "react-icons/bs";
import { HiCodeBracket } from "react-icons/hi2";
import { ThemeContext } from "styled-components";
import { EntityColors } from "types";
import { useAnnotator } from "./AnnotatorContext";
import TextAnnotatorMenu from "./AnnotatorMenu";
import {
  StyledAnnotatorMenu,
  StyledCanvasWrapper,
  StyledLinesCanvas,
  StyledMainCanvas,
  StyledScrollerCursor,
  StyledScrollerViewport,
} from "./AnnotatorStyles";
import { EntityEnums } from "@shared/enums";

interface TextAnnotatorProps {
  width: number;
  height: number;
  displayLineNumbers: boolean;
  documentId: string;
  handleCreateStatement?: Function | false;
  handleCreateTerritory?: Function | false;
  initialScrollEntityId?: false | string;
  thisTerritoryEntityId?: false | string;
}

export const TextAnnotator = ({
  width = 400,
  height = 500,
  displayLineNumbers = true,
  documentId,
  handleCreateStatement = false,
  handleCreateTerritory = false,
  initialScrollEntityId = false,
  thisTerritoryEntityId = false,
}: TextAnnotatorProps) => {
  const queryClient = useQueryClient();
  const theme = useContext(ThemeContext);

  const [isInitialized, setIsInitialized] = useState<boolean>(false);

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

  const updateDocumentMutationQuiet = useMutation({
    mutationFn: async (data: { id: string; doc: Partial<IDocument> }) =>
      api.documentUpdate(data.id, data.doc),
    onSuccess: (variables, data) => {
      queryClient.invalidateQueries({ queryKey: ["document"] });
      queryClient.invalidateQueries({ queryKey: ["documents"] });
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

  const [scrollAfterRefresh, setScrollAfterRefresh] = useState<
    number | undefined
  >(undefined);

  const handleSaveNewContent = (quiet: boolean) => {
    const scrollBeforeUpdate = annotator?.viewport?.lineStart;
    setScrollAfterRefresh(scrollBeforeUpdate);

    if (annotator && document?.id) {
      if (quiet) {
        updateDocumentMutationQuiet.mutate({
          id: document.id,
          doc: {
            ...document,
            ...{ content: annotator.text.value },
          },
        });
      } else {
        updateDocumentMutation.mutate({
          id: document.id,
          doc: {
            ...document,
            ...{ content: annotator.text.value },
          },
        });
      }
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
    handleSaveNewContent(true);
  };

  const refreshAnnotator = () => {
    if (!mainCanvas.current || !scroller.current) {
      return;
    }

    const annotator = new Annotator(
      mainCanvas.current,
      document?.content ?? "no text",
      2
    );

    annotator.setMode(Modes.HIGHLIGHT);
    annotator.addScroller(scroller.current);

    annotator.cursor.setStyle({
      selection: {
        fill: theme?.color.success,
        fillOpacity: 0.3,
      },
      cursor: {
        highlightFill: theme?.color.primary,
        defaultFill: theme?.color.primary,
      },
    });

    if (displayLineNumbers && lines.current) {
      annotator.addLines(lines.current);
    }
    annotator.onSelectText(({ text, anchors }) => {
      // console.log("select", text, anchors);
      handleTextSelection(text, anchors);
    });

    annotator.onHighlight((entityId: string) => {
      if (entityId === thisTerritoryEntityId) {
        return {
          mode: "background",
          style: {
            fillColor: theme?.color.warning,
            fillOpacity: 0.8,
          },
        };
      }

      const entityClass = document?.referencedEntityIds
        ? Object.keys(document?.referencedEntityIds).find((key) =>
            document?.referencedEntityIds?.[key as EntityEnums.Class].includes(
              entityId
            )
          )
        : undefined;

      if (entityClass) {
        const classItem = EntityColors[entityClass];
        const colorName = classItem?.color ?? "transparent";
        const color = theme?.color[colorName] as string;

        return {
          mode: "background",
          style: {
            fillColor: color,
            fillOpacity: 0.3,
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

    if (annotator && annotator.viewport) {
      if (!isInitialized) {
        if (initialScrollEntityId) {
          annotator.scrollToAnchor(initialScrollEntityId);
        }
        setIsInitialized(true);
      }
    }

    if (scrollAfterRefresh) {
      annotator.viewport.scrollTo(
        scrollAfterRefresh,
        annotator.text.lines.length
      );
      setScrollAfterRefresh(undefined);
    }
  };

  useEffect(() => {
    refreshAnnotator();
  }, [document, theme]);

  useEffect(() => {
    setIsInitialized(false);
    refreshAnnotator();
  }, [initialScrollEntityId]);

  const topBottomSelection = useMemo<boolean>(() => {
    const yStart = annotator?.cursor?.selectStart?.yLine;
    const yEnd = annotator?.cursor?.selectEnd?.yLine;

    if (!yStart || !yEnd) {
      return false;
    } else {
      return yStart < yEnd;
    }
  }, [annotator?.cursor?.yLine]);

  const menuPositionY = useMemo<number>(() => {
    const yLine = annotator?.cursor?.yLine ?? 0;
    const lineHeight = (annotator?.lineHeight ?? 0) / 2;

    return yLine * lineHeight + (topBottomSelection ? -50 : 50);
  }, [annotator?.cursor?.yLine, annotator?.lineHeight, topBottomSelection]);

  const madeAnyChanges = useMemo<boolean>(() => {
    return annotator?.text?.value !== document?.content;
  }, [annotator?.text?.value, document?.content]);

  const onCreateTerritory = useCallback(() => {
    if (handleCreateTerritory && selectedText) {
      const newTerritoryId = uuidv4();
      handleAddAnchor(newTerritoryId);
      handleCreateTerritory(newTerritoryId);
      handleSaveNewContent(true);
    }
  }, [handleCreateTerritory, selectedText]);

  const onCreateStatement = useCallback(() => {
    if (handleCreateStatement && selectedText) {
      const newStatementId = uuidv4();
      handleAddAnchor(newStatementId);
      // remove linebreaks from text
      const validatedText = selectedText.replace(/\n/g, " ");
      handleCreateStatement(validatedText, newStatementId);
      handleSaveNewContent(true);
    }
  }, [handleCreateStatement, selectedText]);

  const onRemoveAnchor = (anchor: string) => {
    annotator?.removeAnchorFromSelection(anchor);
    handleSaveNewContent(true);
  };

  return (
    <div style={{ width: width, position: "absolute" }}>
      <StyledCanvasWrapper>
        {document && annotatorMode === Modes.HIGHLIGHT && selectedText && (
          <StyledAnnotatorMenu
            $top={menuPositionY}
            $left={100}
            // $translateY={"100%"}
            $translateY={topBottomSelection ? "-100%" : "0%"}
          >
            <TextAnnotatorMenu
              anchors={selectedAnchors}
              document={document}
              text={selectedText}
              entities={storedEntities.current}
              onAnchorAdd={handleAddAnchor}
              handleCreateTerritory={onCreateTerritory}
              handleCreateStatement={onCreateStatement}
              handleRemoveAnchor={onRemoveAnchor}
            />
          </StyledAnnotatorMenu>
        )}

        {displayLineNumbers && (
          <StyledLinesCanvas
            ref={lines}
            width={wLineNumbers}
            height={height}
            style={{
              outline: "none",
              backgroundColor: theme?.color.white,
              color: theme?.color.plain,
            }}
          />
        )}
        <StyledMainCanvas
          tabIndex={0}
          ref={mainCanvas}
          style={{
            height: height,
            width: wTextArea,
            backgroundColor: theme?.color.white,
            color: theme?.color.text,
            outline: "none",
          }}
        />
        <StyledScrollerViewport
          ref={scroller}
          style={{
            background: theme?.color.grey,
          }}
        >
          <StyledScrollerCursor
            style={{
              backgroundColor: theme?.color.primary,
            }}
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
              handleSaveNewContent(false);
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
